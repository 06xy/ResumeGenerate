const JSON_FENCE_RE = /^```(?:json)?\s*|\s*```$/g;

const getContentText = (content) => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.text || item?.content || "";
    })
    .join("");
};

const getChatContent = (payload) => {
  const choice = payload?.choices?.[0];
  const message = choice?.message || {};
  return (
    getContentText(message.content) ||
    getContentText(choice?.text) ||
    getResponsesOutputText(payload) ||
    getContentText(payload?.output_text) ||
    getContentText(payload?.content) ||
    ""
  );
};

const getResponsesOutputText = (payload) => {
  if (!Array.isArray(payload?.output)) return "";

  return payload.output
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .filter((item) => item?.type === "output_text" || item?.type === "text")
    .map((item) => item?.text || "")
    .join("");
};

const getFinishReason = (payload) => payload?.choices?.[0]?.finish_reason || "";

const getReasoningContent = (payload) => getContentText(payload?.choices?.[0]?.message?.reasoning_content);

const parseJsonObject = (content) => {
  const trimmed = String(content || "").trim().replace(JSON_FENCE_RE, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const jsonText = start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed;
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    error.code = "INVALID_JSON";
    throw error;
  }
};

const createGenerationError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const buildRetryMessages = (messages, attempt) => {
  if (attempt === 0) return messages;

  return [
    ...messages,
    {
      role: "user",
      content:
        "上一次回复没有得到完整的最终 JSON，可能是推理内容过长导致截断。请用最短路径完成任务，不要输出推理过程、解释、Markdown 或代码块，只输出一个符合要求的 JSON 对象。",
    },
  ];
};

const buildRequestBody = ({ settings, messages, maxTokens, responseFormat, temperature, attempt, omitTemperature, omitResponseFormat }) => {
  const retryMultiplier = attempt === 0 ? 1 : attempt === 1 ? 2 : 4;
  const body = {
    model: settings.modelId.trim(),
    messages: buildRetryMessages(messages, attempt),
  };

  if (!settings.isReasoningModel) {
    body.max_tokens = Math.round(maxTokens * retryMultiplier);
  }

  if (!omitTemperature) {
    body.temperature = temperature;
  }

  if (!omitResponseFormat) {
    body.response_format = responseFormat;
  }

  return body;
};

const requestJsonCompletion = async ({
  settings,
  messages,
  maxTokens = 1200,
  responseFormat = { type: "json_object" },
  temperature = 0.35,
}) => {
  let lastError = null;
  let omitTemperature = Boolean(settings.isReasoningModel);
  let currentResponseFormat = responseFormat;
  let omitResponseFormat = !currentResponseFormat;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const payload = await requestCompletionPayload({
        settings,
        body: buildRequestBody({
          settings,
          messages,
          maxTokens,
          responseFormat: currentResponseFormat,
          temperature,
          attempt,
          omitTemperature,
          omitResponseFormat,
        }),
      });
      const content = getChatContent(payload);
      const finishReason = getFinishReason(payload);
      const reasoningContent = getReasoningContent(payload);

      if (!content.trim()) {
        lastError = createGenerationError(
          finishReason === "length" || reasoningContent
            ? "AI 推理内容过长，最终 JSON 被截断，已自动重试"
            : "AI 暂未输出最终 JSON，已自动重试",
          finishReason === "length" ? "TRUNCATED_OUTPUT" : "EMPTY_CONTENT",
        );
        continue;
      }

      return parseJsonObject(content);
    } catch (error) {
      lastError = error;
      if (isTokenParameterError(error) && !settings.isReasoningModel) continue;
      if (isTemperatureParameterError(error) && !omitTemperature) {
        omitTemperature = true;
        continue;
      }
      if (isJsonSchemaParameterError(error) && currentResponseFormat?.type === "json_schema") {
        currentResponseFormat = { type: "json_object" };
        continue;
      }
      if (isResponseFormatParameterError(error) && !omitResponseFormat) {
        omitResponseFormat = true;
        continue;
      }
      if (!isRetryableGenerationError(error) || attempt === 2) break;
    }
  }

  throw lastError || new Error("AI 返回内容为空");
};

const isRetryableGenerationError = (error) =>
  ["EMPTY_CONTENT", "INVALID_JSON", "TRUNCATED_OUTPUT"].includes(error?.code) ||
  /JSON|内容为空|最终内容|截断/.test(error?.message || "");

const isTokenParameterError = (error) => /max_tokens|max_completion_tokens/i.test(error?.message || "");

const isTemperatureParameterError = (error) => /temperature/i.test(error?.message || "");

const isResponseFormatParameterError = (error) => /response_format|json_object/i.test(error?.message || "");

const isJsonSchemaParameterError = (error) => /json_schema|schema|strict/i.test(error?.message || "");

