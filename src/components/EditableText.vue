<script setup>
import { normalizeEditableText } from "../utils/editableText";

defineProps({
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
  emit("update:modelValue", normalizeEditableText(event.target.innerText));
};
</script>

<template>
  <component
    :is="tag"
    class="editable-text"
    contenteditable="true"
    spellcheck="false"
    v-text="modelValue"
    @blur="commit"
  />
</template>
