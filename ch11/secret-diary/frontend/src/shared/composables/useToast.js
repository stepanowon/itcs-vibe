import { reactive } from 'vue';

const state = reactive({ message: '', visible: false });
let hideTimer = null;

export function useToast() {
  function showToast(message, duration = 3000) {
    state.message = message;
    state.visible = true;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      state.visible = false;
    }, duration);
  }

  return { toastState: state, showToast };
}