const requestCompletionPayload = async ({ settings, body }) => {
  const response = await fetch(settings.endpoint.trim(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = `AI 生成失败：HTTP ${response.status}`;
    try {
      const errorPayload = await response.json();
      message = errorPayload?.error?.message || message;
    } catch {
      // Keep the HTTP status message for non-JSON error responses.
    }
    throw new Error(message);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("AI 响应不是有效 JSON");
  }
};

const createSourcePayload = ({ draft, materials }) => ({
  targetRole: draft.role.trim(),
  jobDescriptionFromHr: draft.description.trim(),
  experienceMaterials: materials.map((item, index) => ({
    index: index + 1,
    content: item,
  })),
});

export const extractJobFromScreenshot = ({ settings, imageDataUrl }) =>
  requestJsonCompletion({
    settings,
    maxTokens: 1600,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "你是招聘职位截图识别助手。请从用户上传的招聘软件截图中提取职位名称和岗位描述。只提取截图中可见的信息，不要编造，不要输出分析过程，只返回 JSON。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "从这张招聘职位截图中识别目标岗位和岗位描述。岗位描述应尽量包含岗位职责、任职要求、加分项、技术栈等招聘方发布的原始信息。返回格式：{\"role\":\"职位名称\",\"description\":\"岗位描述\"}",
          },
          {
            type: "image_url",
            image_url: {
              url: imageDataUrl,
            },
          },
        ],
      },
    ],
  });

export const planResumeSections = ({ settings, draft, materials }) =>
  requestJsonCompletion({
    settings,
    maxTokens: 2400,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "resume_section_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["skills", "work", "internships", "projects", "campus", "awards", "priority"],
          properties: {
            skills: { type: "boolean" },
            work: { type: "boolean" },
            internships: { type: "boolean" },
            campus: { type: "boolean" },
            projects: { type: "boolean" },
            awards: { type: "boolean" },
            priority: {
              type: "array",
              items: {
                type: "string",
                enum: ["skills", "work", "internships", "projects", "campus", "awards"],
              },
            },
          },
        },
      },
    },
    temperature: 0.15,
    messages: [
      {
        role: "system",
        content:
          "你是简历结构规划助手。只能根据用户提供的目标岗位、HR岗位描述和经历素材判断简历模板中应保留哪些板块。不要使用任何现有模板示例内容，不要编造经历，不要读取基本信息。不要输出分析过程。返回 JSON 顶层必须且只能包含 skills、work、internships、projects、campus、awards、priority 字段，禁止包裹 sections 字段。",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "判断专业技能、工作经历、实习经历、项目经历、校园经历、奖项证书六个板块是否应该保留，并给出从高到低的展示优先级。专业技能用于总结岗位相关能力，有明确技能或项目素材时通常保留；工作经历只在素材明确包含正式工作、全职、公司任职、在职交付等信息时保留；实习经历只在素材明确包含实习、实习生、实习岗位等信息时保留；项目经历用于承载项目、系统建设、产品开发、课程项目等不应归入正式工作或实习的经历；校园经历只在素材明确包含学校、社团、学生组织、竞赛、课程设计、校园活动等经历时保留；奖项证书只在素材明确包含奖项、证书、比赛获奖、资格认证、英语等级、计算机等级等信息时保留。目标是一页简历：素材少时可以保留更多相关板块；只有一页放不下时才压缩低优先级内容。",
          requiredOutput: {
            skills: "boolean",
            work: "boolean",
            internships: "boolean",
            campus: "boolean",
            projects: "boolean",
            awards: "boolean",
            priority: ["skills", "work", "internships", "projects", "campus", "awards"],
          },
          forbiddenOutput: {
            sections: "不要返回这个字段，也不要把结果包在 sections 里",
          },
          source: createSourcePayload({ draft, materials }),
        }),
      },
    ],
  });

const experienceSectionConfig = {
  work: {
    label: "工作经历",
    outputKey: "work",
    instruction:
      "生成 1 到 2 条工作经历。只使用素材中明确属于正式工作、全职、公司任职或在职交付的经历。JSON 字段保持固定，但字段内容必须是自然简历文本，不要在内容里写“背景：”“重点：”“行动：”“技术栈：”等标签。",
  },
  internships: {
    label: "实习经历",
    outputKey: "internships",
    instruction:
      "生成 1 到 2 条实习经历。只使用素材中明确属于实习或实习生岗位的经历。JSON 字段保持固定，但字段内容必须是自然简历文本，不要在内容里写“背景：”“重点：”“行动：”“技术栈：”等标签。",
  },
  projects: {
    label: "项目经历",
    outputKey: "projects",
    instruction:
      "生成 1 到 2 条项目经历。使用素材中的项目、系统建设、产品开发、课程项目等经历，不要把明确的正式工作或实习重复写入项目经历。JSON 字段保持固定，但字段内容必须是自然简历文本，不要在内容里写“项目背景：”“项目难点：”“行动：”“技术栈：”等标签。",
  },
};

