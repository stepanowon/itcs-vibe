export default function About() {
  return (
    <>
      <header className="hero">
        <span className="badge">CSR · 소개</span>
        <h1>이미 받아둔 컴포넌트를 그렸을 뿐</h1>
        <p className="subtitle">
          이 페이지는 서버에서 새로 받아온 것이 아니라, 최초 로딩 때 함께
          내려받은 컴포넌트를 React Router가 화면에 표시한 것입니다.
        </p>
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
          <p>이 경로(/about)를 view-source나 curl로 직접 열어봐도 HTML 내용은 홈 화면과 동일한 빈 &lt;div id="root"&gt;뿐입니다.</p>
        </div>
        <div className="card">
          <span className="num">02</span>
          <h2>NAVIGATE</h2>
          <h3>새로고침하면 달라지는 것</h3>
          <div className="tags">
            <span className="tag">전체 리로드</span>
          </div>
          <p>주소창에 이 URL을 직접 입력하거나 새로고침하면, 브라우저가 페이지를 통째로 다시 불러오며 JS가 처음부터 다시 실행됩니다.</p>
        </div>
      </div>
    </>
  )
}
