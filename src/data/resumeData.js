export const tabs = [
  { id: "templates", label: "简历模板" },
  { id: "generate", label: "简历生成" },
  { id: "skills", label: "经验管理" },
  { id: "ai", label: "AI配置" },
  { id: "photo", label: "基本信息" },
];

const defaultProjectLabels = {
  background: "概述",
  challenge: "重点",
  actions: "负责内容",
  stack: "相关技术",
};

export const resumeTemplates = [
  {
    id: "classic-blue",
    name: "经典蓝",
    description: "顶部信息区 + 纵向内容流，适合技术岗和校招投递。",
    tags: ["通用", "技术岗"],
    layout: "classic",
    theme: {
      accentColor: "#1f4e79",
      secondaryColor: "#eef3f7",
      fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    },
  },
  {
    id: "blue-hero",
    name: "蓝色页眉",
    description: "大面积蓝色页眉、圆角信息卡、胶囊标题标签。",
    tags: ["页眉", "圆角信息卡"],
    layout: "blueHero",
    theme: {
      accentColor: "#6797e6",
      secondaryColor: "#edf4ff",
      fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    },
  },
  {
    id: "clean-black",
    name: "黑青简洁",
    description: "黑色顶栏、照片左置、右侧联系信息、短粗下划线标题。",
    tags: ["简洁", "黑青"],
    layout: "cleanBlack",
    theme: {
      accentColor: "#2a93aa",
      secondaryColor: "#121f27",
      fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    },
  },
  {
    id: "deep-side",
    name: "深蓝侧栏",
    description: "左侧深蓝信息栏，右侧主体用圆形图标标题分组。",
    tags: ["深色侧栏", "图标分组"],
    layout: "deepSide",
    theme: {
      accentColor: "#284d6d",
      secondaryColor: "#edf3f7",
      fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    },
  },
  {
    id: "green-line",
    name: "绿色线条",
    description: "绿色主标题、贯穿左侧竖线、斜角模块标题。",
    tags: ["绿色", "线条"],
    layout: "greenLine",
    theme: {
      accentColor: "#05b25c",
      secondaryColor: "#e8f8ef",
      fontFamily: '"Microsoft YaHei", "PingFang SC", Arial, sans-serif',
    },
  },
  {
    id: "hexagon-blue",
    name: "六边形蓝灰",
    description: "六边形照片、深蓝横条、斜角标题条。",
    tags: ["六边形", "蓝灰"],
    layout: "hexagonBlue",
    theme: {
      accentColor: "#40556f",
      secondaryColor: "#edf1f5",
      fontFamily: '"HarmonyOS Sans SC", "Microsoft YaHei", Arial, sans-serif',
    },
  },
];

