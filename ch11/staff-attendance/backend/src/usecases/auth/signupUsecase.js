const { ConflictError } = require('../../errors/AppError');
const { validateSignupInput } = require('../../utils/validate');
const { hashPassword } = require('../../utils/password');
const { calcTotalDays } = require('../../utils/leaveAccrual');

async function assertNoDuplicateUser(userRepository, { email, employeeNo }) {
  if (await userRepository.findByEmail(email)) {
    throw new ConflictError('DUPLICATE_EMAIL', '이미 등록된 이메일입니다');
  }
  if (await userRepository.findByEmployeeNo(employeeNo)) {
    throw new ConflictError('DUPLICATE_EMPLOYEE_NO', '이미 등록된 사번입니다');
  }
}

// assertNoDuplicateUser의 사전 조회와 실제 INSERT 사이에는 경쟁 조건(TOCTOU)이 있어,
// 거의 동시에 들어온 요청은 사전 조회를 모두 통과한 뒤 DB UNIQUE 제약에서 걸릴 수 있다.
// 이 경우 처리되지 않은 500 대신 회원가입과 동일한 409 응답으로 매핑한다.
function rethrowAsDuplicateConflict(err) {
  if (err.code === '23505') {
    if (err.constraint === 'users_email_key') {
      throw new ConflictError('DUPLICATE_EMAIL', '이미 등록된 이메일입니다');
    }
    if (err.constraint === 'users_employee_no_key') {
      throw new ConflictError('DUPLICATE_EMPLOYEE_NO', '이미 등록된 사번입니다');
    }
  }
  throw err;
}

function createSignupUsecase({ userRepository, leavePolicyRepository }) {
  return {
    async execute({ email, name, employeeNo, hireDate, password }) {
      validateSignupInput({ email, name, employeeNo, hireDate, password });

      await assertNoDuplicateUser(userRepository, { email, employeeNo });

      const policy = await leavePolicyRepository.get();
      const initialTotalDays = calcTotalDays(policy.base_days, hireDate);

      const passwordHash = await hashPassword(password);
      let user;
      try {
        user = await userRepository.createWithInitialManagerCheck({
          email,
          name,
          employeeNo,
          hireDate,
          passwordHash,
          initialTotalDays,
        });
      } catch (err) {
        rethrowAsDuplicateConflict(err);
      }
      console.log(`[signup] 회원가입 성공: ${user.email} role=${user.role}`);
      return user;
    },
  };
}

module.exports = { createSignupUsecase, assertNoDuplicateUser, rethrowAsDuplicateConflict };
