import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      <header className="hero">
        <span className="badge">CSR · Client-Side Rendering</span>
        <h1>클라이언트에서 그리는 화면</h1>
        <p className="subtitle">
          이 앱은 최초 접속 시 JS 번들 전체를 한 번에 내려받습니다. 이후 화면
          전환과 렌더링은 전부 브라우저 안에서 이뤄집니다.
        </p>
      </header>

      <div className="grid">
        <div className="card">
          <span className="num">01</span>
          <h2>LOAD</h2>
          <h3>번들을 한 번에 다운로드</h3>
          <div className="tags">
            <span className="tag">index.html</span>
            <span className="tag">JS 번들</span>
          </div>
          <p>서버는 어떤 경로로 요청하든 같은 빈 index.html과 JS 번들을 내려줍니다. 실제 화면은 그 이후 브라우저가 그립니다.</p>
        </div>
        <div className="card">
          <span className="num">02</span>
          <h2>ROUTE</h2>
          <h3>브라우저 안에서 라우팅</h3>
          <div className="tags">
            <span className="tag">React Router</span>
            <span className="tag">클라이언트 렌더링</span>
          </div>
          <p>홈 / 소개 / 글 목록 이동은 서버에 다시 요청하지 않고, React Router가 URL을 읽어 화면만 바꿔 그립니다.</p>
        </div>
      </div>

      <div className="cta-row">
        <Link className="button" to="/posts">글 목록 보러가기</Link>
        <Link className="button ghost" to="/about">소개 페이지로</Link>
      </div>

      <div className="flow">
        <h3>요청부터 화면까지</h3>
        <div className="layers">
          <div className="layer"><strong>1. 요청</strong><span>어떤 경로든 동일 요청</span></div>
          <div className="layer"><strong>2. 빈 HTML</strong><span>&lt;div id="root"&gt;&lt;/div&gt;</span></div>
          <div className="layer"><strong>3. JS 다운로드</strong><span>번들 전체 실행</span></div>
          <div className="layer"><strong>4. 클라이언트 렌더링</strong><span>React Router가 화면 결정</span></div>
        </div>
      </div>
    </>
  )
}
