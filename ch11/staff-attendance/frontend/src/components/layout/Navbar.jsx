import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import Badge from '../ui/Badge.jsx'
import { ROLE_LABEL } from '../../constants/labels.js'

const MENUS_BY_ROLE = {
  employee: [
    { to: '/dashboard', label: '대시보드' },
    { to: '/leave-requests', label: '연차 신청' },
    { to: '/attendances/me', label: '내 근태 현황' },
    { to: '/me', label: '내 정보' },
  ],
  manager: [
    { to: '/dashboard', label: '대시보드' },
    { to: '/leave-requests', label: '연차 신청' },
    { to: '/leave-requests/manage', label: '연차 승인 관리' },
    { to: '/attendances', label: '전체 근태 현황' },
    { to: '/users', label: '사용자 관리' },
    { to: '/me', label: '내 정보' },
  ],
}

function MenuList({ menus, className, linkClassName, onLinkClick }) {
  return (
    <ul className={`nav flex-column ${className}`}>
      {menus.map((menu) => (
        <li className="nav-item" key={menu.to}>
          <NavLink
            to={menu.to}
            end
            onClick={onLinkClick}
            className={({ isActive }) =>
              `nav-link ${linkClassName} ${isActive ? 'active bg-success-subtle text-success fw-semibold' : 'text-body'}`
            }
          >
            {menu.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const menus = MENUS_BY_ROLE[role] ?? []

  const handleLogout = () => {
    useAuthStore.getState().logout()
    setDrawerOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="navbar navbar-expand-md bg-white border-bottom px-3 sticky-top">
        <span className="navbar-brand text-success fw-bold mb-0">근태관리 앱</span>

        <button
          type="button"
          className="btn btn-link d-md-none ms-auto p-0 fs-4 text-body text-decoration-none"
          aria-label="메뉴 열기"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>

        <div className="d-none d-md-flex align-items-center gap-3 ms-auto">
          {user && (
            <span className="text-body-secondary small d-flex align-items-center gap-2">
              {user.name}님 <Badge status={role}>{ROLE_LABEL[role]}</Badge>
            </span>
          )}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </nav>

      {/* 데스크톱(768px~) 좌측 사이드바 */}
      <MenuList
        menus={menus}
        className="d-none d-md-flex position-fixed start-0 bg-white border-end p-3 gap-1"
        linkClassName="rounded"
        onLinkClick={undefined}
      />

      {drawerOpen && (
        <div className="offcanvas offcanvas-start show d-md-none" role="dialog" aria-modal="true" style={{ visibility: 'visible' }}>
          <div className="offcanvas-header border-bottom">
            {user && (
              <span className="d-flex align-items-center gap-2">
                {user.name}님 <Badge status={role}>{ROLE_LABEL[role]}</Badge>
              </span>
            )}
            <button type="button" className="btn-close" aria-label="메뉴 닫기" onClick={() => setDrawerOpen(false)} />
          </div>
          <div className="offcanvas-body d-flex flex-column">
            <MenuList menus={menus} className="gap-1 flex-fill" linkClassName="rounded" onLinkClick={() => setDrawerOpen(false)} />
            <button type="button" className="btn btn-success mt-auto" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </>
  )
}
