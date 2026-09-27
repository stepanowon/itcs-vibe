const { toCamelCase, toCamelCaseList } = require('../utils/caseMapper');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createLeaveRequestController({
  createLeaveRequestUsecase,
  listLeaveRequestsUsecase,
  listMyLeaveRequestsUsecase,
  approveLeaveRequestUsecase,
  rejectLeaveRequestUsecase,
}) {
  return {
    create: asyncHandler(async (req, res) => {
      const { startDate, endDate, reason, halfDay } = req.body;
      const record = await createLeaveRequestUsecase.execute({
        requesterId: req.user.id,
        startDate,
        endDate,
        reason,
        halfDay,
      });
      res.status(201).json(toCamelCase(record));
    }),

    listAll: asyncHandler(async (req, res) => {
      const records = await listLeaveRequestsUsecase.execute({
        status: req.query.status,
        month: req.query.month,
        userId: req.query.userId,
      });
      res.status(200).json(toCamelCaseList(records));
    }),

    listMine: asyncHandler(async (req, res) => {
      const records = await listMyLeaveRequestsUsecase.execute({
        requesterId: req.user.id,
        month: req.query.month,
      });
      res.status(200).json(toCamelCaseList(records));
    }),

    approve: asyncHandler(async (req, res) => {
      const record = await approveLeaveRequestUsecase.execute({
        id: req.params.id,
        processorId: req.user.id,
      });
      res.status(200).json(toCamelCase(record));
    }),

    reject: asyncHandler(async (req, res) => {
      const record = await rejectLeaveRequestUsecase.execute({
        id: req.params.id,
        processorId: req.user.id,
      });
      res.status(200).json(toCamelCase(record));
    }),
  };
}

module.exports = { createLeaveRequestController };
