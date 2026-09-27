import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WorkLogDetailPage from './WorkLogDetailPage'
import client from '../api/client'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))

function renderPage(id = '1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/work-logs/${id}`]}>
          <Routes>
            <Route path="/work-logs/:id" element={<WorkLogDetailPage />} />
            <Route path="/work-logs/:id/edit" element={<div>수정 스텁</div>} />
            <Route path="/work-logs" element={<div>목록 스텁</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}

const sampleWorkLog = {
  id: '1',
  logDate: '2026-07-17',
  dayOfWeek: 'FRIDAY',
  title: '상세 테스트 업무',
  content: '업무 내용입니다',
  isCompleted: true,
  issueSolution: '문제와 해결책입니다',
  tomorrowPlan: null,
  createdAt: '2026-07-17T00:00:00Z',
  updatedAt: '2026-07-17T00:00:00Z',
}

describe('WorkLogDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('정상 조회 시 필드 값이 화면에 노출된다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleWorkLog })

    renderPage()

    await screen.findByText('상세 테스트 업무')
    expect(await screen.findByText('업무 내용입니다')).toBeInTheDocument()
    expect(await screen.findByText('문제와 해결책입니다')).toBeInTheDocument()
    expect(await screen.findByText('완료')).toBeInTheDocument()
  })

  it('404 에러 발생 시 alert 영역에 메시지가 노출된다', async () => {
    client.get.mockRejectedValueOnce({
      response: { status: 404, data: { message: '업무일지를 찾을 수 없습니다.' } },
    })

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('업무일지를 찾을 수 없습니다.')
  })

  it('403 에러 발생 시 alert 영역에 메시지가 노출된다', async () => {
    client.get.mockRejectedValueOnce({
      response: { status: 403, data: { message: '접근 권한이 없습니다.' } },
    })

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('접근 권한이 없습니다.')
  })

  it('수정 링크는 수정 화면 경로를 가리킨다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleWorkLog })

    renderPage()

    const editLink = await screen.findByText('수정')
    expect(editLink.getAttribute('href')).toBe('/work-logs/1/edit')
  })

  it('삭제 확인 취소 시 client.delete가 호출되지 않는다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleWorkLog })
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage()

    const deleteButton = await screen.findByText('삭제')
    fireEvent.click(deleteButton)

    expect(client.delete).not.toHaveBeenCalled()
  })

  it('삭제 확인 시 client.delete가 호출되고 목록 화면으로 이동한다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleWorkLog })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    client.delete.mockResolvedValueOnce({})

    renderPage()

    const deleteButton = await screen.findByText('삭제')
    fireEvent.click(deleteButton)

    await screen.findByText('목록 스텁')
    expect(client.delete).toHaveBeenCalledWith('/work-logs/1')
  })
})
