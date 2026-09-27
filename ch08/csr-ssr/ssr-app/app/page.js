import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const renderedAt = new Date().toLocaleTimeString();

  return (
    <>
      <header className="hero">
        <span className="badge">SSR · Server-Side Rendering</span>
        <h1>서버에서 완성해 보내는 화면</h1>
        <p className="subtitle">이 페이지가 서버에서 렌더된 시각: {renderedAt}</p>
      </header>

      <div className="grid">
        <div className="card">
          <span className="num">01</span>
          <h2>REQUEST</h2>
          <h3>경로마다 다른 HTML</h3>
          <div className="tags">
            <span className="tag">force-dynamic</span>
            <span className="tag">완성된 HTML</span>
          </div>
          <p>주소창에 이 URL을 직접 입력하거나 새로고침하면, 서버가 매번 이 경로에 맞는 HTML을 새로 만들어 보냅니다. 위 클릭 카운트가 0으로 초기화되는 것으로 확인할 수 있습니다.</p>
        </div>
        <div className="card">
          <span className="num">02</span>
          <h2>NAVIGATE</h2>
          <h3>그 이후엔 CSR처럼</h3>
          <div className="tags">
            <span className="tag">next/link</span>
            <span className="tag">클라이언트 전환</span>
          </div>
          <p>위의 소개나 글 목록 링크를 클릭해서 이동하면, 브라우저는 전체 페이지를 다시 받지 않고 바뀐 부분만 받아 그립니다. 클릭 카운트가 유지되는지 확인해보세요.</p>
        </div>
      </div>

      <div className="cta-row">
        <Link className="button" href="/posts">글 목록 보러가기</Link>
        <Link className="button ghost" href="/about">소개 페이지로</Link>
      </div>

      <div className="flow">
        <h3>요청부터 화면까지</h3>
        <div className="layers">
          <div className="layer"><strong>1. 요청</strong><span>경로별로 다른 요청</span></div>
          <div className="layer"><strong>2. 서버 렌더링</strong><span>데이터 조회 + HTML 생성</span></div>
          <div className="layer"><strong>3. 완성된 HTML</strong><span>내용이 채워진 응답</span></div>
          <div className="layer"><strong>4. 이후 링크 이동</strong><span>클라이언트에서 처리</span></div>
        </div>
      </div>
    </>
  );
}
