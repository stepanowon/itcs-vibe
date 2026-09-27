const userRepository = require('../../infrastructure/repositories/UserRepository');
const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');

async function getMyProfile({ userId }) {
  const user = await userRepository.findById(userId);
  const workLogCount = await workLogRepository.countByUserId(userId);
  return {
    id: user.id,
    userCode: user.userCode,
    email: user.email,
    name: user.name,
    department: user.department,
    workLogCount,
    createdAt: user.createdAt,
  };
}

module.exports = getMyProfile;
