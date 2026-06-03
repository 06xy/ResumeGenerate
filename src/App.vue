<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import AiConfigPanel from "./components/AiConfigPanel.vue";
import BasicInfoPanel from "./components/BasicInfoPanel.vue";
import ExperiencePanel from "./components/ExperiencePanel.vue";
import GeneratePanel from "./components/GeneratePanel.vue";
import ResumePreview from "./components/ResumePreview.vue";
import TemplatePanel from "./components/TemplatePanel.vue";
import ToastNotice from "./components/ToastNotice.vue";
import {
  extractJobFromScreenshot,
  generateAwards,
  generateCampus,
  generateExperienceSection,
  generateSkills,
  planResumeSections,
} from "./services/aiResume";
import {
  defaultAiSettings,
  defaultBasicInfo,
  defaultExperienceMaterials,
  defaultGenerationDraft,
  resume as defaultResume,
  resumeTemplates,
  tabs,
} from "./data/resumeData";
import {
  AI_SETTINGS_KEY,
  BASIC_INFO_KEY,
  EXPERIENCE_MATERIALS_KEY,
  LEGACY_PHOTO_SETTINGS_KEY,
} from "./constants/storageKeys";

const activeTab = ref("generate");
const resumePreviewRef = ref(null);
const isExportingPdf = ref(false);
const isTestingAi = ref(false);
const isGeneratingResume = ref(false);
const isExtractingJob = ref(false);
const generationProgress = ref(0);
const generationStepText = ref("");
const loadingSections = ref({
  skills: false,
  campus: false,
  work: false,
  internships: false,
  projects: false,
  awards: false,
});

const activeTemplateId = ref(resumeTemplates[0].id);
const resume = ref(structuredClone(defaultResume));
const experienceMaterials = ref([...defaultExperienceMaterials]);
const generationDraft = ref({ ...defaultGenerationDraft });
const jobScreenshot = ref("");
const aiSettings = ref({ ...defaultAiSettings });
const basicInfoDraft = ref({ ...defaultBasicInfo });
const resumeBasicInfo = ref({ ...defaultBasicInfo });
const photoDraft = ref("");
const resumePhotoSrc = ref("");

const toast = ref({
  visible: false,
  type: "success",
  message: "",
});

const SECTION_KEYS = ["skills", "work", "internships", "projects", "campus", "awards"];
const SECTION_LABELS = {
  skills: "专业技能",
  work: "工作经历",
  internships: "实习经历",
  projects: "项目经历",
  campus: "校园经历",
  awards: "奖项证书",
};
const EXPERIENCE_SECTION_KEYS = ["work", "internships", "projects"];

let toastTimer = null;

const createResumeInfoLines = (basicInfo) => [
  `${basicInfo.gender}｜${basicInfo.phone}｜${basicInfo.email}`,
  `${basicInfo.schoolInfo}｜${basicInfo.majorInfo}`,
];

const resumeInfoLines = ref(createResumeInfoLines(defaultBasicInfo));

const activeTabLabel = computed(() => tabs.find((tab) => tab.id === activeTab.value)?.label ?? "");
const activeTemplate = computed(
  () => resumeTemplates.find((template) => template.id === activeTemplateId.value) ?? resumeTemplates[0],
);

const updatePreviewBasicInfo = (key, value) => {
  resumeBasicInfo.value = {
    ...resumeBasicInfo.value,
    [key]: value,
  };
  basicInfoDraft.value = {
    ...basicInfoDraft.value,
    [key]: value,
  };
};

const updateResumeInfoLine = (index, value) => {
  resumeInfoLines.value[index] = value;
};

const updateResumeSkill = (index, value) => {
  resume.value.skills[index] = value;
};

const updateResumeCampus = (key, value) => {
  resume.value.campus[key] = value;
};

const updateResumeExperience = ({ sectionKey, index, key, value }) => {
  if (!Array.isArray(resume.value[sectionKey]) || !resume.value[sectionKey][index]) return;
  resume.value[sectionKey][index][key] = value;
};

const updateResumeExperienceAction = ({ sectionKey, itemIndex, actionIndex, value }) => {
  const item = resume.value[sectionKey]?.[itemIndex];
  if (!item?.actions || actionIndex < 0 || actionIndex >= item.actions.length) return;
  item.actions[actionIndex] = value;
};

