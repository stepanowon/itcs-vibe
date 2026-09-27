const getMyProfile = require('../../../application/users/getMyProfileUseCase');
const changePassword = require('../../../application/users/changePasswordUseCase');

async function getMe(req, res, next) {
  try {
    res.json(await getMyProfile({ userId: req.user.sub }));
  } catch (e) {
    next(e);
  }
}

async function changePasswordHandler(req, res, next) {
  try {
    await changePassword({ userId: req.user.sub, ...req.body });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports = { getMe, changePassword: changePasswordHandler };
