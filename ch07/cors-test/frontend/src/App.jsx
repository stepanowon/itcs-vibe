import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [result, setResult] = useState('결과가 여기에 표시됩니다.');

  async function callGet() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/data`);
      setResult(`[GET /api/data]\n${JSON.stringify(await res.json(), null, 2)}`);
    } catch (err) {
      setResult(`[GET /api/data] 요청 실패 (브라우저 콘솔/네트워크 탭에서 CORS 에러 메시지를 확인하세요)\n${err}`);
    }
  }

  async function callPost() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/echo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'hello',
        },
        body: JSON.stringify({ hello: 'world' }),
      });
      setResult(`[POST /api/echo]\n${JSON.stringify(await res.json(), null, 2)}`);
    } catch (err) {
      setResult(`[POST /api/echo] 요청 실패 (브라우저 콘솔/네트워크 탭에서 CORS 에러 메시지를 확인하세요)\n${err}`);
    }
  }

  return (
    <>
      <h1>CORS 테스트 프론트엔드</h1>
      <p>
        이 페이지는 {window.location.origin} 에서 실행 중이며, 백엔드({API_BASE_URL})로 요청을 보냅니다.
      </p>
      <button onClick={callGet}>GET /api/data 호출</button>
      <button onClick={callPost}>POST /api/echo 호출 (커스텀 헤더 포함, preflight 발생)</button>
      <pre>{result}</pre>
    </>
  );
}