const updateResumeAwards = (value) => {
  resume.value.awards = String(value || "")
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const updateResumeSectionTitle = (key, value) => {
  resume.value.sectionTitles[key] = value;
};

const updateResumeProjectLabel = (key, value) => {
  resume.value.projectLabels[key] = value;
};

const selectResumeTemplate = (templateId) => {
  const template = resumeTemplates.find((item) => item.id === templateId);
  if (!template) return;

  activeTemplateId.value = template.id;
  showToast(`已切换为${template.name}布局`);
};

const showToast = (message, type = "success") => {
  toast.value = { visible: true, type, message };
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 2600);
};

const addExperienceMaterial = () => {
  experienceMaterials.value.push("");
};

const removeExperienceMaterial = (index) => {
  experienceMaterials.value.splice(index, 1);
  if (!experienceMaterials.value.length) {
    addExperienceMaterial();
  }
};

const updateExperienceMaterial = (index, value) => {
  experienceMaterials.value[index] = value;
};

const saveExperienceMaterials = () => {
  const normalized = experienceMaterials.value.map((item) => item.trim()).filter(Boolean);
  experienceMaterials.value = normalized.length ? normalized : [""];
  localStorage.setItem(EXPERIENCE_MATERIALS_KEY, JSON.stringify(experienceMaterials.value));
  showToast("经验素材已保存");
};

const updateGenerationDraft = (nextDraft) => {
  generationDraft.value = nextDraft;
};

const updateJobScreenshot = (imageDataUrl) => {
  jobScreenshot.value = imageDataUrl;
  showToast("职位截图已上传");
};

const extractJobDraftFromScreenshot = async () => {
  if (!jobScreenshot.value) {
    showToast("请先上传职位截图", "error");
    return;
  }

  if (!validateAiSettings() || isExtractingJob.value) return;

  isExtractingJob.value = true;
  try {
    const payload = await extractJobFromScreenshot({
      settings: aiSettings.value,
      imageDataUrl: jobScreenshot.value,
    });
    const role = String(payload?.role || "").trim();
    const description = String(payload?.description || "").trim();

    if (!role && !description) {
      showToast("未能从截图中识别到职位信息", "error");
      return;
    }

    generationDraft.value = {
      ...generationDraft.value,
      role: role || generationDraft.value.role,
      description: description || generationDraft.value.description,
    };
    showToast("职位截图识别完成");
  } catch (error) {
    showToast(error?.message || "截图识别失败，请确认模型支持多模态输入", "error");
  } finally {
    isExtractingJob.value = false;
  }
};

const normalizeMaterials = () => experienceMaterials.value.map((item) => item.trim()).filter(Boolean);

const resetLoadingSections = () => {
  loadingSections.value = {
    skills: false,
    campus: false,
    work: false,
    internships: false,
    projects: false,
    awards: false,
  };
};

const setGenerationStep = (progress, text) => {
  generationProgress.value = progress;
  generationStepText.value = text;
};

const normalizeSectionPlan = (plan) => {
  const sections = plan?.sections || plan || {};
  const enabledKeys = SECTION_KEYS.filter((key) => Boolean(sections[key]));
  const priority = Array.isArray(sections.priority)
    ? sections.priority.filter((key) => SECTION_KEYS.includes(key))
    : [];

  return {
    skills: Boolean(sections.skills),
    work: Boolean(sections.work),
    internships: Boolean(sections.internships),
    projects: Boolean(sections.projects),
    campus: Boolean(sections.campus),
    awards: Boolean(sections.awards),
    priority: [...new Set([...priority, ...enabledKeys])],
  };
};

const applySkippedSections = (plan) => {
  if (!plan.skills) {
    resume.value.skills = [];
  }

  for (const sectionKey of EXPERIENCE_SECTION_KEYS) {
    if (!plan[sectionKey]) {
      resume.value[sectionKey] = [];
    }
  }

  if (!plan.campus) {
    resume.value.campus = {
      title: "",
      body: "",
    };
  }

  if (!plan.awards) {
    resume.value.awards = [];
  }
};

const normalizeSkills = (payload) => {
  const skills = Array.isArray(payload?.skills) ? payload.skills : [];
  const levelPrefixPattern = /^(精通|熟练掌握|掌握|熟悉|了解|具备)/;
  return skills
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => item.replace(/[。.!！；;，,、\s]+$/g, ""))
    .map((item) => (levelPrefixPattern.test(item) ? item : `熟悉${item.replace(/^(能够|能|可以)/, "")}`));
};

