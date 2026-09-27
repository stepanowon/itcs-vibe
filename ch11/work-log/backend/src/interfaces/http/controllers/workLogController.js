const createWorkLog = require('../../../application/workLog/workLogCreateUseCase');
const listWorkLogs = require('../../../application/workLog/workLogListUseCase');
const getWorkLog = require('../../../application/workLog/workLogGetUseCase');
const updateWorkLog = require('../../../application/workLog/workLogUpdateUseCase');
const deleteWorkLog = require('../../../application/workLog/workLogDeleteUseCase');

async function create(req, res, next) {
  try {
    const result = await createWorkLog({ userId: req.user.sub, ...req.body });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const result = await listWorkLogs({ userId: req.user.sub, ...req.query });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const result = await getWorkLog({ userId: req.user.sub, id: req.params.id });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const result = await updateWorkLog({ userId: req.user.sub, id: req.params.id, ...req.body });
    res.json(result);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await deleteWorkLog({ userId: req.user.sub, id: req.params.id });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list, getById, update, remove };
