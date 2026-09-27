import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.js'

export default function RequireRole({ role }) {
  const currentRole = useAuthStore((s) => s.role)
  if (currentRole !== role) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        접근 권한이 없습니다
      </div>
    )
  }
  return <Outlet />
}
