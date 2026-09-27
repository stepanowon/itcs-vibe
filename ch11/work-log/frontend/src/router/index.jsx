import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import SignupPage from '../pages/SignupPage';
import LoginPage from '../pages/LoginPage';
import WorkLogListPage from '../pages/WorkLogListPage';
import WorkLogFormPage from '../pages/WorkLogFormPage';
import WorkLogDetailPage from '../pages/WorkLogDetailPage';
import MyPage from '../pages/MyPage';
import { useAuthStore } from '../store/authStore';

function RootRedirect() {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  return <Navigate to={refreshToken ? '/work-logs' : '/login'} replace />;
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <RootRedirect /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/work-logs', element: <WorkLogListPage /> },
      { path: '/work-logs/new', element: <WorkLogFormPage /> },
      { path: '/work-logs/:id', element: <WorkLogDetailPage /> },
      { path: '/work-logs/:id/edit', element: <WorkLogFormPage /> },
      { path: '/mypage', element: <MyPage /> },
    ],
  },
]);

export default router;
