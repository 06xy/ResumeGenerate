<script setup>
defineProps({
  toast: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <transition name="toast">
    <div v-if="toast.visible" class="toast-shell">
      <div class="toast" :class="`toast-${toast.type}`" role="status">
        <svg v-if="toast.type === 'success'" class="toast-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 1.75a8.25 8.25 0 1 0 8.25 8.25A8.26 8.26 0 0 0 10 1.75Zm3.2 6.56-3.53 4.57a.9.9 0 0 1-1.34.08L6.76 10.6a.9.9 0 1 1 1.27-1.27l1 1 2.84-3.68a.9.9 0 1 1 1.33 1.22Z"
            fill="currentColor"
          />
        </svg>
        <svg v-else class="toast-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 1.5A8.5 8.5 0 1 0 18.5 10 8.51 8.51 0 0 0 10 1.5Zm.75 4.25v4.8a.75.75 0 0 1-1.5 0v-4.8a.75.75 0 0 1 1.5 0ZM10 14.9a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z"
            fill="currentColor"
          />
        </svg>
        {{ toast.message }}
      </div>
    </div>
  </transition>
</template>
