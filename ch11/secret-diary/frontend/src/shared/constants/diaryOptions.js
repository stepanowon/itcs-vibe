export const WEATHER_OPTIONS = [
  { value: 'sunny', label: '맑음' },
  { value: 'cloudy', label: '흐림' },
  { value: 'rainy', label: '비' },
  { value: 'snowy', label: '눈' },
  { value: 'windy', label: '바람' },
]

export const MOOD_OPTIONS = [
  { value: 'happy', label: '행복' },
  { value: 'neutral', label: '보통' },
  { value: 'sad', label: '슬픔' },
  { value: 'angry', label: '화남' },
  { value: 'excited', label: '신남' },
  { value: 'tired', label: '피곤' },
]

const WEATHER_LABEL_MAP = Object.fromEntries(WEATHER_OPTIONS.map((o) => [o.value, o.label]))
const MOOD_LABEL_MAP = Object.fromEntries(MOOD_OPTIONS.map((o) => [o.value, o.label]))

export function weatherLabel(value) {
  return WEATHER_LABEL_MAP[value] ?? value
}

export function moodLabel(value) {
  return MOOD_LABEL_MAP[value] ?? value
}
