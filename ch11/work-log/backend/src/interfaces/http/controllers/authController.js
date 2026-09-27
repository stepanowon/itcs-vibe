const signupUseCase = require('../../../application/auth/signupUseCase');
const loginUseCase = require('../../../application/auth/loginUseCase');
const refreshUseCase = require('../../../application/auth/refreshUseCase');
const logoutUseCase = require('../../../application/auth/logoutUseCase');

async function signup(req, res, next) {
  try {
    const result = await signupUseCase(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginUseCase(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await refreshUseCase(req.body);
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
}

async function logout(req, res, next) {
  try {
    await logoutUseCase(req.body);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports = { signup, login, refresh, logout };
