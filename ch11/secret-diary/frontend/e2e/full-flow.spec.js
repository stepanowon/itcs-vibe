import { test, expect } from '@playwright/test'

// 백엔드(http://localhost:3000)가 실행 중이어야 한다(backend/CLAUDE.md 참고, 실제 Supabase DB 대상).
// 가입 -> 로그인 -> 작성 -> 필터 -> 수정 -> 삭제 -> 로그아웃 전체 플로우 점검 (FE-12).

test('가입-로그인-작성-필터-수정-삭제-로그아웃 전체 플로우가 통과한다', async ({ page }) => {
  const stamp = Date.now()
  const email = `qa.e2e.${stamp}@example.com`
  const username = `qa_e2e_${stamp.toString().slice(-8)}`
  const password = 'P@ssw0rd!'

  // 1. 회원가입
  await page.goto('/signup')
  await page.getByRole('textbox', { name: '이메일' }).fill(email)
  await page.getByRole('textbox', { name: '사용자명' }).fill(username)
  await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(password)
  await page.getByRole('textbox', { name: '비밀번호 확인' }).fill(password)
  await page.getByRole('button', { name: '가입하기' }).click()
  await expect(page).toHaveURL(/\/login$/)

  // 2. 로그인
  await page.getByRole('textbox', { name: '이메일 또는 사용자명' }).fill(username)
  await page.getByRole('textbox', { name: '비밀번호' }).fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // 3. 일기 작성
  await page.getByRole('link', { name: '새 일기' }).first().click()
  await expect(page).toHaveURL(/\/diaries\/new$/)
  await page.getByRole('textbox', { name: '제목' }).fill('E2E 테스트 일기')
  await page.getByRole('textbox', { name: '본문' }).fill('전체 플로우 점검용 본문입니다.')
  await page.getByRole('button', { name: '비' }).click()
  await page.getByRole('button', { name: '슬픔' }).click()
  const tagField = page.getByRole('textbox', { name: '태그 입력 후 Enter' })
  await tagField.fill('e2e')
  await tagField.press('Enter')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page).toHaveURL(/\/diaries\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: 'E2E 테스트 일기' })).toBeVisible()

  // 4. 목록 + 필터
  await page.getByRole('link', { name: '일기', exact: true }).click()
  await expect(page).toHaveURL('http://localhost:5173/')
  await expect(page.locator('.diary-card__title:visible', { hasText: 'E2E 테스트 일기' })).toBeVisible()
  await page.getByRole('button', { name: '비' }).click()
  await page.getByRole('button', { name: '필터 적용' }).click()
  await expect(page.locator('.diary-card__title:visible', { hasText: 'E2E 테스트 일기' })).toBeVisible()

  // 5. 수정
  await page.locator('.diary-card__title:visible', { hasText: 'E2E 테스트 일기' }).click()
  await page.getByRole('link', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/edit$/)
  await expect(page.getByRole('textbox', { name: '제목' })).toHaveValue('E2E 테스트 일기')
  await page.getByRole('textbox', { name: '제목' }).fill('E2E 테스트 일기 (수정됨)')
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByRole('heading', { name: 'E2E 테스트 일기 (수정됨)' })).toBeVisible()

  // 6. 삭제 (이중 확인)
  await page.getByRole('button', { name: '삭제' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: '삭제' }).click()
  await expect(page).toHaveURL('http://localhost:5173/')
  await expect(page.getByText('아직 일기가 없어요')).toBeVisible()

  // 7. 로그아웃 (내 정보 화면, Refresh Token 서버 무효화 경로)
  await page.getByRole('link', { name: '내 정보' }).click()
  await expect(page).toHaveURL(/\/me$/)
  await page.locator('main').getByRole('button', { name: '로그아웃' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
