<template>
  <AppLayout>
    <div class="diary-list-page">
      <DiaryFilterSheet
        :weather="filters.weather"
        :mood="filters.mood"
        :tag="filters.tag"
        @apply="handleApplyFilters"
      />

      <div class="diary-list-body">
        <Skeleton v-if="isLoading" :count="3" height="100px" />
        <p v-else-if="isError" class="status-text">일기 목록을 불러오지 못했어요.</p>

        <div v-else-if="displayItems.length === 0" class="empty-state">
          <p>아직 일기가 없어요. 오늘의 첫 일기를 써보세요!</p>
          <router-link :to="{ name: 'diary-new' }" class="empty-state__btn">새 일기</router-link>
        </div>

        <template v-else>
          <div class="diary-grid diary-grid--mobile">
            <router-link
              v-for="diary in accumulatedItems"
              :key="diary.id"
              :to="{ name: 'diary-detail', params: { id: diary.id } }"
              class="diary-card"
            >
              <div class="diary-card__head">
                <h3 class="diary-card__title">{{ diary.title }}</h3>
                <div class="diary-card__meta">
                  <WeatherIcon v-if="diary.weather" :value="diary.weather" />
                  <MoodIcon v-if="diary.mood" :value="diary.mood" />
                </div>
              </div>
              <div class="diary-card__footer">
                <div v-if="diary.tags?.length" class="diary-card__tags">
                  <span v-for="tag in diary.tags" :key="tag" class="diary-card__tag">#{{ tag }}</span>
                </div>
                <span class="diary-card__date">{{ formatDiaryDate(diary.diaryDate) }}</span>
              </div>
            </router-link>
            <div ref="sentinelEl" class="sentinel"></div>
          </div>

          <div class="diary-grid diary-grid--desktop">
            <router-link
              v-for="diary in displayItems"
              :key="diary.id"
              :to="{ name: 'diary-detail', params: { id: diary.id } }"
              class="diary-card"
            >
              <div class="diary-card__head">
                <h3 class="diary-card__title">{{ diary.title }}</h3>
                <div class="diary-card__meta">
                  <WeatherIcon v-if="diary.weather" :value="diary.weather" />
                  <MoodIcon v-if="diary.mood" :value="diary.mood" />
                </div>
              </div>
              <div class="diary-card__footer">
                <div v-if="diary.tags?.length" class="diary-card__tags">
                  <span v-for="tag in diary.tags" :key="tag" class="diary-card__tag">#{{ tag }}</span>
                </div>
                <span class="diary-card__date">{{ formatDiaryDate(diary.diaryDate) }}</span>
              </div>
            </router-link>
          </div>

          <div class="pagination">
            <button
              type="button"
              class="pagination__btn"
              :disabled="filters.page <= 1"
              @click="goToPage(filters.page - 1)"
            >
              이전
            </button>
            <span class="pagination__label">{{ filters.page }} / {{ totalPages }}</span>
            <button
              type="button"
              class="pagination__btn"
              :disabled="filters.page >= totalPages"
              @click="goToPage(filters.page + 1)"
            >
              다음
            </button>
          </div>
        </template>
      </div>

      <router-link :to="{ name: 'diary-new' }" class="fab" aria-label="새 일기">+</router-link>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import DiaryFilterSheet from '../features/diaries/DiaryFilterSheet.vue'
import Skeleton from '../shared/components/Skeleton.vue'
import { useDiariesQuery } from '../features/diaries/api.js'
import { formatDiaryDate } from '../shared/utils/date.js'
import WeatherIcon from '../shared/components/WeatherIcon.vue'
import MoodIcon from '../shared/components/MoodIcon.vue'

function computeLimit() {
  if (typeof window === 'undefined') return 6
  return window.matchMedia('(min-width: 1440px)').matches ? 12 : 6
}

const filters = reactive({ weather: '', mood: '', tag: '', page: 1, limit: computeLimit() })

const { data, isLoading, isError } = useDiariesQuery(filters)

const displayItems = computed(() => data.value?.items ?? [])
const totalPages = computed(() => data.value?.pagination?.totalPages ?? 1)

const accumulatedItems = ref([])

watch(
  () => [filters.weather, filters.mood, filters.tag],
  () => {
    accumulatedItems.value = []
  }
)

watch(
  data,
  (nextData) => {
    if (!nextData) return

    if (filters.page <= 1) {
      accumulatedItems.value = nextData.items
    } else {
      accumulatedItems.value = [...accumulatedItems.value, ...nextData.items]
    }
  },
  { immediate: true }
)

function handleApplyFilters({ weather, mood, tag }) {
  filters.weather = weather
  filters.mood = mood
  filters.tag = tag
  filters.page = 1
}

function goToPage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value) return
  filters.page = nextPage
}

const isMobile = ref(false)
const sentinelEl = ref(null)
let mediaQueryList = null
let wideMediaQueryList = null
let observer = null

function handleMediaChange(event) {
  isMobile.value = event.matches
}

function handleWideMediaChange(event) {
  filters.limit = event.matches ? 12 : 6
  filters.page = 1
  accumulatedItems.value = []
}

function handleIntersect(entries) {
  if (!isMobile.value) return
  const entry = entries[0]
  if (entry?.isIntersecting && filters.page < totalPages.value) {
    filters.page += 1
  }
}

onMounted(() => {
  mediaQueryList = window.matchMedia('(max-width: 767px)')
  isMobile.value = mediaQueryList.matches
  mediaQueryList.addEventListener('change', handleMediaChange)

  wideMediaQueryList = window.matchMedia('(min-width: 1440px)')
  wideMediaQueryList.addEventListener('change', handleWideMediaChange)
})

watch(sentinelEl, (el) => {
  observer?.disconnect()
  if (el && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(handleIntersect)
    observer.observe(el)
  }
})

onBeforeUnmount(() => {
  mediaQueryList?.removeEventListener('change', handleMediaChange)
  wideMediaQueryList?.removeEventListener('change', handleWideMediaChange)
  observer?.disconnect()
})


</script>

<style scoped>
.diary-list-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diary-list-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 767px) {
  .diary-list-page {
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 16px;
    overflow: hidden;
  }

  .diary-list-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.status-text {
  text-align: center;
  color: var(--muted);
  padding: 24px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  text-align: center;
  color: var(--muted);
}

.empty-state__btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  background-color: var(--accent);
  color: #ffffff;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.empty-state__btn:hover {
  background-color: #4338ca;
}

.diary-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.diary-grid--desktop {
  display: none;
}

.diary-card {
  display: block;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  background: var(--card);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.diary-card:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

.diary-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.diary-card__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);
}

.diary-card__meta {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--muted);
}

.diary-card__footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.diary-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.diary-card__tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4338ca;
  background-color: #eef2ff;
  border-radius: 999px;
  padding: 2px 9px;
}

.diary-card__date {
  font-size: 0.75rem;
  color: var(--muted);
}

.sentinel {
  height: 1px;
}

.pagination {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

.pagination__btn {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background-color: var(--accent);
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.pagination__btn:hover:not(:disabled) {
  background-color: #4338ca;
}

.pagination__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--accent);
  color: #ffffff;
  font-size: 1.75rem;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.16);
  transition: background-color 0.15s ease;
}

.fab:hover {
  background-color: #4338ca;
}

@media (min-width: 768px) {
  .diary-grid--mobile {
    display: none;
  }

  .diary-grid--desktop {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .pagination {
    display: flex;
  }
}

@media (min-width: 1440px) {
  .diary-grid--desktop {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
