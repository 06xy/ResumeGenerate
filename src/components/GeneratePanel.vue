<script setup>
import { ref } from "vue";

const props = defineProps({
  draft: {
    type: Object,
    required: true,
  },
  jobScreenshot: {
    type: String,
    default: "",
  },
  isExportingPdf: {
    type: Boolean,
    default: false,
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
  generationProgress: {
    type: Number,
    default: 0,
  },
  generationStepText: {
    type: String,
    default: "",
  },
  isExtractingJob: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["export-pdf", "extract-job", "generate", "job-screenshot-selected", "update-draft"]);
const screenshotInput = ref(null);

const updateField = (key, value) => {
  emit("update-draft", {
    ...props.draft,
    [key]: value,
  });
};

const triggerScreenshotUpload = () => {
  screenshotInput.value?.click?.();
};

const handleScreenshotChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    emit("job-screenshot-selected", String(reader.result || ""));
  };
  reader.readAsDataURL(file);
};
</script>

<template>
  <div class="generator-layout">
    <label class="field">
      <span>目标岗位</span>
      <input :value="draft.role" type="text" @input="updateField('role', $event.target.value)" />
    </label>

    <label class="field field-wide">
      <span>岗位描述</span>
      <textarea
        :value="draft.description"
        rows="8"
        placeholder="粘贴招聘平台中 HR 发布的岗位描述，包括岗位职责、任职要求、业务方向和加分项。"
        @input="updateField('description', $event.target.value)"
      ></textarea>
    </label>

    <section class="screenshot-parser field-wide">
      <div class="screenshot-parser-head">
        <div>
          <strong>职位截图识别</strong>
          <span>当招聘软件不允许复制职位描述时，可上传截图提取岗位名称和岗位描述。</span>
        </div>
        <em>需要模型支持多模态输入</em>
      </div>

      <div class="screenshot-parser-body">
        <button class="screenshot-upload" type="button" @click="triggerScreenshotUpload">
          <input ref="screenshotInput" class="photo-input" type="file" accept="image/*" @change="handleScreenshotChange" />
          <img v-if="jobScreenshot" :src="jobScreenshot" alt="职位截图预览" />
          <span v-else>上传职位截图</span>
        </button>

        <div class="screenshot-actions">
          <button
            class="ghost-button"
            type="button"
            :disabled="!jobScreenshot || isExtractingJob"
            @click="$emit('extract-job')"
          >
            {{ isExtractingJob ? "识别中..." : "识别截图" }}
          </button>
          <p>识别成功后会自动回填上方目标岗位和岗位描述。</p>
        </div>
      </div>
    </section>

    <div v-if="isGenerating || generationStepText" class="generation-progress" aria-live="polite">
      <div class="generation-progress-head">
        <span>{{ generationStepText || "等待生成" }}</span>
        <strong>{{ Math.round(generationProgress) }}%</strong>
      </div>
      <div class="generation-progress-track">
        <span :style="{ width: `${generationProgress}%` }"></span>
      </div>
    </div>

    <div class="generate-actions">
      <button class="primary-button" type="button" :disabled="isGenerating" @click="$emit('generate')">
        {{ isGenerating ? "生成中..." : "生成简历" }}
      </button>
      <button class="ghost-button" type="button" :disabled="isExportingPdf" @click="$emit('export-pdf')">
        {{ isExportingPdf ? "导出中..." : "导出为PDF" }}
      </button>
    </div>
  </div>
</template>
