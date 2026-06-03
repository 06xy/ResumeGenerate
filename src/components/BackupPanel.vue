<script setup>
defineProps({
  isImporting: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["backup", "restore"]);
</script>

<template>
  <div class="backup-layout">
    <section class="backup-block">
      <div>
        <strong>导出备份</strong>
        <p>导出当前 AI 配置、基本信息、经验资料、岗位草稿、模板选择和简历内容。</p>
      </div>
      <button class="primary-button" type="button" @click="$emit('backup')">备份</button>
    </section>

    <section class="backup-block">
      <div>
        <strong>恢复备份</strong>
        <p>选择之前导出的 JSON 文件恢复配置。照片不会被导入或覆盖。</p>
      </div>
      <label class="ghost-button backup-upload">
        <input type="file" accept="application/json,.json" :disabled="isImporting" @change="$emit('restore', $event)" />
        <span>{{ isImporting ? "导入中" : "恢复" }}</span>
      </label>
    </section>
  </div>
</template>
