<script setup>
defineProps({
  activeTemplateId: {
    type: String,
    required: true,
  },
  templates: {
    type: Array,
    required: true,
  },
});

defineEmits(["select-template"]);
</script>

<template>
  <div class="template-grid">
    <button
      v-for="template in templates"
      :key="template.id"
      class="template-card"
      :class="{ active: activeTemplateId === template.id }"
      type="button"
      @click="$emit('select-template', template.id)"
    >
      <span
        class="template-preview"
        :class="`template-preview-${template.layout}`"
        :style="{
          '--template-accent': template.theme.accentColor,
          '--template-soft': template.theme.secondaryColor || '#eef6f5',
        }"
      >
        <span class="template-preview-head"></span>
        <span class="template-preview-title"></span>
        <span class="template-preview-line long"></span>
        <span class="template-preview-line"></span>
        <span class="template-preview-section"></span>
        <span class="template-preview-line long"></span>
        <span class="template-preview-line medium"></span>
      </span>

      <span class="template-info">
        <strong>{{ template.name }}</strong>
        <span>{{ template.description }}</span>
        <span class="template-tags">
          <em v-for="tag in template.tags" :key="tag">{{ tag }}</em>
        </span>
      </span>
    </button>
  </div>
</template>