export const resume = {
  sectionTitles: {
    intentPrefix: "求职意向：",
    skills: "专业技能",
    campus: "校园经历",
    projects: "项目经历",
    work: "工作经历",
    internships: "实习经历",
    awards: "奖项证书",
  },
  skills: [
    "熟悉 Vue 3、TypeScript、Vite 等前端技术栈，能够完成业务页面开发、组件封装与接口联调",
    "熟悉 Element Plus、Pinia、Vue Router 等常用生态，具备中后台系统开发经验",
    "了解 Node.js、Express、RESTful API 基础，可配合后端完成联调和问题定位",
    "熟悉 ECharts 数据可视化开发，能够根据业务数据完成图表配置和交互展示",
    "熟悉 Git、npm、前端工程化流程，具备良好的代码规范和协作意识",
  ],
  campus: {
    title: "校园技术社团",
    body: "参与校园技术社团的项目实践与技术分享活动，协助完成活动页面制作、资料整理和团队协作。通过课程设计和社团项目积累了前端页面开发、需求沟通和问题排查经验。",
  },
  projectLabels: defaultProjectLabels,
  work: [
    {
      name: "示例科技有限公司业务管理平台",
      role: "前端开发",
      time: "2025.07 - 2025.10",
      background: "项目用于企业内部客户、订单和数据报表管理，需要支持多角色权限、列表检索和表单录入等常用业务流程。",
      challenge: "业务字段较多，页面状态和接口联动复杂，需要保证表单校验、数据回显和权限展示的一致性。",
      actions: [
        "负责客户列表、订单详情和报表筛选模块开发，封装表格、筛选栏和弹窗表单组件。",
        "配合后端完成权限接口、字典数据和 CRUD 流程联调，处理加载状态、错误提示和空数据展示。",
      ],
      stack: "Vue 3、TypeScript、Element Plus、Pinia、Axios",
    },
  ],
  internships: [
    {
      name: "示例互联网公司运营工具",
      role: "前端实习生",
      time: "2025.03 - 2025.06",
      background: "项目面向运营团队日常活动配置和数据查看场景，需要快速交付多个配置页和数据看板页面。",
      challenge: "页面迭代频繁，配置项较多，需要在保证交互一致性的同时提升页面开发效率。",
      actions: [
        "参与活动配置页、素材管理页和数据概览页开发，完成基础组件复用和页面状态维护。",
        "根据测试反馈修复表单校验、分页查询和接口异常场景问题，提升页面稳定性。",
      ],
      stack: "Vue 3、JavaScript、Element Plus、ECharts、Git",
    },
  ],
  awards: ["校级优秀课程设计", "CET-4"],
  projects: [
    {
      name: "企业数据看板系统",
      role: "前端开发",
      time: "2025.03 - 2025.06",
      background: "项目面向企业经营数据展示场景，需要建设集指标概览、趋势分析、明细查询于一体的数据看板。",
      challenge: "页面信息密度高，图表联动多，接口字段调整频繁，需要保证展示效果和数据一致性。",
      actions: [
        "负责看板首页、指标卡片和趋势图表开发，封装通用图表组件。",
        "配合后端完成数据接口联调，处理字段映射、空值兜底和加载状态。",
        "根据产品反馈优化筛选交互和响应式布局，提升页面可读性。",
      ],
      stack: "Vue 3、TypeScript、ECharts、Element Plus、Pinia",
    },
    {
      name: "在线任务管理平台",
      role: "前端开发",
      time: "2024.10 - 2025.01",
      background: "项目用于团队任务分配、进度跟踪和成员协作，需要支持任务列表、详情编辑、状态流转等功能。",
      challenge: "任务状态和筛选条件较多，列表操作频繁，需要保证交互流畅和数据更新及时。",
      actions: [
        "负责任务列表、任务详情弹窗和状态筛选模块开发。",
        "封装表单校验和弹窗组件，减少重复代码并提升维护效率。",
        "配合接口完成新增、编辑、删除和状态更新流程联调。",
      ],
      stack: "Vue 3、Vue Router、Element Plus、Axios、Git",
    },
  ],
};

export const defaultExperienceMaterials = [
  "参与企业数据看板系统前端开发，负责指标卡片、趋势图表和筛选交互，并配合后端完成接口联调。",
  "参与在线任务管理平台开发，负责任务列表、详情弹窗、表单校验和状态流转功能。",
];

export const defaultGenerationDraft = {
  role: "Web 前端开发工程师",
  description:
    "岗位职责：负责 Web 前端页面开发、组件封装、接口联调和业务功能落地；参与产品需求评审，配合后端完成系统迭代。任职要求：熟悉 Vue 技术栈，具备良好的页面还原、工程化开发和问题排查能力，有可视化、管理系统或小程序开发经验优先。",
};

export const defaultAiSettings = {
  endpoint: "https://api.openai.com/v1/chat/completions",
  apiKey: "",
  modelId: "gpt-4o-mini",
  isReasoningModel: false,
};

export const defaultBasicInfo = {
  name: "李明",
  gender: "男",
  phone: "13800000000",
  email: "liming@example.com",
  schoolInfo: "示例大学｜计算机学院",
  majorInfo: "软件工程｜本科｜2022.09 - 2026.06",
  intent: "Web 前端开发工程师",
};
