import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmModal from './ConfirmModal.vue'

describe('ConfirmModal', () => {
  it('open=false이면 모달 컨텐츠를 렌더하지 않는다', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: false,
        title: '삭제 확인',
        message: '정말 삭제하시겠습니까?',
      },
    })

    expect(wrapper.text()).not.toContain('삭제 확인')
    expect(wrapper.text()).not.toContain('정말 삭제하시겠습니까?')
  })

  it('open=true이면 title과 message를 렌더한다', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: '삭제 확인',
        message: '정말 삭제하시겠습니까?',
      },
    })

    expect(wrapper.text()).toContain('삭제 확인')
    expect(wrapper.text()).toContain('정말 삭제하시겠습니까?')
  })

  it('확인 버튼 클릭 시 confirm 이벤트를 emit한다', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: '삭제 확인',
        message: '정말 삭제하시겠습니까?',
      },
    })

    const buttons = wrapper.findAll('button, [role="button"]')
    const confirmButton = buttons.find((b) => /확인|삭제/.test(b.text()))
    expect(confirmButton).toBeTruthy()

    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('취소 버튼 클릭 시 cancel 이벤트를 emit한다', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        open: true,
        title: '삭제 확인',
        message: '정말 삭제하시겠습니까?',
      },
    })

    const buttons = wrapper.findAll('button, [role="button"]')
    const cancelButton = buttons.find((b) => /취소/.test(b.text()))
    expect(cancelButton).toBeTruthy()

    await cancelButton.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
