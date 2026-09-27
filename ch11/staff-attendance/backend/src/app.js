const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const { CORS_ORIGIN, NODE_ENV } = require('./config/env');

const healthRepository = require('./infrastructure/db/healthRepository');
const userRepository = require('./infrastructure/db/userRepository');
const attendanceRepository = require('./infrastructure/db/attendanceRepository');
const leaveRequestRepository = require('./infrastructure/db/leaveRequestRepository');
const leaveBalanceRepository = require('./infrastructure/db/leaveBalanceRepository');
const leavePolicyRepository = require('./infrastructure/db/leavePolicyRepository');

const { createCheckHealthUsecase } = require('./usecases/checkHealthUsecase');
const { createSignupUsecase } = require('./usecases/auth/signupUsecase');
const { createLoginUsecase } = require('./usecases/auth/loginUsecase');
const { createRefreshTokenUsecase } = require('./usecases/auth/refreshTokenUsecase');
const { createLogoutUsecase } = require('./usecases/auth/logoutUsecase');
const { createGetMeUsecase } = require('./usecases/users/getMeUsecase');
const { createChangePasswordUsecase } = require('./usecases/users/changePasswordUsecase');
const { createCreateManagerUsecase } = require('./usecases/users/createManagerUsecase');
const { createListUsersUsecase } = require('./usecases/users/listUsersUsecase');
const { createCheckInUsecase } = require('./usecases/attendances/checkInUsecase');
const { createCheckOutUsecase } = require('./usecases/attendances/checkOutUsecase');
const { createListMyAttendancesUsecase } = require('./usecases/attendances/listMyAttendancesUsecase');
const { createListAllAttendancesUsecase } = require('./usecases/attendances/listAllAttendancesUsecase');
const { createCreateLeaveRequestUsecase } = require('./usecases/leaveRequests/createLeaveRequestUsecase');
const { createListLeaveRequestsUsecase } = require('./usecases/leaveRequests/listLeaveRequestsUsecase');
const { createListMyLeaveRequestsUsecase } = require('./usecases/leaveRequests/listMyLeaveRequestsUsecase');
const { createApproveLeaveRequestUsecase } = require('./usecases/leaveRequests/approveLeaveRequestUsecase');
const { createRejectLeaveRequestUsecase } = require('./usecases/leaveRequests/rejectLeaveRequestUsecase');
const { createGetMyLeaveBalanceUsecase } = require('./usecases/leaveBalances/getMyLeaveBalanceUsecase');
const { createListLeaveBalancesUsecase } = require('./usecases/leaveBalances/listLeaveBalancesUsecase');
const { createGetLeavePolicyUsecase } = require('./usecases/leaveBalances/getLeavePolicyUsecase');
const { createUpdateLeavePolicyUsecase } = require('./usecases/leaveBalances/updateLeavePolicyUsecase');

const { createHealthController } = require('./controllers/healthController');
const { createAuthController } = require('./controllers/authController');
const { createUserController } = require('./controllers/userController');
const { createAttendanceController } = require('./controllers/attendanceController');
const { createLeaveRequestController } = require('./controllers/leaveRequestController');
const { createLeaveBalanceController } = require('./controllers/leaveBalanceController');
const { createLeavePolicyController } = require('./controllers/leavePolicyController');

const { createApiRouter } = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { notFoundHandler } = require('./middlewares/notFoundHandler');

// composition root: 의존성 조립
const checkHealthUsecase = createCheckHealthUsecase({
  checkDbConnection: healthRepository.checkDbConnection,
});
const signupUsecase = createSignupUsecase({ userRepository, leavePolicyRepository });
const loginUsecase = createLoginUsecase({ userRepository });
const refreshTokenUsecase = createRefreshTokenUsecase({ userRepository });
const logoutUsecase = createLogoutUsecase();
const getMeUsecase = createGetMeUsecase({ userRepository });
const changePasswordUsecase = createChangePasswordUsecase({ userRepository });
const createManagerUsecase = createCreateManagerUsecase({ userRepository, leaveBalanceRepository, leavePolicyRepository });
const listUsersUsecase = createListUsersUsecase({ userRepository });
const checkInUsecase = createCheckInUsecase({ attendanceRepository });
const checkOutUsecase = createCheckOutUsecase({ attendanceRepository });
const listMyAttendancesUsecase = createListMyAttendancesUsecase({ attendanceRepository });
const listAllAttendancesUsecase = createListAllAttendancesUsecase({ attendanceRepository });
const createLeaveRequestUsecase = createCreateLeaveRequestUsecase({ leaveRequestRepository, leaveBalanceRepository });
const listLeaveRequestsUsecase = createListLeaveRequestsUsecase({ leaveRequestRepository });
const listMyLeaveRequestsUsecase = createListMyLeaveRequestsUsecase({ leaveRequestRepository });
const approveLeaveRequestUsecase = createApproveLeaveRequestUsecase({ leaveRequestRepository, leaveBalanceRepository });
const rejectLeaveRequestUsecase = createRejectLeaveRequestUsecase({ leaveRequestRepository });
const getMyLeaveBalanceUsecase = createGetMyLeaveBalanceUsecase({ leaveBalanceRepository });
const listLeaveBalancesUsecase = createListLeaveBalancesUsecase({ leaveBalanceRepository });
const getLeavePolicyUsecase = createGetLeavePolicyUsecase({ leavePolicyRepository });
const updateLeavePolicyUsecase = createUpdateLeavePolicyUsecase({ leavePolicyRepository, leaveBalanceRepository });

const healthController = createHealthController(checkHealthUsecase);
const authController = createAuthController({ signupUsecase, loginUsecase, refreshTokenUsecase, logoutUsecase });
const userController = createUserController({ getMeUsecase, changePasswordUsecase, createManagerUsecase, listUsersUsecase });
const attendanceController = createAttendanceController({
  checkInUsecase,
  checkOutUsecase,
  listMyAttendancesUsecase,
  listAllAttendancesUsecase,
});
const leaveRequestController = createLeaveRequestController({
  createLeaveRequestUsecase,
  listLeaveRequestsUsecase,
  listMyLeaveRequestsUsecase,
  approveLeaveRequestUsecase,
  rejectLeaveRequestUsecase,
});
const leaveBalanceController = createLeaveBalanceController({
  getMyLeaveBalanceUsecase,
  listLeaveBalancesUsecase,
});
const leavePolicyController = createLeavePolicyController({ getLeavePolicyUsecase, updateLeavePolicyUsecase });

const app = express();
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(
  '/api/v1',
  createApiRouter({
    healthController,
    authController,
    userController,
    attendanceController,
    leaveRequestController,
    leaveBalanceController,
    leavePolicyController,
  })
);

// 개발 환경에서만 Swagger UI 노출 (운영 환경엔 API 명세 미노출)
if (NODE_ENV !== 'production') {
  const swaggerDocument = YAML.parse(fs.readFileSync(path.join(__dirname, '../swagger.yaml'), 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[swagger] 개발 환경 - /api-docs 에서 Swagger UI 제공');
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
