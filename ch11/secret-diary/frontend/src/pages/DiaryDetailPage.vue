<template>
  <AppLayout>
    <div class="diary-detail-page">
      <Skeleton v-if="isLoading" :count="5" height="24px" />

      <div v-else-if="isError && isForbiddenOrNotFound" class="error-state">
        <p>찾을 수 없거나 접근 권한이 없습니다.</p>
      </div>

      <p v-else-if="isError" class="status-text">일기를 불러오지 못했어요.</p>

      <template v-else-if="diary">
        <div class="diary-detail__actions">
          <router-link :to="{ name: 'diary-edit', params: { id } }" class="diary-detail__btn">수정</router-link>
          <button type="button" class="diary-detail__btn diary-detail__btn--danger" @click="showConfirm = true">
            삭제
          </button>
        </div>

        <div class="diary-detail__header">
          <p class="diary-detail__date">{{ formatDiaryDate(diary.diaryDate) }}</p>
          <h1 class="diary-detail__title">{{ diary.title }}</h1>

          <div class="diary-detail__meta">
            <WeatherIcon v-if="diary.weather" :value="diary.weather" />
            <MoodIcon v-if="diary.mood" :value="diary.mood" />
          </div>

          <div v-if="diary.tags?.length" class="diary-detail__tags">
            <span v-for="tag in diary.tags" :key="tag" class="diary-detail__tag">#{{ tag }}</span>
          </div>
        </div>

        <p class="diary-detail__content">{{ diary.content }}</p>

        <div class="diary-detail__timestamps">
          <span>작성: {{ formatDate(diary.createdAt) }}</span>
          <span v-if="diary.updatedAt">수정: {{ formatDate(diary.updatedAt) }}</span>
        </div>
      </template>
    </div>

    <ConfirmModal
      :open="showConfirm"
      title="일기 삭제"
      message="이 일기를 삭제하시겠습니까?"
      @confirm="handleDelete"
      @cancel="showConfirm = false"
    />
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import ConfirmModal from '../shared/components/ConfirmModal.vue'
import Skeleton from '../shared/components/Skeleton.vue'
import { useDiaryQuery } from '../features/diaries/mutations.js'
import { useDeleteDiaryMutation } from '../features/diaries/deleteMutation.js'
import { formatDiaryDate } from '../shared/utils/date.js'
import WeatherIcon from '../shared/components/WeatherIcon.vue'
import MoodIcon from '../shared/components/MoodIcon.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const { data: diary, isLoading, isError, error } = useDiaryQuery(id)

const isForbiddenOrNotFound = computed(() => {
  const status = error.value?.response?.status
  return status === 403 || status === 404
})

const showConfirm = ref(false)
const deleteMutation = useDeleteDiaryMutation()

async function handleDelete() {
  await deleteMutation.mutateAsync(id.value)
  showConfirm.value = false
  router.push({ name: 'home' })
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString()
}
</script>

<style scoped>
.diary-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.status-text {
  text-align: center;
  color: var(--muted);
  padding: 24px 0;
}

.error-state {
  text-align: center;
  color: var(--muted);
  padding: 48px 0;
}

.diary-detail__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.diary-detail__btn {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid var(--accent);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--accent);
  text-decoration: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
}

.diary-detail__btn--danger {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.diary-detail__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.diary-detail__date {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
}

.diary-detail__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.3;
  color: var(--text);
}

.diary-detail__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  color: var(--muted);
}

.diary-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.diary-detail__tag {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4338ca;
  background-color: #eef2ff;
  border-radius: 999px;
  padding: 3px 10px;
}

.diary-detail__content {
  white-space: pre-wrap;
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--text);
}

.diary-detail__timestamps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--muted);
}
</style>
