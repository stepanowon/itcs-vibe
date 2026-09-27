const { toCamelCase } = require('../utils/caseMapper');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createLeavePolicyController({ getLeavePolicyUsecase, updateLeavePolicyUsecase }) {
  return {
    get: asyncHandler(async (req, res) => {
      const policy = await getLeavePolicyUsecase.execute();
      res.status(200).json(toCamelCase(policy));
    }),

    update: asyncHandler(async (req, res) => {
      const policy = await updateLeavePolicyUsecase.execute({ baseDays: req.body.baseDays });
      res.status(200).json(toCamelCase(policy));
    }),
  };
}

module.exports = { createLeavePolicyController };
