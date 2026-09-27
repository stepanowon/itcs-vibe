import { fetchPosts } from '../data';

export const dynamic = 'force-dynamic'; // 매 요청마다 새로 렌더링 (캐시로 인해 지연이 숨겨지는 것을 방지)

export default async function Posts() {
  const renderedAt = new Date().toLocaleTimeString();
  const posts = await fetchPosts();

  return (
    <>
      <header className="hero">
        <span className="badge">SSR · 글 목록</span>
        <h1>글 목록</h1>
        <p className="subtitle">이 페이지가 서버에서 렌더된 시각: {renderedAt}</p>
      </header>

      <div className="grid">
        {posts.map((p) => (
          <div className="card" key={p.id}>
            <span className="num">{String(p.id).padStart(2, '0')}</span>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
