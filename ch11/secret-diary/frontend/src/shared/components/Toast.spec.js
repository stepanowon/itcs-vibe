import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Toast from './Toast.vue'
import { useToast } from '../composables/useToast.js'

describe('Toast', () => {
  beforeEach(() => {
    const { toastState } = useToast()
    toastState.visible = false
    toastState.message = ''
  })

  it('showToast 호출 전에는 메시지를 렌더하지 않는다', () => {
    const wrapper = mount(Toast)

    expect(wrapper.text()).not.toContain('테스트 메시지')
  })

  it('showToast 호출 후 메시지를 렌더한다', async () => {
    const { showToast } = useToast()
    const wrapper = mount(Toast)

    showToast('테스트 메시지')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('테스트 메시지')
  })
})
