<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">📔 비밀일기</h1>
      <p class="login-subtitle">로그인</p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="form-field">
          <span class="form-label">이메일 또는 사용자명</span>
          <input
            v-model="identifier"
            type="text"
            name="identifier"
            autocomplete="username"
            required
          />
        </label>

        <label class="form-field">
          <span class="form-label">비밀번호</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
        </label>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="loginMutation.isPending.value">
          {{ loginMutation.isPending.value ? '로그인 중...' : '로그인' }}
        </button>
      </form>

      <p class="signup-link">
        계정이 없으신가요?
        <router-link :to="{ name: 'signup' }">가입하기</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLoginMutation } from '../features/auth/login.js'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const loginMutation = useLoginMutation()

const identifier = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''

  try {
    const data = await loginMutation.mutateAsync({
      identifier: identifier.value,
      password: password.value,
    })

    authStore.login({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    })

    router.push({ name: 'home' })
  } catch (error) {
    if (error?.response?.status === 401) {
      errorMessage.value = '이메일 또는 비밀번호가 올바르지 않습니다'
    } else {
      errorMessage.value = '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--bg);
}

.login-card {
  width: 100%;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin-bottom: 4px;
}

.login-subtitle {
  text-align: center;
  color: var(--muted);
  margin-bottom: 24px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--muted);
}

.form-field input {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.error-message {
  background: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.875rem;
}

.submit-btn {
  min-height: 44px;
  background-color: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.submit-btn:hover:not(:disabled) {
  filter: brightness(0.92);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-link {
  margin-top: 16px;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
}

.signup-link a {
  position: relative;
  display: inline-block;
  color: var(--accent);
  font-weight: 600;
}

.signup-link a::before {
  content: '';
  position: absolute;
  inset: -14px -4px;
}

@media (min-width: 768px) {
  .login-card {
    max-width: 400px;
    padding: 32px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
}
</style>
