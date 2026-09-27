const { toCamelCase, toCamelCaseList } = require('../utils/caseMapper');
const { sanitizeUser, sanitizeUsers } = require('../utils/sanitizeUser');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createUserController({ getMeUsecase, changePasswordUsecase, createManagerUsecase, listUsersUsecase }) {
  return {
    getMe: asyncHandler(async (req, res) => {
      const user = await getMeUsecase.execute({ userId: req.user.id });
      res.status(200).json(toCamelCase(sanitizeUser(user)));
    }),

    changePassword: asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      const result = await changePasswordUsecase.execute({
        userId: req.user.id,
        currentPassword,
        newPassword,
      });
      res.status(200).json(result);
    }),

    createManager: asyncHandler(async (req, res) => {
      const user = await createManagerUsecase.execute(req.body);
      res.status(201).json(toCamelCase(sanitizeUser(user)));
    }),

    listUsers: asyncHandler(async (req, res) => {
      const users = await listUsersUsecase.execute();
      res.status(200).json(toCamelCaseList(sanitizeUsers(users)));
    }),
  };
}

module.exports = { createUserController };
