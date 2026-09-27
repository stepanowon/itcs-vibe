export const dynamic = 'force-dynamic';

export default async function About() {
  const renderedAt = new Date().toLocaleTimeString();

  return (
    <>
      <header className="hero">
        <span className="badge">SSR · 소개</span>
        <h1>이 경로도 서버가 직접 렌더링</h1>
        <p className="subtitle">이 페이지가 서버에서 렌더된 시각: {renderedAt}</p>
      </header>

      <div className="grid">
        <div className="card">
          <span className="num">01</span>
          <h2>CHECK</h2>
          <h3>view-source로 확인</h3>
          <div className="tags">
            <span className="tag">curl</span>
            <span className="tag">view-source</span>
          </div>
          <p>curl이나 view-source로 이 경로(/about)를 직접 열어보면 이미 이 문장이 채워진 완성된 HTML을 받습니다.</p>
        </div>
        <div className="card">
          <span className="num">02</span>
          <h2>NAVIGATE</h2>
          <h3>링크로 왔다면 다릅니다</h3>
          <div className="tags">
            <span className="tag">클라이언트 전환</span>
          </div>
          <p>홈에서 "소개" 링크를 눌러 들어왔다면, 페이지 전체가 다시 로드되지 않고 이 부분만 서버에서 받아와 그려졌습니다.</p>
        </div>
      </div>
    </>
  );
}