const normalizeCampus = (payload) => {
  const campus = payload?.campus || {};
  return {
    title: String(campus.title || "校园经历").trim(),
    body: String(campus.body || "").trim(),
  };
};

const normalizeExperienceItems = (payload, sectionKey) => {
  const items = Array.isArray(payload?.[sectionKey]) ? payload[sectionKey] : [];
  return items
    .map((item) => ({
      name: String(item?.name || "").trim(),
      role: String(item?.role || "").trim(),
      time: String(item?.time || "时间待补充").trim(),
      background: String(item?.background || "").trim(),
      challenge: String(item?.challenge || "").trim(),
      actions: Array.isArray(item?.actions)
        ? item.actions
            .map((action) => String(action || "").trim())
            .filter(Boolean)
            .slice(0, 2)
        : [],
      stack: String(item?.stack || "").trim(),
    }))
    .filter((item) => item.name || item.background || item.actions.length)
    .slice(0, 2);
};

const normalizeAwards = (payload) => {
  const awards = Array.isArray(payload?.awards) ? payload.awards : [];
  return awards
    .map((item) => String(item || "").trim().replace(/[。.!！；;，,\s]+$/g, ""))
    .filter(Boolean)
    .slice(0, 5);
};

const getPriorityRank = (priority = []) => {
  const ordered = priority.length ? priority : SECTION_KEYS;
  return SECTION_KEYS.reduce((ranks, key) => {
    const index = ordered.indexOf(key);
    ranks[key] = index >= 0 ? index : SECTION_KEYS.length;
    return ranks;
  }, {});
};

const getLowPriorityKeys = (priority = []) => {
  const ranks = getPriorityRank(priority);
  return [...SECTION_KEYS].sort((a, b) => ranks[b] - ranks[a]);
};

const isResumeOverflowing = () => {
  const page = resumePreviewRef.value?.getPageElement?.();
  if (!page) return false;

  const minHeight = Number.parseFloat(window.getComputedStyle(page).minHeight);
  const maxHeight = Number.isFinite(minHeight) && minHeight > 0 ? minHeight : 1123;
  return page.scrollHeight > maxHeight + 6;
};

const trimExperienceActions = (sectionKey) => {
  const item = resume.value[sectionKey]?.find((entry) => entry.actions?.length > 1);
  if (!item) return false;

  item.actions.pop();
  return true;
};

const trimExperienceItem = (sectionKey) => {
  if ((resume.value[sectionKey] || []).length <= 1) return false;

  resume.value[sectionKey].pop();
  return true;
};

const trimTextField = (sectionKey, key, maxLength) => {
  const item = resume.value[sectionKey]?.find((entry) => String(entry[key] || "").length > maxLength);
  if (!item) return false;

  item[key] = `${String(item[key]).slice(0, maxLength).replace(/[，,、；;\s]+$/g, "")}`;
  return true;
};

const trimCampus = () => {
  if (!resume.value.campus?.body) return false;

  if (resume.value.campus.body.length > 90) {
    resume.value.campus.body = resume.value.campus.body.slice(0, 90).replace(/[，,、；;\s]+$/g, "");
    return true;
  }

  resume.value.campus = { title: "", body: "" };
  return true;
};

const removeSectionContent = (sectionKey) => {
  if (sectionKey === "skills" && resume.value.skills.length) {
    resume.value.skills = [];
    return true;
  }

  if (EXPERIENCE_SECTION_KEYS.includes(sectionKey) && resume.value[sectionKey]?.length) {
    resume.value[sectionKey] = [];
    return true;
  }

  if (sectionKey === "campus" && (resume.value.campus.title || resume.value.campus.body)) {
    resume.value.campus = { title: "", body: "" };
    return true;
  }

  if (sectionKey === "awards" && resume.value.awards.length) {
    resume.value.awards = [];
    return true;
  }

  return false;
};

