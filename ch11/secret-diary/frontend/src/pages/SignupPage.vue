<template>
  <div class="signup-page">
    <div class="signup-card">
      <h1 class="signup-title">📔 비밀일기</h1>
      <p class="signup-subtitle">회원가입</p>

      <form class="signup-form" @submit.prevent="handleSubmit">
        <label class="form-field">
          <span class="form-label">이메일</span>
          <input v-model="email" type="email" name="email" autocomplete="email" required />
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </label>

        <label class="form-field">
          <span class="form-label">사용자명</span>
          <input v-model="username" type="text" name="username" autocomplete="username" required />
          <span v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</span>
        </label>

        <label class="form-field">
          <span class="form-label">비밀번호</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="new-password"
            required
          />
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </label>

        <label class="form-field">
          <span class="form-label">비밀번호 확인</span>
          <input
            v-model="passwordConfirm"
            type="password"
            name="passwordConfirm"
            autocomplete="new-password"
            required
          />
          <span v-if="fieldErrors.passwordConfirm" class="field-error">{{
            fieldErrors.passwordConfirm
          }}</span>
        </label>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="signupMutation.isPending.value">
          {{ signupMutation.isPending.value ? '가입 중...' : '가입하기' }}
        </button>
      </form>

      <p class="login-link">
        이미 계정이 있으신가요?
        <router-link :to="{ name: 'login' }">로그인</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSignupMutation } from '../features/auth/signup.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const router = useRouter()
const signupMutation = useSignupMutation()

const email = ref('')
const username = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errorMessage = ref('')
const fieldErrors = reactive({
  email: '',
  username: '',
  password: '',
  passwordConfirm: '',
})

function resetFieldErrors() {
  fieldErrors.email = ''
  fieldErrors.username = ''
  fieldErrors.password = ''
  fieldErrors.passwordConfirm = ''
}

function validate() {
  resetFieldErrors()
  let isValid = true

  if (!EMAIL_PATTERN.test(email.value)) {
    fieldErrors.email = '올바른 이메일 형식이 아닙니다'
    isValid = false
  }

  if (username.value.length < 2 || username.value.length > 50) {
    fieldErrors.username = '사용자명은 2자 이상 50자 이하로 입력해주세요'
    isValid = false
  }

  if (password.value.length < 8) {
    fieldErrors.password = '비밀번호는 8자 이상 입력해주세요'
    isValid = false
  }

  if (password.value !== passwordConfirm.value) {
    fieldErrors.passwordConfirm = '비밀번호가 일치하지 않습니다'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!validate()) {
    return
  }

  try {
    await signupMutation.mutateAsync({
      email: email.value,
      username: username.value,
      password: password.value,
    })

    router.push({ name: 'login' })
  } catch (error) {
    const status = error?.response?.status
    const data = error?.response?.data

    if (status === 409) {
      errorMessage.value = data?.message ?? '이미 사용 중인 이메일 또는 사용자명입니다'
    } else if (status === 400) {
      if (Array.isArray(data?.details) && data.details.length > 0) {
        data.details.forEach((detail) => {
          if (Object.prototype.hasOwnProperty.call(fieldErrors, detail.field)) {
            fieldErrors[detail.field] = detail.message
          }
        })
      } else {
        errorMessage.value = data?.message ?? '입력하신 정보를 다시 확인해주세요'
      }
    } else {
      errorMessage.value = '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
    }
  }
}
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: var(--bg);
}

.signup-card {
  width: 100%;
}

.signup-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  margin-bottom: 4px;
}

.signup-subtitle {
  text-align: center;
  color: var(--muted);
  margin-bottom: 24px;
}

.signup-form {
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

.field-error {
  color: #b91c1c;
  font-size: 0.75rem;
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

.login-link {
  margin-top: 16px;
  text-align: center;
  font-size: 0.875rem;
  color: var(--muted);
}

.login-link a {
  position: relative;
  display: inline-block;
  color: var(--accent);
  font-weight: 600;
}

.login-link a::before {
  content: '';
  position: absolute;
  inset: -14px -4px;
}

@media (min-width: 768px) {
  .signup-card {
    max-width: 400px;
    padding: 32px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
}
</style>
