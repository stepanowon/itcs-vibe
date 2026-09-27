<template>
  <AppLayout>
    <div class="diary-form-page">
      <h1 class="diary-form-page__title">{{ isEditMode ? '일기 수정' : '일기 작성' }}</h1>

      <Skeleton v-if="isEditMode && isLoading" :count="4" height="48px" />

      <p v-else-if="isEditMode && isError" class="diary-form-page__error">
        찾을 수 없거나 접근 권한이 없습니다.
      </p>

      <form v-else class="diary-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="form-field__label" for="title">제목</label>
          <input id="title" v-model="title" type="text" class="form-field__input" placeholder="제목을 입력하세요" />
          <p v-if="errors.title" class="form-field__error">{{ errors.title }}</p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="diaryDate">작성 날짜</label>
          <input id="diaryDate" v-model="diaryDate" type="date" class="form-field__input" :max="maxDate" />
          <p class="form-field__hint">지난 날짜를 선택해 어제 못 쓴 일기를 오늘 작성할 수 있어요.</p>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="content">본문</label>
          <textarea
            id="content"
            v-model="content"
            class="form-field__textarea"
            rows="8"
            placeholder="오늘 하루는 어땠나요?"
          ></textarea>
          <p v-if="errors.content" class="form-field__error">{{ errors.content }}</p>
        </div>

        <div class="form-field">
          <span class="form-field__label">날씨</span>
          <div class="chip-group">
            <button
              v-for="option in weatherOptions"
              :key="option.value"
              type="button"
              class="chip chip--icon"
              :class="{ 'chip--active': weather === option.value }"
              @click="weather = weather === option.value ? '' : option.value"
            >
              <WeatherIcon :value="option.value" />
            </button>
          </div>
        </div>

        <div class="form-field">
          <span class="form-field__label">기분</span>
          <div class="chip-group">
            <button
              v-for="option in moodOptions"
              :key="option.value"
              type="button"
              class="chip chip--icon"
              :class="{ 'chip--active': mood === option.value }"
              @click="mood = mood === option.value ? '' : option.value"
            >
              <MoodIcon :value="option.value" />
            </button>
          </div>
        </div>

        <div class="form-field">
          <span class="form-field__label">태그</span>
          <TagInput v-model="tags" />
        </div>

        <p v-if="submitError" class="form-error">{{ submitError }}</p>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? '저장 중...' : '저장' }}
        </button>
      </form>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import TagInput from '../shared/components/TagInput.vue'
import Skeleton from '../shared/components/Skeleton.vue'
import { useCreateDiaryMutation, useDiaryQuery, useUpdateDiaryMutation } from '../features/diaries/mutations.js'
import { WEATHER_OPTIONS, MOOD_OPTIONS } from '../shared/constants/diaryOptions.js'
import { todayDateString } from '../shared/utils/date.js'
import WeatherIcon from '../shared/components/WeatherIcon.vue'
import MoodIcon from '../shared/components/MoodIcon.vue'

const route = useRoute()
const router = useRouter()

const diaryId = computed(() => route.params.id ?? null)
const isEditMode = computed(() => !!diaryId.value)

const DEFAULT_WEATHER = 'sunny'
const DEFAULT_MOOD = 'neutral'

const maxDate = todayDateString()

const title = ref('')
const content = ref('')
const weather = ref(isEditMode.value ? '' : DEFAULT_WEATHER)
const mood = ref(isEditMode.value ? '' : DEFAULT_MOOD)
const diaryDate = ref(maxDate)
const tags = ref([])

const errors = reactive({ title: '', content: '' })
const submitError = ref('')

const weatherOptions = WEATHER_OPTIONS
const moodOptions = MOOD_OPTIONS

const { data: existingDiary, isLoading, isError } = useDiaryQuery(diaryId)

watch(
  existingDiary,
  (diary) => {
    if (!diary) return
    title.value = diary.title ?? ''
    content.value = diary.content ?? ''
    weather.value = diary.weather ?? ''
    mood.value = diary.mood ?? ''
    diaryDate.value = diary.diaryDate ?? maxDate
    tags.value = diary.tags ?? []
  },
  { immediate: true }
)

const createDiaryMutation = useCreateDiaryMutation()
const updateDiaryMutation = useUpdateDiaryMutation(diaryId)

const isSubmitting = computed(() => createDiaryMutation.isPending?.value || updateDiaryMutation.isPending?.value)

function validate() {
  errors.title = title.value.trim() ? '' : '제목을 입력해주세요.'
  errors.content = content.value.trim() ? '' : '본문을 입력해주세요.'
  return !errors.title && !errors.content
}

async function handleSubmit() {
  submitError.value = ''

  if (!validate()) {
    return
  }

  const payload = {
    title: title.value,
    content: content.value,
    weather: weather.value || undefined,
    mood: mood.value || undefined,
    diaryDate: diaryDate.value || undefined,
    tags: tags.value,
  }

  try {
    const saved = isEditMode.value
      ? await updateDiaryMutation.mutateAsync(payload)
      : await createDiaryMutation.mutateAsync(payload)

    router.push({ name: 'diary-detail', params: { id: saved.id } })
  } catch (error) {
    const responseData = error.response?.data
    if (responseData?.details) {
      Object.assign(errors, responseData.details)
    }
    submitError.value = responseData?.message ?? '저장하지 못했어요. 잠시 후 다시 시도해주세요.'
  }
}
</script>

<style scoped>
.diary-form-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diary-form-page__error {
  text-align: center;
  color: var(--muted);
  padding: 48px 0;
}

.diary-form-page__title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text);
}

.diary-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  padding: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.form-field__input,
.form-field__textarea {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-field__input:focus,
.form-field__textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.form-field__textarea {
  resize: vertical;
}

.form-field__error {
  margin: 0;
  font-size: 0.8rem;
  color: #b91c1c;
}

.form-field__hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
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

.form-error {
  margin: 0;
  font-size: 0.85rem;
  color: #b91c1c;
  background-color: #fef2f2;
  border-radius: 8px;
  padding: 8px 12px;
}

.submit-btn {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background-color: var(--accent);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #4338ca;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