const runOnePageTrimStep = (priority = []) => {
  const lowPriorityKeys = getLowPriorityKeys(priority);

  for (const sectionKey of lowPriorityKeys.filter((key) => EXPERIENCE_SECTION_KEYS.includes(key))) {
    if (trimExperienceActions(sectionKey)) return true;
  }

  if (resume.value.skills.length > 5) {
    resume.value.skills.pop();
    return true;
  }

  if (resume.value.awards.length > 3) {
    resume.value.awards.pop();
    return true;
  }

  for (const sectionKey of lowPriorityKeys.filter((key) => EXPERIENCE_SECTION_KEYS.includes(key))) {
    if (trimTextField(sectionKey, "challenge", 70)) return true;
    if (trimTextField(sectionKey, "background", 78)) return true;
    if (trimTextField(sectionKey, "stack", 48)) return true;
  }

  if (resume.value.skills.length > 4) {
    resume.value.skills.pop();
    return true;
  }

  if (resume.value.awards.length > 2) {
    resume.value.awards.pop();
    return true;
  }

  for (const sectionKey of lowPriorityKeys.filter((key) => EXPERIENCE_SECTION_KEYS.includes(key))) {
    if (trimExperienceItem(sectionKey)) return true;
  }

  if (trimCampus()) return true;

  if (resume.value.awards.length > 1) {
    resume.value.awards.pop();
    return true;
  }

  for (const sectionKey of lowPriorityKeys) {
    if (sectionKey !== "skills" && removeSectionContent(sectionKey)) return true;
  }

  return false;
};

const fitResumeToOnePage = async (priority = []) => {
  await nextTick();

  let changed = false;
  for (let count = 0; count < 24 && isResumeOverflowing(); count += 1) {
    if (!runOnePageTrimStep(priority)) break;
    changed = true;
    await nextTick();
  }

  if (changed) {
    setGenerationStep(96, "已按一页简历压缩低优先级内容");
  }
};

const generateResume = async () => {
  if (!generationDraft.value.role.trim()) {
    showToast("请填写目标岗位", "error");
    return;
  }

  if (!generationDraft.value.description.trim()) {
    showToast("请填写岗位描述", "error");
    return;
  }

  const materials = normalizeMaterials();
  if (!materials.length) {
    showToast("请先在经验管理中填写经历素材", "error");
    return;
  }

  if (!validateAiSettings() || isGeneratingResume.value) return;

  isGeneratingResume.value = true;
  generationProgress.value = 0;
  resetLoadingSections();

  try {
    setGenerationStep(8, "正在分析岗位描述和经历素材");
    const sectionPlan = normalizeSectionPlan(
      await planResumeSections({
        settings: aiSettings.value,
        draft: generationDraft.value,
        materials,
      }),
    );

    if (!SECTION_KEYS.some((key) => sectionPlan[key])) {
      sectionPlan.skills = true;
      sectionPlan.priority = ["skills"];
    }

    applySkippedSections(sectionPlan);
    setGenerationStep(24, "已确定需要生成的简历板块");

    const planOrder = sectionPlan.priority.length ? sectionPlan.priority : SECTION_KEYS;
    const selectedSections = planOrder
      .filter((key) => sectionPlan[key])
      .map((key) => ({ key, label: SECTION_LABELS[key] }));

    for (const [index, section] of selectedSections.entries()) {
      const startProgress = 24 + Math.round((index / selectedSections.length) * 66);
      const endProgress = 24 + Math.round(((index + 1) / selectedSections.length) * 66);
      loadingSections.value = {
        ...loadingSections.value,
        [section.key]: true,
      };
      setGenerationStep(startProgress, `正在生成${section.label}`);

      if (section.key === "skills") {
        const payload = await generateSkills({
          settings: aiSettings.value,
          draft: generationDraft.value,
          materials,
        });
        const skills = normalizeSkills(payload);
        resume.value.skills = skills.length ? skills : ["请补充更多经历素材后重新生成专业技能。"];
      }

      if (section.key === "campus") {
        const payload = await generateCampus({
          settings: aiSettings.value,
          draft: generationDraft.value,
          materials,
        });
        resume.value.campus = normalizeCampus(payload);
      }

      if (EXPERIENCE_SECTION_KEYS.includes(section.key)) {
        const payload = await generateExperienceSection({
          settings: aiSettings.value,
          draft: generationDraft.value,
          materials,
          sectionKey: section.key,
        });
        resume.value[section.key] = normalizeExperienceItems(payload, section.key);
      }

      if (section.key === "awards") {
        const payload = await generateAwards({
          settings: aiSettings.value,
          draft: generationDraft.value,
          materials,
        });
        resume.value.awards = normalizeAwards(payload);
      }

      loadingSections.value = {
        ...loadingSections.value,
        [section.key]: false,
      };
      setGenerationStep(endProgress, `${section.label}已生成`);
    }

    await fitResumeToOnePage(sectionPlan.priority);
    setGenerationStep(100, "简历生成完成");
    showToast("简历已生成");
  } catch (error) {
    showToast(error?.message || "简历生成失败，请检查 AI 配置", "error");
    setGenerationStep(generationProgress.value || 0, "生成失败，请检查配置后重试");
  } finally {
    resetLoadingSections();
    isGeneratingResume.value = false;
  }
};

