import { describe, it, expect } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import AttendancesPage from '../AttendancesPage.jsx'

function renderPage() {
  return renderWithProviders(<AttendancesPage />)
}

describe('AttendancesPage', () => {
  it('전체 직원 선택 시 직원별 요약 테이블을 렌더링한다', async () => {
    renderPage()

    expect(await screen.findByRole('columnheader', { name: '출근일수' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '미체크아웃' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: '연차사용' })).toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: '박팀장' })).toBeInTheDocument()
  })

  it('특정 직원 선택 시 일별 상세 목록으로 전환된다', async () => {
    renderPage()

    await screen.findByRole('cell', { name: '박팀장' })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'u2' } })

    await waitFor(() => expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('김사원'))
    expect(await screen.findByRole('columnheader', { name: '체크인' })).toBeInTheDocument()
    expect(screen.getByText('연차 사용 내역')).toBeInTheDocument()
  })
})
