import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TagInput from './TagInput.vue'

function findTagField(wrapper) {
  const input = wrapper.find('input[type="text"]')
  if (input.exists()) {
    return input
  }
  return wrapper.find('input')
}

describe('TagInput', () => {
  it('빈 태그 목록에서 텍스트 입력 후 Enter를 누르면 새 태그가 추가된 배열로 emit한다', async () => {
    const wrapper = mount(TagInput, {
      props: { modelValue: [] },
    })

    const field = findTagField(wrapper)
    await field.setValue('일상')
    await field.trigger('keydown.enter')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toEqual(['일상'])
  })

  it('21자 이상의 태그를 추가하려 하면 추가되지 않고 오류 문구가 표시된다', async () => {
    const wrapper = mount(TagInput, {
      props: { modelValue: [] },
    })

    const longTag = 'a'.repeat(21)
    const field = findTagField(wrapper)
    await field.setValue(longTag)
    await field.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.text()).toMatch(/20자/)
  })

  it('이미 태그가 10개 있는 상태에서 추가를 시도하면 거부된다', async () => {
    const tenTags = Array.from({ length: 10 }, (_, i) => `태그${i + 1}`)
    const wrapper = mount(TagInput, {
      props: { modelValue: tenTags },
    })

    const field = findTagField(wrapper)
    await field.setValue('새태그')
    await field.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.text()).toMatch(/10개/)
  })

  it('기존 태그의 삭제 버튼을 클릭하면 해당 태그가 빠진 배열로 emit한다', async () => {
    const wrapper = mount(TagInput, {
      props: { modelValue: ['일상', '여행'] },
    })

    const removeButtons = wrapper.findAll('button')
    expect(removeButtons.length).toBeGreaterThan(0)

    await removeButtons[0].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toEqual(['여행'])
  })
})
