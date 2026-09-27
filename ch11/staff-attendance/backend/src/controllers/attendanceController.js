const { toCamelCase, toCamelCaseList } = require('../utils/caseMapper');
const { asyncHandler } = require('../middlewares/asyncHandler');

function createAttendanceController({
  checkInUsecase,
  checkOutUsecase,
  listMyAttendancesUsecase,
  listAllAttendancesUsecase,
}) {
  return {
    checkIn: asyncHandler(async (req, res) => {
      const record = await checkInUsecase.execute({ userId: req.user.id });
      res.status(201).json(toCamelCase(record));
    }),

    checkOut: asyncHandler(async (req, res) => {
      const record = await checkOutUsecase.execute({ userId: req.user.id });
      res.status(200).json(toCamelCase(record));
    }),

    listMine: asyncHandler(async (req, res) => {
      const records = await listMyAttendancesUsecase.execute({
        userId: req.user.id,
        month: req.query.month,
      });
      res.status(200).json(toCamelCaseList(records));
    }),

    listAll: asyncHandler(async (req, res) => {
      const records = await listAllAttendancesUsecase.execute({
        month: req.query.month,
        userId: req.query.userId,
      });
      res.status(200).json(toCamelCaseList(records));
    }),
  };
}

module.exports = { createAttendanceController };
