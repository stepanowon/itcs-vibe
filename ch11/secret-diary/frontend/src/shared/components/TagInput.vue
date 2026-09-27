<template>
  <div class="tag-input">
    <div class="tag-input__chips">
      <span v-for="(tag, index) in modelValue" :key="tag" class="tag-chip">
        #{{ tag }}
        <button
          type="button"
          class="tag-chip__remove"
          :aria-label="`${tag} 태그 삭제`"
          @click="removeTag(index)"
        >
          ✕
        </button>
      </span>
    </div>

    <input
      v-model="draft"
      type="text"
      class="tag-input__field"
      placeholder="태그 입력 후 Enter"
      @keydown.enter.prevent="addTag"
      @keydown.,.prevent="addTag"
    />

    <p v-if="errorMessage" class="tag-input__error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const draft = ref('')
const errorMessage = ref('')

function addTag() {
  const value = draft.value.trim()
  errorMessage.value = ''

  if (!value) {
    return
  }

  if (value.length > 20) {
    errorMessage.value = '태그는 20자 이하로 입력해주세요.'
    return
  }

  if (props.modelValue.length >= 10) {
    errorMessage.value = '태그는 최대 10개까지 추가할 수 있어요.'
    return
  }

  if (props.modelValue.includes(value)) {
    draft.value = ''
    return
  }

  emit('update:modelValue', [...props.modelValue, value])
  draft.value = ''
}

function removeTag(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.tag-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-input__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  background-color: #eef2ff;
  color: #4338ca;
  font-size: 0.85rem;
}

.tag-chip__remove {
  position: relative;
  min-width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #4338ca;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  transition: color 0.15s ease;
}

.tag-chip__remove::before {
  content: '';
  position: absolute;
  inset: -10px;
}

.tag-chip__remove:hover {
  color: #312e81;
}

.tag-input__field {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.tag-input__field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.tag-input__error {
  margin: 0;
  font-size: 0.8rem;
  color: #b91c1c;
}
</style>
