import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Skeleton from './Skeleton.vue'

describe('Skeleton', () => {
  it('기본 props로 mount하면 3개의 placeholder를 렌더한다', () => {
    const wrapper = mount(Skeleton)

    const placeholders = wrapper.element.children
    expect(placeholders.length).toBe(3)
  })

  it('count=5를 전달하면 5개의 placeholder를 렌더한다', () => {
    const wrapper = mount(Skeleton, {
      props: {
        count: 5,
      },
    })

    const placeholders = wrapper.element.children
    expect(placeholders.length).toBe(5)
  })
})
