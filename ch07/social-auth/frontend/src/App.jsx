import { useEffect, useState } from 'react';
import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(new URLSearchParams(window.location.search).get('error'));
  const [profileResult, setProfileResult] = useState('');

  useEffect(() => {
    api
      .get('/api/me')
      .then((res) => setUser(res.data.user))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await api.post('/api/logout');
    setUser(null);
  }

  // requireAuth로 보호된 API 호출: 로그인 상태에 따라 200 또는 401이 그대로 표시됨
  async function callProtectedApi() {
    try {
      const res = await api.get('/api/profile');
      setProfileResult(`[GET /api/profile] status: ${res.status}\n${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      // axios는 2xx가 아닌 응답을 예외로 던지므로 err.response에서 상태/본문을 꺼냄
      const res = err.response;
      setProfileResult(`[GET /api/profile] status: ${res?.status}\n${JSON.stringify(res?.data, null, 2)}`);
    }
  }

  if (loading) return <p>로딩 중...</p>;

  return (
    <>
      <h1>네이버 소셜 로그인 예제</h1>
      {error && <p style={{ color: 'red' }}>로그인 실패: {error}</p>}
      {user ? (
        <>
          <p>{user.nickname || user.name}님, 환영합니다!</p>
          <p style={{ color: 'crimson' }}>
            ⚠️ accessToken/refreshToken은 교육용으로만 화면에 노출합니다. 실제 서비스에서는 노출하면 안 됩니다.
          </p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <button onClick={logout}>로그아웃</button>
        </>
      ) : (
        <button onClick={() => (window.location.href = `${API_BASE_URL}/auth/naver`)}>
          네이버로 로그인
        </button>
      )}
      <hr />
      <p>인증 가드(requireAuth)로 보호된 API 호출 테스트 (로그아웃 상태면 401 응답)</p>
      <button onClick={callProtectedApi}>GET /api/profile 호출</button>
      {profileResult && <pre>{profileResult}</pre>}
    </>
  );
}
