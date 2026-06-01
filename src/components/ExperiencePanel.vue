<script setup>
defineProps({
  materials: {
    type: Array,
    required: true,
  },
});

defineEmits(["add", "remove", "save", "update-material"]);
</script>

<template>
  <div class="experience-editor">
    <div class="inline-notice">
      <span class="inline-notice-icon">!</span>
      <span>经历越详细越好，可以写校园经历</span>
    </div>

    <article v-for="(item, index) in materials" :key="index" class="experience-item">
      <div class="experience-index">{{ index + 1 }}</div>
      <textarea
        :value="item"
        rows="4"
        placeholder="写一段你过往的项目、实习、校园、比赛或工作经历，越具体越利于后续 AI 生成简历。"
        @input="$emit('update-material', index, $event.target.value)"
      ></textarea>
      <button class="icon-button" type="button" aria-label="删除经历" @click="$emit('remove', index)">×</button>
    </article>

    <div class="experience-actions">
      <button class="add-button" type="button" @click="$emit('add')">添加经历</button>
      <button class="primary-button" type="button" @click="$emit('save')">保存</button>
    </div>
  </div>
</template>
