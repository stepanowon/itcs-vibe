import { test, expect } from '@playwright/test'

// 백엔드(http://localhost:3000)가 실행 중이어야 한다(backend/CLAUDE.md 참고, 실제 Supabase DB 대상).
const BREAKPOINTS = [
  { name: '모바일', width: 375, height: 812 },
  { name: '태블릿', width: 768, height: 1024 },
  { name: '데스크톱', width: 1280, height: 800 },
]

for (const bp of BREAKPOINTS) {
  test(`${bp.name}(${bp.width}px) 로그인 화면은 가로 스크롤이 없다`, async ({ page }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height })
    await page.goto('/login')

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
}

test('모바일/데스크톱 모두 상단 헤더 네비가 표시된다', async ({ page }) => {
  const email = `qa.e2e.${Date.now()}@example.com`
  const username = `qa_e2e_${Date.now().toString().slice(-8)}`
  const password = 'P@ssw0rd!'

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/signup')
  await page.getByRole('textbox', { name: '이메일' }).fill(email)
  await page.getByRole('textbox', { name: '사용자명' }).fill(username)
  await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill(password)
  await page.getByRole('textbox', { name: '비밀번호 확인' }).fill(password)
  await page.getByRole('button', { name: '가입하기' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('textbox', { name: '이메일 또는 사용자명' }).fill(username)
  await page.getByRole('textbox', { name: '비밀번호' }).fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  await expect(page.locator('.app-bar__nav')).toBeVisible()

  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.locator('.app-bar__nav')).toBeVisible()

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})
