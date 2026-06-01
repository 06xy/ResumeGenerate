<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  tag: {
    type: String,
    default: "span",
  },
});

const emit = defineEmits(["update:modelValue"]);

const commit = (event) => {
  emit("update:modelValue", event.target.innerText.trim());
};

const handleKeydown = (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    event.target.blur();
  }
};
</script>

<template>
  <component
    :is="tag"
    class="editable-text"
    contenteditable="true"
    spellcheck="false"
    @blur="commit"
    @keydown="handleKeydown"
  >
    {{ modelValue }}
  </component>
</template>
