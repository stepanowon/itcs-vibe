'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const [clicks, setClicks] = useState(0);
  const pathname = usePathname();

  const linkClass = (href) => (pathname === href ? 'active' : '');

  return (
    <div className="topbar">
      <span className="brand">SSR · Next.js</span>
      <nav className="links">
        <Link href="/" className={linkClass('/')}>홈</Link>
        <Link href="/about" className={linkClass('/about')}>소개</Link>
        <Link href="/posts" className={linkClass('/posts')}>글 목록</Link>
      </nav>
      <div className="counter">
        <button type="button" onClick={() => setClicks((c) => c + 1)}>
          클릭 카운트 {clicks}
        </button>
        <small>링크 이동은 유지, 새로고침은 초기화</small>
      </div>
    </div>
  );
}
