// ponytail: 서버 측 Refresh Token 블랙리스트는 1차 버전 범위 밖(backend/CLAUDE.md 참고). 상태 없이 로그를 남기고 종료한다.
function createLogoutUsecase() {
  return {
    async execute() {
      console.log('[logout] 로그아웃 처리');
      return undefined;
    },
  };
}

module.exports = { createLogoutUsecase };
