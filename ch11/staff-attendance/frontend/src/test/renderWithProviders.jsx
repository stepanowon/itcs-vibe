import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../components/ui/index.js'

/** 테스트 페이지 렌더용 공용 헬퍼. 필요한 Provider만 옵션으로 감싼다. */
export function renderWithProviders(ui, { withRouter = false, withToast = false } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  let content = ui
  if (withRouter) content = <MemoryRouter>{content}</MemoryRouter>
  if (withToast) content = <ToastProvider>{content}</ToastProvider>

  return render(<QueryClientProvider client={queryClient}>{content}</QueryClientProvider>)
}
