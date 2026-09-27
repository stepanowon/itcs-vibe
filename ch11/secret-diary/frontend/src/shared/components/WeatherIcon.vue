<template>
  <span class="weather-icon" :title="label" :aria-label="label" role="img">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <template v-if="value === 'sunny'">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.2" y1="4.2" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.8" y2="19.8" />
          <line x1="4.2" y1="19.8" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.8" y2="4.2" />
        </g>
      </template>

      <template v-else-if="value === 'cloudy'">
        <path
          d="M7 17a4.5 4.5 0 0 1-.5-8.98A5.5 5.5 0 0 1 17.2 9.5 4 4 0 0 1 16.5 17H7z"
          fill="currentColor"
        />
      </template>

      <template v-else-if="value === 'rainy'">
        <path
          d="M7 14.5a4.2 4.2 0 0 1-.4-8.38A5.2 5.2 0 0 1 16.7 7.5 3.8 3.8 0 0 1 16 14.5H7z"
          fill="currentColor"
        />
        <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <line x1="8.5" y1="18" x2="7.5" y2="21" />
          <line x1="12" y1="18" x2="11" y2="21" />
          <line x1="15.5" y1="18" x2="14.5" y2="21" />
        </g>
      </template>

      <template v-else-if="value === 'snowy'">
        <path
          d="M7 13.5a4.2 4.2 0 0 1-.4-8.38A5.2 5.2 0 0 1 16.7 6.5 3.8 3.8 0 0 1 16 13.5H7z"
          fill="currentColor"
        />
        <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <line x1="8.5" y1="17" x2="8.5" y2="21" />
          <line x1="6.5" y1="19" x2="10.5" y2="19" />
          <line x1="15.5" y1="17" x2="15.5" y2="21" />
          <line x1="13.5" y1="19" x2="17.5" y2="19" />
        </g>
      </template>

      <template v-else-if="value === 'windy'">
        <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M2.5 8.5h12a2.5 2.5 0 1 0-2.4-3.2" />
          <path d="M2.5 13h15a2.5 2.5 0 1 1-2.4 3.2" />
          <path d="M2.5 17.5h9" />
        </g>
      </template>
    </svg>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { weatherLabel } from '../constants/diaryOptions.js'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
})

const label = computed(() => weatherLabel(props.value))
</script>

<style scoped>
.weather-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  cursor: default;
}
</style>
