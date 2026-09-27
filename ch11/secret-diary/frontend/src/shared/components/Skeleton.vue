<template>
  <div class="skeleton-wrapper">
    <div
      v-for="n in count"
      :key="n"
      class="skeleton-box"
      :style="{ height }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  count: {
    type: Number,
    default: 3,
  },
  height: {
    type: String,
    default: '80px',
  },
});
</script>

<style scoped>
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-box {
  width: 100%;
  border-radius: 10px;
  background-color: var(--border, #e2e8f0);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
</style>
