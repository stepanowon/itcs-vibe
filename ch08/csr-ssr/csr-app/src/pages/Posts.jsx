import { useEffect, useState } from 'react'
import { fetchPosts } from '../data'

export default function Posts() {
  const [posts, setPosts] = useState(null)
  const [renderedAt] = useState(() => new Date().toLocaleTimeString())

  useEffect(() => {
    fetchPosts().then(setPosts)
  }, [])

  return (
    <>
      <header className="hero">
        <span className="badge">CSR · 글 목록</span>
        <h1>글 목록</h1>
        <p className="subtitle">이 컴포넌트가 브라우저에서 실행된 시각: {renderedAt}</p>
      </header>

      {posts === null ? (
        <div className="card">
          <h3>데이터 로딩 중...</h3>
          <p>view-source로 보면 지금 이 순간 HTML은 비어 있습니다. 브라우저가 API 응답을 기다리는 중입니다.</p>
        </div>
      ) : (
        <div className="grid">
          {posts.map((p) => (
            <div className="card" key={p.id}>
              <span className="num">{String(p.id).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
