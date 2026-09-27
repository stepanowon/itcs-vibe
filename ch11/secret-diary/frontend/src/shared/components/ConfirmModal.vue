<template>
  <div v-if="open" class="confirm-modal">
    <div class="confirm-modal__overlay" @click="$emit('cancel')"></div>
    <div class="confirm-modal__dialog" role="dialog" aria-modal="true">
      <h3 v-if="title" class="confirm-modal__title">{{ title }}</h3>
      <p v-if="message" class="confirm-modal__message">{{ message }}</p>
      <div class="confirm-modal__actions">
        <button type="button" class="confirm-modal__btn confirm-modal__btn--cancel" @click="$emit('cancel')">
          {{ cancelLabel }}
        </button>
        <button type="button" class="confirm-modal__btn confirm-modal__btn--confirm" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: '삭제' },
  cancelLabel: { type: String, default: '취소' },
})

defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-modal__overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.5);
}

.confirm-modal__dialog {
  position: relative;
  z-index: 1;
  width: min(320px, calc(100% - 32px));
  padding: 20px;
  background-color: var(--card);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
}

.confirm-modal__title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  color: var(--text);
  font-weight: 700;
}

.confirm-modal__message {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 0.9rem;
}

.confirm-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.confirm-modal__btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.confirm-modal__btn--cancel {
  border: 1px solid var(--border);
  background-color: #ffffff;
  color: var(--text);
}

.confirm-modal__btn--confirm {
  border: none;
  background-color: #dc2626;
  color: #ffffff;
}
</style>
