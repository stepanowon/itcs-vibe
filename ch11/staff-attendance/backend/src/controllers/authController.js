const { toCamelCase } = require('../utils/caseMapper');
const { sanitizeUser } = require('../utils/sanitizeUser');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createAuthController({ signupUsecase, loginUsecase, refreshTokenUsecase, logoutUsecase }) {
  return {
    signup: asyncHandler(async (req, res) => {
      const user = await signupUsecase.execute(req.body);
      res.status(201).json(toCamelCase(sanitizeUser(user)));
    }),

    login: asyncHandler(async (req, res) => {
      const result = await loginUsecase.execute(req.body);
      res.status(200).json(result);
    }),

    refresh: asyncHandler(async (req, res) => {
      const result = await refreshTokenUsecase.execute(req.body);
      res.status(200).json(result);
    }),

    logout: asyncHandler(async (req, res) => {
      await logoutUsecase.execute();
      res.status(204).end();
    }),
  };
}

module.exports = { createAuthController };
