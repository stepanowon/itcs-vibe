// 방명록 메시지를 담아두는 인메모리 저장소 (서버 재시작 시 초기화).
// Stored XSS 실습에 집중하기 위한 의도적인 단순화입니다.
let nextId = 1;
const messages = [
  { id: nextId++, name: '운영자', text: '방명록에 오신 것을 환영합니다!' },
];

function addMessage(name, text) {
  const message = { id: nextId++, name, text };
  messages.push(message);
  return message;
}

module.exports = { messages, addMessage };
