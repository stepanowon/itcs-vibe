<template>
  <form class="password-change-form" @submit.prevent="handleSubmit">
    <label class="form-field">
      <span class="form-label">현재 비밀번호</span>
      <input
        v-model="currentPassword"
        type="password"
        name="currentPassword"
        autocomplete="current-password"
        required
      />
    </label>

    <label class="form-field">
      <span class="form-label">새 비밀번호</span>
      <input
        v-model="newPassword"
        type="password"
        name="newPassword"
        autocomplete="new-password"
        required
      />
      <span class="field-hint">8자 이상</span>
    </label>

    <label class="form-field">
      <span class="form-label">새 비밀번호 확인</span>
      <input
        v-model="newPasswordConfirm"
        type="password"
        name="newPasswordConfirm"
        autocomplete="new-password"
        required
      />
    </label>

    <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message" role="status">{{ successMessage }}</p>

    <button type="submit" class="submit-btn" :disabled="changePasswordMutation.isPending.value">
      {{ changePasswordMutation.isPending.value ? '변경 중...' : '변경하기' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useChangePasswordMutation } from './api.js'

const changePasswordMutation = useChangePasswordMutation()

const currentPassword = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const errorMessage = ref('')
const successMessage = ref('')

function resetForm() {
  currentPassword.value = ''
  newPassword.value = ''
  newPasswordConfirm.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = '새 비밀번호는 8자 이상이어야 합니다'
    return
  }

  if (newPassword.value !== newPasswordConfirm.value) {
    errorMessage.value = '새 비밀번호 확인이 일치하지 않습니다'
    return
  }

  try {
    await changePasswordMutation.mutateAsync({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    resetForm()
    successMessage.value = '비밀번호가 변경되었습니다'
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ?? '비밀번호 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
  }
}
</script>

<style scoped>
.password-change-form {
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
  color: var(--text);
}

.form-field input {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  color: var(--text);
}

.form-field input:focus {
  outline: none;
  border-color: var(--accent);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--muted);
}

.error-message {
  padding: 10px 12px;
  background-color: #fef2f2;
  color: #b91c1c;
  border-radius: 8px;
  font-size: 0.875rem;
}

.success-message {
  padding: 10px 12px;
  background-color: #ecfdf5;
  color: #047857;
  border-radius: 8px;
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
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
