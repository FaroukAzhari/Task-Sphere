const Team = require("../models/Team");
const Project = require("../models/Project");
const { USER_ROLES } = require("../constants/enums");

const roleRank = {
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.PROJECT_MANAGER]: 3,
  [USER_ROLES.TEAM_LEAD]: 2.5,
  [USER_ROLES.MEMBER]: 2,
  [USER_ROLES.VIEWER]: 1,
};

const canManageTeam = (role) => roleRank[role] >= roleRank[USER_ROLES.PROJECT_MANAGER];
const canWriteProject = (role) => roleRank[role] >= roleRank[USER_ROLES.MEMBER];
const canManageTaskEditing = (role) => roleRank[role] >= roleRank[USER_ROLES.TEAM_LEAD];
const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value);
};
const canEditTask = ({ role, userId, task }) =>
  canManageTaskEditing(role) ||
  getEntityId(task.assignee) === String(userId) ||
  getEntityId(task.creator) === String(userId);

const getTeamMembership = async (teamId, userId) => {
  const team = await Team.findById(teamId).lean();
  if (!team) return null;
  const member = team.members.find((m) => String(m.user) === String(userId));
  return member ? { team, member } : null;
};

const getProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId).lean();
  if (!project) return null;
  const member = project.members.find((m) => String(m.user) === String(userId));
  return member ? { project, member } : null;
};

module.exports = {
  canManageTeam,
  canWriteProject,
  canManageTaskEditing,
  canEditTask,
  getTeamMembership,
  getProjectMembership,
  roleRank,
};
