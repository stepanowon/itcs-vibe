import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App.jsx';
import { ToastProvider } from '../../components/ui/index.js';
import { useAuthStore } from '../../store/authStore.js';

const INITIAL_AUTH_STATE = useAuthStore.getState();

function renderApp(path) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const PUBLIC_ROUTES = [
  ['/signup', '회원가입'],
  ['/login', '로그인'],
];

const EMPLOYEE_ROUTES = [
  ['/dashboard', '대시보드'],
  ['/leave-requests', '연차 신청'],
  ['/attendances/me', '내 근태 현황'],
  ['/me', '내 정보'],
];

const MANAGER_ONLY_ROUTES = [
  ['/leave-requests/manage', '연차 승인 관리'],
  ['/attendances', '전체 근태 현황'],
  ['/users', '사용자 관리'],
];

describe('라우팅', () => {
  afterEach(() => {
    useAuthStore.setState(INITIAL_AUTH_STATE, true);
  });

  it.each(PUBLIC_ROUTES)('%s 경로는 "%s" 제목을 렌더링한다', (path, title) => {
    renderApp(path);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it.each(EMPLOYEE_ROUTES)('로그인 상태에서 %s 경로는 "%s" 제목을 렌더링한다', (path, title) => {
    useAuthStore.setState({ accessToken: 'token', role: 'employee', user: { id: 'u1', role: 'employee' } });
    renderApp(path);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it.each(MANAGER_ONLY_ROUTES)('manager 로그인 상태에서 %s 경로는 "%s" 제목을 렌더링한다', (path, title) => {
    useAuthStore.setState({ accessToken: 'token', role: 'manager', user: { id: 'm1', role: 'manager' } });
    renderApp(path);

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('로그인하지 않은 상태로 /dashboard 접근 시 /login으로 리다이렉트된다', () => {
    renderApp('/dashboard');

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('employee 로그인 상태로 manager 전용 라우트(/users) 접근 시 "접근 권한이 없습니다"가 표시되고 화면에 진입하지 못한다', () => {
    useAuthStore.setState({ accessToken: 'token', role: 'employee', user: { id: 'u1', role: 'employee' } });
    renderApp('/users');

    expect(screen.getByRole('alert')).toHaveTextContent('접근 권한이 없습니다');
    expect(screen.queryByRole('heading', { name: '사용자 관리' })).not.toBeInTheDocument();
  });

  it('존재하지 않는 경로는 /login으로 리다이렉트된다', () => {
    renderApp('/unknown');

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });
});
