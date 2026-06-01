<script setup>
import { ref } from "vue";

defineProps({
  basicInfo: {
    type: Object,
    required: true,
  },
  photoDraft: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["photo-selected", "save", "update-field"]);
const photoInput = ref(null);

const triggerPhotoUpload = () => {
  photoInput.value?.click?.();
};

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    emit("photo-selected", String(reader.result || ""));
  };
  reader.readAsDataURL(file);
};
</script>

<template>
  <div class="inline-notice">
    <span class="inline-notice-icon">!</span>
    <span>基本信息界面不会被提交给AI</span>
  </div>

  <div class="basic-info-layout">
    <div class="photo-preview">
      <div class="photo-upload-box" role="button" tabindex="0" @click="triggerPhotoUpload" @keydown.enter.prevent="triggerPhotoUpload">
        <input ref="photoInput" class="photo-input" type="file" accept="image/*" @change="handlePhotoChange" />
        <img v-if="photoDraft" :src="photoDraft" alt="照片预览" />
        <span v-else>点击上传照片</span>
      </div>
    </div>

    <div class="basic-info-form">
      <div class="info-grid">
        <label class="field">
          <span>姓名</span>
          <input :value="basicInfo.name" type="text" @input="$emit('update-field', 'name', $event.target.value)" />
        </label>
        <label class="field">
          <span>性别</span>
          <input :value="basicInfo.gender" type="text" @input="$emit('update-field', 'gender', $event.target.value)" />
        </label>
        <label class="field">
          <span>手机号</span>
          <input :value="basicInfo.phone" type="text" @input="$emit('update-field', 'phone', $event.target.value)" />
        </label>
        <label class="field">
          <span>邮箱</span>
          <input :value="basicInfo.email" type="email" @input="$emit('update-field', 'email', $event.target.value)" />
        </label>
        <label class="field">
          <span>学校信息</span>
          <input :value="basicInfo.schoolInfo" type="text" @input="$emit('update-field', 'schoolInfo', $event.target.value)" />
        </label>
        <label class="field">
          <span>专业信息</span>
          <input :value="basicInfo.majorInfo" type="text" @input="$emit('update-field', 'majorInfo', $event.target.value)" />
        </label>
        <label class="field field-wide">
          <span>求职意向</span>
          <input :value="basicInfo.intent" type="text" @input="$emit('update-field', 'intent', $event.target.value)" />
        </label>
      </div>

      <button class="primary-button basic-save" type="button" @click="$emit('save')">保存</button>
    </div>
  </div>
</template>
