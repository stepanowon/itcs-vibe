<template>
  <router-view />
  <Toast />
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from './shared/components/Toast.vue';
import { useToast } from './shared/composables/useToast';

const { showToast } = useToast();

onMounted(() => {
  window.addEventListener('server-error', (e) => {
    showToast(e.detail.message);
  });
});
</script>
