import { describe, it, expect } from 'vitest'
import { toKoreanDayOfWeek } from './dayOfWeek'

describe('toKoreanDayOfWeek', () => {
  it('영문 요일 상수를 한글 한 글자로 변환한다', () => {
    expect(toKoreanDayOfWeek('MONDAY')).toBe('월')
    expect(toKoreanDayOfWeek('SUNDAY')).toBe('일')
  })

  it('알 수 없는 값은 그대로 반환한다', () => {
    expect(toKoreanDayOfWeek('UNKNOWN')).toBe('UNKNOWN')
  })
})
