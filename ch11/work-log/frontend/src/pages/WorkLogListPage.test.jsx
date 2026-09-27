import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WorkLogListPage from './WorkLogListPage'
import client from '../api/client'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/work-logs']}>
        <Routes>
          <Route path="/work-logs" element={<WorkLogListPage />} />
          <Route path="/work-logs/:id" element={<div>상세 스텁</div>} />
          <Route path="/work-logs/new" element={<div>작성 스텁</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function sampleItem(overrides) {
  return {
    id: '1',
    logDate: '2026-07-17',
    dayOfWeek: 'FRIDAY',
    title: '샘플 업무',
    content: 'c',
    isCompleted: true,
    issueSolution: null,
    tomorrowPlan: null,
    createdAt: '2026-07-17T00:00:00Z',
    updatedAt: '2026-07-17T00:00:00Z',
    ...overrides,
  }
}

describe('WorkLogListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('목록이 정상적으로 렌더링된다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem()], page: 1, limit: 20, total: 1 },
    })

    renderPage()

    await screen.findAllByText('샘플 업무')
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0)
  })

  it('초기 조회 시 기본 파라미터로 client.get이 호출된다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem()], page: 1, limit: 20, total: 1 },
    })

    renderPage()

    await screen.findAllByText('샘플 업무')
    expect(client.get).toHaveBeenCalledWith(
      '/work-logs',
      { params: expect.objectContaining({ page: 1, limit: 20 }) }
    )
  })

  it('완료여부 필터 적용 시 isCompleted 파라미터를 포함해 재조회한다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem()], page: 1, limit: 20, total: 1 },
    })

    renderPage()
    await screen.findAllByText('샘플 업무')

    client.get.mockResolvedValueOnce({
      data: { items: [], page: 1, limit: 20, total: 0 },
    })

    fireEvent.change(screen.getByLabelText('완료여부'), { target: { value: 'false' } })
    fireEvent.click(screen.getByRole('button', { name: '적용' }))

    await screen.findByText(/없습니다/)

    expect(client.get).toHaveBeenLastCalledWith(
      '/work-logs',
      { params: expect.objectContaining({ isCompleted: false, page: 1 }) }
    )
  })

  it('목록이 비어있으면 안내 문구가 노출된다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [], page: 1, limit: 20, total: 0 },
    })

    renderPage()

    await screen.findByText(/없습니다/)
  })

  it('에러 발생 시 alert 영역에 메시지가 노출된다', async () => {
    client.get.mockRejectedValueOnce({
      response: { data: { message: '목록 조회 실패' } },
    })

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('목록 조회 실패')
  })

  it('페이지네이션이 total에 따라 동작하고 다음 클릭 시 page 2로 재조회한다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem()], page: 1, limit: 20, total: 25 },
    })

    renderPage()
    await screen.findAllByText('샘플 업무')

    const prevButton = screen.getByRole('button', { name: '이전' })
    const nextButton = screen.getByRole('button', { name: '다음' })
    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem()], page: 2, limit: 20, total: 25 },
    })

    fireEvent.click(nextButton)

    await screen.findByText('2 / 2')

    expect(client.get).toHaveBeenLastCalledWith(
      '/work-logs',
      { params: expect.objectContaining({ page: 2 }) }
    )
  })

  it('항목 클릭 시 상세 화면으로 이동한다', async () => {
    client.get.mockResolvedValueOnce({
      data: { items: [sampleItem({ id: '42' })], page: 1, limit: 20, total: 1 },
    })

    renderPage()
    await screen.findAllByText('샘플 업무')

    const links = screen.getAllByRole('link')
    const detailLink = links.find((link) => link.getAttribute('href') === '/work-logs/42')
    expect(detailLink).toBeTruthy()

    fireEvent.click(detailLink)

    await screen.findByText('상세 스텁')
  })
})