const exportResumeToPdf = async () => {
  const resumePage = resumePreviewRef.value?.getPageElement?.();
  if (!resumePage || isExportingPdf.value) return;

  isExportingPdf.value = true;
  let exportHost = null;
  try {
    exportHost = document.createElement("div");
    exportHost.className = "pdf-export-host";

    const exportPage = resumePage.cloneNode(true);
    exportPage.classList.add("pdf-export-page");
    exportHost.appendChild(exportPage);
    document.body.appendChild(exportHost);

    await document.fonts?.ready;

    const canvas = await html2canvas(exportPage, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
      width: exportPage.scrollWidth,
      height: exportPage.scrollHeight,
      windowWidth: exportPage.scrollWidth,
      windowHeight: exportPage.scrollHeight,
    });

    const imageData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imageData, "PNG", 0, 0, 210, 297);
    pdf.save(`${resumeBasicInfo.value.name || "resume"}.pdf`);
    showToast("PDF 已开始下载");
  } catch {
    showToast("PDF 导出失败，请稍后重试", "error");
  } finally {
    exportHost?.remove();
    isExportingPdf.value = false;
  }
};

const updateAiSetting = (key, value) => {
  aiSettings.value = {
    ...aiSettings.value,
    [key]: value,
  };
};

const validateAiSettings = () => {
  const endpoint = aiSettings.value.endpoint.trim();
  const apiKey = aiSettings.value.apiKey.trim();
  const modelId = aiSettings.value.modelId.trim();

  if (!endpoint) {
    showToast("请填写接口请求地址", "error");
    return false;
  }

  if (!apiKey) {
    showToast("请填写 API Key", "error");
    return false;
  }

  if (!modelId) {
    showToast("请填写模型 ID", "error");
    return false;
  }

  try {
    new URL(endpoint);
  } catch {
    showToast("接口请求地址格式不正确", "error");
    return false;
  }

  return true;
};

const saveAiSettings = () => {
  if (!validateAiSettings()) return;

  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(aiSettings.value));
  showToast("AI 配置已保存");
};

const testAiConnection = async () => {
  if (!validateAiSettings() || isTestingAi.value) return;

  isTestingAi.value = true;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(aiSettings.value.endpoint.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiSettings.value.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: aiSettings.value.modelId.trim(),
        messages: [{ role: "user", content: "ping" }],
        ...(aiSettings.value.isReasoningModel ? {} : { max_tokens: 8 }),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `连接失败：HTTP ${response.status}`;
      try {
        const errorPayload = await response.json();
        message = errorPayload?.error?.message || message;
      } catch {
        // Ignore non-JSON error responses.
      }
      showToast(message, "error");
      return;
    }

    showToast("连接测试成功");
  } catch (error) {
    const message = error.name === "AbortError" ? "连接超时，请检查接口地址" : "连接失败，请检查接口地址或跨域配置";
    showToast(message, "error");
  } finally {
    window.clearTimeout(timeout);
    isTestingAi.value = false;
  }
};

const updateBasicInfoField = (key, value) => {
  basicInfoDraft.value = {
    ...basicInfoDraft.value,
    [key]: value,
  };
};

const updatePhotoDraft = (photoSrc) => {
  photoDraft.value = photoSrc;
  showToast("照片已选择");
};

const saveBasicInfo = () => {
  resumeBasicInfo.value = {
    ...basicInfoDraft.value,
  };
  resumeInfoLines.value = createResumeInfoLines(resumeBasicInfo.value);
  resumePhotoSrc.value = photoDraft.value;
  localStorage.setItem(
    BASIC_INFO_KEY,
    JSON.stringify({
      profile: resumeBasicInfo.value,
      photoSrc: resumePhotoSrc.value,
    }),
  );
  showToast("基本信息已保存");
};

