import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  return (
    <header className="app-header">
      <div className="app-header-bar">
        <NavLink to="/work-logs" className="nav-logo" onClick={close}>업무일지</NavLink>
        <div className="nav-right-group">
          <nav className="nav-links">
            <NavLink to="/work-logs" end>업무일지 목록</NavLink>
            <NavLink to="/mypage">내정보</NavLink>
          </nav>
          <NavLink to="/work-logs/new" className="nav-write-btn" onClick={close}>업무일지 작성</NavLink>
          <button
            type="button"
            className="nav-hamburger"
            aria-label="메뉴 열기"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {isOpen && (
        <nav className="nav-mobile-menu">
          <NavLink to="/work-logs" end onClick={close}>업무일지 목록</NavLink>
          <NavLink to="/mypage" onClick={close}>내정보</NavLink>
        </nav>
      )}
    </header>
  );
}

export default Navigation;
