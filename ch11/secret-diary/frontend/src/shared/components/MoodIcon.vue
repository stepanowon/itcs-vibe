<template>
  <span class="mood-icon" :title="label" :aria-label="label" role="img">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="currentColor" fill-opacity="0.14" />
      <circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.4" />

      <template v-if="value === 'happy'">
        <circle cx="8.6" cy="10" r="1.1" fill="currentColor" />
        <circle cx="15.4" cy="10" r="1.1" fill="currentColor" />
        <path d="M7.8 13.5c1 1.6 2.6 2.5 4.2 2.5s3.2-.9 4.2-2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </template>

      <template v-else-if="value === 'neutral'">
        <circle cx="8.6" cy="10" r="1.1" fill="currentColor" />
        <circle cx="15.4" cy="10" r="1.1" fill="currentColor" />
        <line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </template>

      <template v-else-if="value === 'sad'">
        <circle cx="8.6" cy="10.5" r="1.1" fill="currentColor" />
        <circle cx="15.4" cy="10.5" r="1.1" fill="currentColor" />
        <path d="M7.8 16.5c1-1.6 2.6-2.5 4.2-2.5s3.2.9 4.2 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </template>

      <template v-else-if="value === 'angry'">
        <line x1="7.2" y1="8.6" x2="10" y2="9.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="16.8" y1="8.6" x2="14" y2="9.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="8.6" cy="11.5" r="1" fill="currentColor" />
        <circle cx="15.4" cy="11.5" r="1" fill="currentColor" />
        <path d="M8 16.2c1.1-1 2.6-1.5 4-1.5s2.9.5 4 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </template>

      <template v-else-if="value === 'excited'">
        <path d="M6.8 9.4l3.4 1.4-3.4 1.4z" fill="currentColor" />
        <path d="M17.2 9.4l-3.4 1.4 3.4 1.4z" fill="currentColor" />
        <path d="M7.6 13.8c1.2 2 2.8 3 4.4 3s3.2-1 4.4-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
      </template>

      <template v-else-if="value === 'tired'">
        <path d="M6.8 10c.8-.6 1.8-.9 2.8-.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
        <path d="M17.2 10c-.8-.6-1.8-.9-2.8-.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" />
        <path d="M8 15.5c1.2-.8 2.6-1.2 4-1.2s2.8.4 4 1.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
      </template>
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { moodLabel } from '../constants/diaryOptions.js'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
})

const label = computed(() => moodLabel(props.value))
</script>

<style scoped>
.mood-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: default;
}
</style>