onMounted(() => {
  const savedSettings = localStorage.getItem(AI_SETTINGS_KEY);
  if (savedSettings) {
    try {
      aiSettings.value = {
        ...aiSettings.value,
        ...JSON.parse(savedSettings),
      };
    } catch {
      localStorage.removeItem(AI_SETTINGS_KEY);
    }
  }

  const savedBasicInfo = localStorage.getItem(BASIC_INFO_KEY);
  if (savedBasicInfo) {
    try {
      const parsed = JSON.parse(savedBasicInfo);
      resumeBasicInfo.value = {
        ...resumeBasicInfo.value,
        ...(parsed.profile || {}),
      };
      basicInfoDraft.value = {
        ...basicInfoDraft.value,
        ...(parsed.profile || {}),
      };
      resumePhotoSrc.value = parsed.photoSrc || "";
      photoDraft.value = parsed.photoSrc || "";
      resumeInfoLines.value = createResumeInfoLines(resumeBasicInfo.value);
    } catch {
      localStorage.removeItem(BASIC_INFO_KEY);
    }
  }

  const legacyPhoto = localStorage.getItem(LEGACY_PHOTO_SETTINGS_KEY);
  if (legacyPhoto) {
    try {
      const parsed = JSON.parse(legacyPhoto);
      if (parsed?.photoSrc) {
        resumePhotoSrc.value = parsed.photoSrc;
        photoDraft.value = parsed.photoSrc;
      }
    } finally {
      localStorage.removeItem(LEGACY_PHOTO_SETTINGS_KEY);
    }
  }

  const savedExperienceMaterials = localStorage.getItem(EXPERIENCE_MATERIALS_KEY);
  if (savedExperienceMaterials) {
    try {
      const parsed = JSON.parse(savedExperienceMaterials);
      if (Array.isArray(parsed) && parsed.length) {
        experienceMaterials.value = parsed;
      }
    } catch {
      localStorage.removeItem(EXPERIENCE_MATERIALS_KEY);
    }
  }
});
</script>

<template>
  <main class="workspace">
    <ResumePreview
      ref="resumePreviewRef"
      :resume="resume"
      :layout-template="activeTemplate"
      :basic-info="resumeBasicInfo"
      :info-lines="resumeInfoLines"
      :loading-sections="loadingSections"
      :photo-src="resumePhotoSrc"
      @update-basic-info="updatePreviewBasicInfo"
      @update-info-line="updateResumeInfoLine"
      @update-skill="updateResumeSkill"
      @update-campus="updateResumeCampus"
      @update-experience="updateResumeExperience"
      @update-experience-action="updateResumeExperienceAction"
      @update-awards="updateResumeAwards"
      @update-section-title="updateResumeSectionTitle"
      @update-project-label="updateResumeProjectLabel"
    />

    <section class="content-pane" aria-label="简历工具">
      <div class="content-top">
        <div class="tabs" role="tablist" aria-label="简历功能切换">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="brand-note">
          <span class="brand-kicker">ResumeGenerate</span>
        </div>
      </div>

      <div class="content-card">
        <transition name="fade" mode="out-in">
          <section :key="activeTab" class="content-view" :aria-label="activeTabLabel">
            <TemplatePanel
              v-if="activeTab === 'templates'"
              :active-template-id="activeTemplateId"
              :templates="resumeTemplates"
              @select-template="selectResumeTemplate"
            />

            <ExperiencePanel
              v-else-if="activeTab === 'skills'"
              :materials="experienceMaterials"
              @add="addExperienceMaterial"
              @remove="removeExperienceMaterial"
              @save="saveExperienceMaterials"
              @update-material="updateExperienceMaterial"
            />

            <GeneratePanel
              v-else-if="activeTab === 'generate'"
              :draft="generationDraft"
              :generation-progress="generationProgress"
              :generation-step-text="generationStepText"
              :is-exporting-pdf="isExportingPdf"
              :is-extracting-job="isExtractingJob"
              :is-generating="isGeneratingResume"
              :job-screenshot="jobScreenshot"
              @update-draft="updateGenerationDraft"
              @job-screenshot-selected="updateJobScreenshot"
              @extract-job="extractJobDraftFromScreenshot"
              @generate="generateResume"
              @export-pdf="exportResumeToPdf"
            />

            <AiConfigPanel
              v-else-if="activeTab === 'ai'"
              :settings="aiSettings"
              :is-testing="isTestingAi"
              @update-setting="updateAiSetting"
              @test="testAiConnection"
              @save="saveAiSettings"
            />

            <BasicInfoPanel
              v-else
              :basic-info="basicInfoDraft"
              :photo-draft="photoDraft"
              @update-field="updateBasicInfoField"
              @photo-selected="updatePhotoDraft"
              @save="saveBasicInfo"
            />
          </section>
        </transition>
      </div>
    </section>

    <ToastNotice :toast="toast" />
  </main>
</template>
