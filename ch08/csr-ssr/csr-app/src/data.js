export const posts = [
  { id: 1, title: 'CSR란 무엇인가', body: '브라우저가 JS를 내려받아 실행한 뒤 화면을 그립니다.' },
  { id: 2, title: '초기 로딩과 빈 화면', body: '최초 HTML은 비어 있고, JS가 데이터를 가져온 뒤에야 내용이 나타납니다.' },
  { id: 3, title: 'SEO와 크롤러', body: 'JS를 실행하지 않는 크롤러는 빈 화면만 보게 될 수 있습니다.' },
];

// 실제 API 호출을 흉내내기 위한 인위적 지연 (CSR의 로딩 상태를 눈으로 확인하기 위함)
export function fetchPosts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(posts), 1200);
  });
}
