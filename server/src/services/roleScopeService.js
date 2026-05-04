const { USER_ROLES } = require("../constants/enums");

const PLATFORM_ADMIN_EMAIL = (process.env.PLATFORM_ADMIN_EMAIL || "admin@tasksphere.dev").trim().toLowerCase();

const TEAM_ASSIGNABLE_ROLES = [
  USER_ROLES.PROJECT_MANAGER,
  USER_ROLES.TEAM_LEAD,
  USER_ROLES.MEMBER,
  USER_ROLES.VIEWER,
];

const normalizeScopedRole = (role) =>
  role === USER_ROLES.ADMIN ? USER_ROLES.PROJECT_MANAGER : role;

const resolvePlatformRole = (email) =>
  String(email || "").trim().toLowerCase() === PLATFORM_ADMIN_EMAIL
    ? USER_ROLES.ADMIN
    : USER_ROLES.MEMBER;

const syncPlatformRole = async (user) => {
  if (!user) return user;
  const nextRole = resolvePlatformRole(user.email);
  if (user.globalRole !== nextRole) {
    user.globalRole = nextRole;
    await user.save();
  }
  return user;
};

module.exports = {
  PLATFORM_ADMIN_EMAIL,
  TEAM_ASSIGNABLE_ROLES,
  normalizeScopedRole,
  resolvePlatformRole,
  syncPlatformRole,
};
