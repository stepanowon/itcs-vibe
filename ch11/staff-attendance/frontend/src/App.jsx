import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RequireRole from './components/RequireRole.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import SignupPage from './pages/SignupPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LeaveRequestsPage from './pages/LeaveRequestsPage.jsx'
import LeaveRequestsManagePage from './pages/LeaveRequestsManagePage.jsx'
import AttendancesMePage from './pages/AttendancesMePage.jsx'
import AttendancesPage from './pages/AttendancesPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import MePage from './pages/MePage.jsx'

function RouteLogger() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[route] ${pathname}`)
    }
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <RouteLogger />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/attendances/me" element={<AttendancesMePage />} />
            <Route path="/me" element={<MePage />} />

            <Route element={<RequireRole role="manager" />}>
              <Route path="/leave-requests/manage" element={<LeaveRequestsManagePage />} />
              <Route path="/attendances" element={<AttendancesPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}
