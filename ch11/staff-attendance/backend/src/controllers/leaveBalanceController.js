const { toCamelCase, toCamelCaseList } = require('../utils/caseMapper');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createLeaveBalanceController({ getMyLeaveBalanceUsecase, listLeaveBalancesUsecase }) {
  return {
    getMine: asyncHandler(async (req, res) => {
      const balance = await getMyLeaveBalanceUsecase.execute({ userId: req.user.id });
      res.status(200).json(toCamelCase(balance));
    }),

    listAll: asyncHandler(async (req, res) => {
      const balances = await listLeaveBalancesUsecase.execute();
      res.status(200).json(toCamelCaseList(balances));
    }),
  };
}

module.exports = { createLeaveBalanceController };
