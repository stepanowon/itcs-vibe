<template>
  <section class="filter-sheet">
    <div class="filter-group">
      <span class="filter-group__label">날씨</span>
      <div class="chip-group">
        <button
          type="button"
          class="chip"
          :class="{ 'chip--active': weather === '' }"
          @click="weather = ''"
        >
          전체
        </button>
        <button
          v-for="option in weatherOptions"
          :key="option.value"
          type="button"
          class="chip chip--icon"
          :class="{ 'chip--active': weather === option.value }"
          @click="weather = option.value"
        >
          <WeatherIcon :value="option.value" />
        </button>
      </div>
    </div>

    <div class="filter-group">
      <span class="filter-group__label">기분</span>
      <div class="chip-group">
        <button
          type="button"
          class="chip"
          :class="{ 'chip--active': mood === '' }"
          @click="mood = ''"
        >
          전체
        </button>
        <button
          v-for="option in moodOptions"
          :key="option.value"
          type="button"
          class="chip chip--icon"
          :class="{ 'chip--active': mood === option.value }"
          @click="mood = option.value"
        >
          <MoodIcon :value="option.value" />
        </button>
      </div>
    </div>

    <div class="filter-group">
      <label class="filter-group__label" for="tag-input">태그</label>
      <input id="tag-input" v-model="tag" type="text" class="tag-input" placeholder="태그로 검색" />
    </div>

    <button type="button" class="apply-btn" @click="applyFilters">필터 적용</button>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { WEATHER_OPTIONS, MOOD_OPTIONS } from '../../shared/constants/diaryOptions.js'
import WeatherIcon from '../../shared/components/WeatherIcon.vue'
import MoodIcon from '../../shared/components/MoodIcon.vue'

const props = defineProps({
  weather: {
    type: String,
    default: '',
  },
  mood: {
    type: String,
    default: '',
  },
  tag: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['apply'])

const weatherOptions = WEATHER_OPTIONS
const moodOptions = MOOD_OPTIONS

const weather = ref(props.weather)
const mood = ref(props.mood)
const tag = ref(props.tag)

watch(
  () => [props.weather, props.mood, props.tag],
  ([nextWeather, nextMood, nextTag]) => {
    weather.value = nextWeather
    mood.value = nextMood
    tag.value = nextTag
  }
)

function applyFilters() {
  emit('apply', { weather: weather.value, mood: mood.value, tag: tag.value })
}
</script>

<style scoped>
.filter-sheet {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background-color: #ffffff;
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.chip--icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
}

.chip--active {
  background-color: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}

.tag-input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
}

.tag-input:focus {
  outline: none;
  border-color: var(--accent);
}

.apply-btn {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background-color: var(--accent);
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.apply-btn:hover {
  background-color: #4338ca;
}
</style>