export const generateSkills = ({ settings, draft, materials }) =>
  requestJsonCompletion({
    settings,
    maxTokens: 2400,
    messages: [
      {
        role: "system",
        content:
          "你是中文技术简历写作助手。只能基于用户提供的目标岗位、HR岗位描述和经历素材生成内容。专业技能必须写成简历技能栏的能力等级句式，每条必须以“精通”“熟练掌握”“掌握”“熟悉”“了解”“具备”之一开头，例如“熟练掌握 Vue 3、TypeScript、Vite，具备组件封装和页面开发经验”。专业技能条目末尾不要使用句号、逗号、分号或其他收尾标点。禁止用“能够”“能”“可以”“参与”“负责”“在项目中”等普通叙述开头。写作必须像真实候选人的简历，而不是把招聘 JD 改写成第一人称。不要复刻 JD 的门槛词、招聘口吻或要求语气，例如“至少会”“优先”“加分项”“任职要求”“岗位职责”“需要具备”“熟练掌握者优先”。不要读取或复述任何现有模板示例内容，不要编造学校、公司、项目成果或数字。不要输出分析过程，只返回 JSON。",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "生成专业技能板块。输出 5 到 7 条中文技能描述。每条必须采用“能力等级 + 技术点 + 可证明的能力边界”的格式，开头只能使用：精通、熟练掌握、掌握、熟悉、了解、具备。每条末尾不要加句号、逗号、分号或其他收尾标点。不要使用“能够”“能”“可以”开头。参考 HR 岗位描述只用于判断岗位关注点，不要照抄其中的条件句、门槛词或招聘话术。每条应从经历素材中提炼真实能力，语气克制、自然、可信，重点写技术栈、开发能力、联调协作、问题排查和项目交付能力。",
          outputSchema: {
            skills: ["string"],
          },
          source: createSourcePayload({ draft, materials }),
        }),
      },
    ],
  });

export const generateCampus = ({ settings, draft, materials }) =>
  requestJsonCompletion({
    settings,
    maxTokens: 2200,
    messages: [
      {
        role: "system",
        content:
          "你是中文简历校园经历写作助手。只能基于用户提供的目标岗位、HR岗位描述和经历素材生成内容。不要使用任何现有模板示例内容，不要编造组织、奖项、时间或职位。不要输出分析过程，只返回 JSON。",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "生成校园经历板块。如果素材中没有明确名称，可用概括性标题。正文写成一段，突出和目标岗位相关的职责、协作、技术实践或活动结果。",
          outputSchema: {
            campus: {
              title: "string",
              body: "string",
            },
          },
          source: createSourcePayload({ draft, materials }),
        }),
      },
    ],
  });

export const generateExperienceSection = ({ settings, draft, materials, sectionKey }) => {
  const config = experienceSectionConfig[sectionKey] || experienceSectionConfig.projects;
  return requestJsonCompletion({
    settings,
    maxTokens: 3600,
    messages: [
      {
        role: "system",
        content:
          `你是中文${config.label}简历写作助手。只能基于用户提供的目标岗位、HR岗位描述和经历素材生成${config.label}。写作必须像真实经历复盘，不能像为了迎合 JD 而堆关键词。不要复刻 JD 的招聘话术或门槛表达，例如“至少会”“优先”“加分项”“任职要求”“岗位职责”“需要具备”“熟练掌握者优先”。相关技能字段只列实际技术、框架、工具名称，不写能力门槛句。不要使用任何现有模板示例内容，不要编造不存在的项目、公司、时间、量化结果。为了适配一页简历，每条行动最多 2 条，每条行动一句话。不要输出分析过程，只返回 JSON。`,
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            `${config.instruction}参考 HR 岗位描述只用于选择突出哪些素材，不要把 JD 原句写进经历。background 写业务或任务场景，challenge 写真实工程问题或职责重点，actions 写候选人实际做了什么，stack 只写技术、框架或工具名称。所有正文内容都禁止使用数字序号、中文冒号引导、字段名、招聘口吻和模板化小标题。没有明确时间时使用“时间待补充”；没有明确技术栈时从素材可见技术中提炼，不能凭空添加。`,
          outputSchema: {
            [config.outputKey]: [
              {
                name: "string",
                role: "string",
                time: "string",
                background: "string",
                challenge: "string",
                actions: ["string"],
                stack: "string",
              },
            ],
          },
          source: createSourcePayload({ draft, materials }),
        }),
      },
    ],
  });
};

export const generateProjects = ({ settings, draft, materials }) =>
  generateExperienceSection({ settings, draft, materials, sectionKey: "projects" });

export const generateAwards = ({ settings, draft, materials }) =>
  requestJsonCompletion({
    settings,
    maxTokens: 1400,
    messages: [
      {
        role: "system",
        content:
          "你是中文简历奖项证书整理助手。只能基于用户提供的目标岗位、HR岗位描述和经历素材提取奖项、证书、资格认证、英语等级、计算机等级等名称。不要生成描述，不要编造证书，不要输出分析过程，只返回 JSON。",
      },
      {
        role: "user",
        content: JSON.stringify({
          task:
            "提取 1 到 5 个奖项或证书名称。只写名称本身，例如“CET-4”“计算机二级”“蓝桥杯省赛二等奖”。不要写时间、颁发方、说明文字或换行内容。输出数组顺序按和目标岗位的相关性从高到低排列。",
          outputSchema: {
            awards: ["string"],
          },
          source: createSourcePayload({ draft, materials }),
        }),
      },
    ],
  });
