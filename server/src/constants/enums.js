const USER_ROLES = {
  ADMIN: "Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEAD: "Team Lead",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const TASK_STATUS = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const TASK_TYPE = {
  TASK: "Task",
  BUG: "Bug",
  STORY: "Story",
};

module.exports = {
  USER_ROLES,
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_TYPE,
};
