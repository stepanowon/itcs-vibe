// axios 에러 응답에서 서버가 내려준 메시지를 꺼내고, 없으면 기본 메시지를 사용한다.
export function getErrorMessage(err, fallback) {
  return err.response?.data?.message ?? fallback
}

// 사번 중복(409 DUPLICATE_EMPLOYEE_NO) 에러인지 확인한다(회원가입/관리자 계정 생성 공통).
export function isDuplicateEmployeeNoError(err) {
  return err.response?.data?.code === 'DUPLICATE_EMPLOYEE_NO'
}
