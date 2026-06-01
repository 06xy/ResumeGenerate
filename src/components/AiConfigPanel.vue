<script setup>
defineProps({
  settings: {
    type: Object,
    required: true,
  },
  isTesting: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["save", "test", "update-setting"]);
</script>

<template>
  <div class="config-form">
    <label class="field">
      <span>接口请求地址</span>
      <input
        :value="settings.endpoint"
        type="url"
        placeholder="https://api.openai.com/v1/chat/completions"
        @input="$emit('update-setting', 'endpoint', $event.target.value)"
      />
    </label>

    <label class="field">
      <span>API Key</span>
      <input
        :value="settings.apiKey"
        type="password"
        placeholder="请输入 API Key"
        autocomplete="off"
        @input="$emit('update-setting', 'apiKey', $event.target.value)"
      />
    </label>

    <label class="field">
      <span>模型 ID</span>
      <input
        :value="settings.modelId"
        type="text"
        placeholder="例如：gpt-4o-mini"
        @input="$emit('update-setting', 'modelId', $event.target.value)"
      />
    </label>

    <label class="switch-field">
      <input
        type="checkbox"
        :checked="settings.isReasoningModel"
        @change="$emit('update-setting', 'isReasoningModel', $event.target.checked)"
      />
      <span class="switch-control"></span>
      <span>
        <strong>思考模型</strong>
        <small>开启后使用更大的完成 token 预算，并按 reasoning/content 分离格式解析最终答案。</small>
      </span>
    </label>

    <div class="form-actions">
      <button class="ghost-button" type="button" :disabled="isTesting" @click="$emit('test')">
        {{ isTesting ? "测试中..." : "测试链接" }}
      </button>
      <button class="primary-button" type="button" @click="$emit('save')">保存配置</button>
    </div>

    <div v-if="isTesting" class="test-progress" aria-label="接口测试进度">
      <span></span>
    </div>
  </div>
</template>
