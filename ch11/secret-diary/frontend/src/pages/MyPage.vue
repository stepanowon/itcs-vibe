<template>
  <AppLayout>
    <div class="my-page">
      <h1 class="page-title">내 정보</h1>

      <section class="profile-section">
        <h2 class="section-title">프로필</h2>

        <Skeleton v-if="meQuery.isLoading.value" :count="3" height="32px" />

        <dl v-else-if="meQuery.data.value" class="profile-info">
          <div class="profile-row">
            <dt>이메일</dt>
            <dd>{{ meQuery.data.value.email }}</dd>
          </div>
          <div class="profile-row">
            <dt>사용자명</dt>
            <dd>{{ meQuery.data.value.username }}</dd>
          </div>
          <div class="profile-row">
            <dt>가입일</dt>
            <dd>{{ formatJoinDate(meQuery.data.value.createdAt) }}</dd>
          </div>
          <div class="profile-row profile-row--highlight">
            <dt>작성한 일기</dt>
            <dd>{{ meQuery.data.value.diaryCount }}개</dd>
          </div>
        </dl>
      </section>

      <section class="password-section">
        <h2 class="section-title">비밀번호 변경</h2>
        <PasswordChangeForm />
      </section>

      <section class="logout-section">
        <button type="button" class="logout-btn" @click="handleLogout">로그아웃</button>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import PasswordChangeForm from '../features/users/PasswordChangeForm.vue'
import Skeleton from '../shared/components/Skeleton.vue'
import { useMeQuery } from '../features/users/api.js'
import { useAuthStore } from '../stores/auth.js'
import httpClient from '../shared/api/httpClient.js'
import { formatJoinDate } from '../shared/utils/date.js'

const router = useRouter()
const authStore = useAuthStore()
const meQuery = useMeQuery()

async function handleLogout() {
  try {
    await httpClient.post('/auth/logout', { refreshToken: authStore.refreshToken })
  } finally {
    authStore.logout()
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
.my-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.profile-section,
.password-section {
  padding: 20px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.profile-row dt {
  color: var(--muted);
  font-size: 0.875rem;
}

.profile-row dd {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}

.profile-row--highlight {
  margin-top: 8px;
  padding: 12px;
  background-color: #eff6ff;
  border-radius: 8px;
}

.profile-row--highlight dt,
.profile-row--highlight dd {
  color: #1d4ed8;
  font-weight: 700;
}

.logout-section {
  display: flex;
  justify-content: center;
}

.logout-btn {
  min-height: 44px;
  min-width: 160px;
  background-color: #ffffff;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
