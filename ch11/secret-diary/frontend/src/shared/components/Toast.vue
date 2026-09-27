<template>
  <div v-if="toastState.visible" class="toast" role="alert">
    {{ toastState.message }}
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { toastState } = useToast();
</script>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  min-height: 44px;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e293b;
  color: #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
  z-index: 9999;
}
</style>
