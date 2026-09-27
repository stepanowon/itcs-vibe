import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import WorkLogFormPage from './WorkLogFormPage'
import client from '../api/client'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

function renderPage(initialPath) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/work-logs/new" element={<WorkLogFormPage />} />
          <Route path="/work-logs/:id/edit" element={<WorkLogFormPage />} />
          <Route path="/work-logs/:id" element={<div>상세 스텁</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function getField(name, tag = 'input') {
  try {
    const el = screen.getByLabelText(new RegExp(name))
    if (el) return el
  } catch {
    // fallback below
  }
  return document.querySelector(`${tag}[name="${name}"]`)
}

function getSaveButton() {
  return screen.getByRole('button', { name: /저장/ })
}

function existingWorkLog(overrides) {
  return {
    id: '5',
    logDate: '2026-07-13',
    title: '기존 제목',
    content: '기존 내용',
    isCompleted: true,
    issueSolution: null,
    tomorrowPlan: null,
    createdAt: '2026-07-13T00:00:00Z',
    updatedAt: '2026-07-13T00:00:00Z',
    ...overrides,
  }
}

describe('WorkLogFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('신규 작성 모드로 렌더링되면 client.get을 호출하지 않는다', () => {
    renderPage('/work-logs/new')

    expect(client.get).not.toHaveBeenCalled()
  })

  it('신규 작성 성공 시 client.post가 호출되고 상세 화면으로 이동한다', async () => {
    client.post.mockResolvedValueOnce({
      data: { id: 'new-1', title: '새 업무', content: '내용입니다' },
    })

    renderPage('/work-logs/new')

    fireEvent.change(getField('title'), { target: { value: '새 업무' } })
    fireEvent.change(getField('content', 'textarea'), { target: { value: '내용입니다' } })
    const completedTrue = document.querySelector('input[name="isCompleted"][value="true"]')
    fireEvent.click(completedTrue)

    fireEvent.click(getSaveButton())

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith(
        '/work-logs',
        expect.objectContaining({ title: '새 업무', content: '내용입니다' })
      )
    })

    await screen.findByText('상세 스텁')
  })

  it('수정 모드에서 기존 데이터를 불러와 폼에 반영한다', async () => {
    client.get.mockResolvedValueOnce({ data: existingWorkLog() })

    renderPage('/work-logs/5/edit')

    await waitFor(() => {
      expect(getField('title').value).toBe('기존 제목')
    })
    expect(client.get).toHaveBeenCalledWith('/work-logs/5')
  })

  it('수정 성공 시 client.patch가 호출되고 상세 화면으로 이동한다', async () => {
    client.get.mockResolvedValueOnce({ data: existingWorkLog() })
    client.patch.mockResolvedValueOnce({ data: { id: '5', title: '수정된 제목' } })

    renderPage('/work-logs/5/edit')

    await waitFor(() => {
      expect(getField('title').value).toBe('기존 제목')
    })

    fireEvent.change(getField('title'), { target: { value: '수정된 제목' } })
    fireEvent.click(getSaveButton())

    await waitFor(() => {
      expect(client.patch).toHaveBeenCalledWith(
        '/work-logs/5',
        expect.objectContaining({ title: '수정된 제목' })
      )
    })

    await screen.findByText('상세 스텁')
  })

  it('400 에러 발생 시 alert 영역에 에러 메시지가 노출된다', async () => {
    client.post.mockRejectedValueOnce({
      response: { data: { message: '필수 항목이 누락되었습니다.' } },
    })

    renderPage('/work-logs/new')

    fireEvent.change(getField('title'), { target: { value: '새 업무' } })
    fireEvent.change(getField('content', 'textarea'), { target: { value: '내용입니다' } })
    fireEvent.click(document.querySelector('input[name="isCompleted"][value="true"]'))
    fireEvent.click(getSaveButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('필수 항목이 누락되었습니다.')
  })

  it('409 에러 발생 시 alert 영역에 에러 메시지가 노출된다', async () => {
    client.post.mockRejectedValueOnce({
      response: { data: { message: '이미 작성된 업무일지가 있습니다.' } },
    })

    renderPage('/work-logs/new')

    fireEvent.change(getField('title'), { target: { value: '새 업무' } })
    fireEvent.change(getField('content', 'textarea'), { target: { value: '내용입니다' } })
    fireEvent.click(document.querySelector('input[name="isCompleted"][value="true"]'))
    fireEvent.click(getSaveButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('이미 작성된 업무일지가 있습니다.')
  })

  it('에러 메시지 박스의 확인 버튼을 누르면 닫힌다', async () => {
    client.post.mockRejectedValueOnce({
      response: { data: { message: '이미 작성된 업무일지가 있습니다.' } },
    })

    renderPage('/work-logs/new')

    fireEvent.change(getField('title'), { target: { value: '새 업무' } })
    fireEvent.change(getField('content', 'textarea'), { target: { value: '내용입니다' } })
    fireEvent.click(document.querySelector('input[name="isCompleted"][value="true"]'))
    fireEvent.click(getSaveButton())

    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
