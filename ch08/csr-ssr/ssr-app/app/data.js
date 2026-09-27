export const posts = [
  { id: 1, title: 'SSR란 무엇인가', body: '서버가 데이터를 가져와 완성된 HTML을 만들어 브라우저로 보냅니다.' },
  { id: 2, title: '초기 로딩과 완성된 화면', body: '브라우저가 받는 최초 HTML에 이미 내용이 채워져 있습니다.' },
  { id: 3, title: 'SEO와 크롤러', body: 'JS를 실행하지 않는 크롤러도 완성된 내용을 그대로 볼 수 있습니다.' },
];

// 실제 API/DB 호출을 흉내내기 위한 인위적 지연 (SSR이 응답을 지연시켜서라도 완성된 HTML을 보내는 과정을 눈으로 확인하기 위함)
export function fetchPosts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(posts), 1200);
  });
}
