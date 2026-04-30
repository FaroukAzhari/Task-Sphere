const TaskHistory = require("../models/TaskHistory");

const trackTaskChange = async ({ task, changedBy, field, oldValue, newValue, note = "" }) => {
  if (String(oldValue) === String(newValue)) return null;

  return TaskHistory.create({
    task,
    changedBy,
    field,
    oldValue,
    newValue,
    note,
  });
};

module.exports = {
  trackTaskChange,
};
