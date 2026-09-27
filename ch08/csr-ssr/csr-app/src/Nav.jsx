import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Nav() {
  const [clicks, setClicks] = useState(0)

  return (
    <div className="topbar">
      <span className="brand">CSR · React + Vite</span>
      <nav className="links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>홈</NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>소개</NavLink>
        <NavLink to="/posts" className={({ isActive }) => (isActive ? 'active' : '')}>글 목록</NavLink>
      </nav>
      <div className="counter">
        <button type="button" onClick={() => setClicks((c) => c + 1)}>
          클릭 카운트 {clicks}
        </button>
        <small>링크 이동은 유지, 새로고침은 초기화</small>
      </div>
    </div>
  )
}
