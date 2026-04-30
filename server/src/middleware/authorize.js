const { USER_ROLES } = require("../constants/enums");
const AppError = require("../utils/AppError");

const roleWeight = {
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.PROJECT_MANAGER]: 3,
  [USER_ROLES.MEMBER]: 2,
  [USER_ROLES.VIEWER]: 1,
};

const authorize = (...allowedRoles) => (req, _res, next) => {
  const currentRole = req.user?.globalRole || USER_ROLES.MEMBER;

  if (!allowedRoles.includes(currentRole)) {
    return next(new AppError("Forbidden", 403));
  }

  return next();
};

const hasAtLeastRole = (currentRole, minRole) => {
  return (roleWeight[currentRole] || 0) >= (roleWeight[minRole] || 0);
};

module.exports = {
  authorize,
  hasAtLeastRole,
};
