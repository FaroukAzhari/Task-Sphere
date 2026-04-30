const ActivityLog = require("../models/ActivityLog");

const logActivity = async ({ actor, action, team = null, project = null, task = null, details = {} }) => {
  return ActivityLog.create({
    actor,
    action,
    team,
    project,
    task,
    details,
  });
};

module.exports = {
  logActivity,
};
