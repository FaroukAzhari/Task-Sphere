const Task = require("../models/Task");
const Subtask = require("../models/Subtask");
const { TASK_PRIORITY, TASK_STATUS } = require("../constants/enums");

const priorityWeight = {
  [TASK_PRIORITY.LOW]: 1,
  [TASK_PRIORITY.MEDIUM]: 2,
  [TASK_PRIORITY.HIGH]: 3,
  [TASK_PRIORITY.CRITICAL]: 4,
};

const computeWorkload = (tasks) => {
  const now = new Date();
  const score = tasks.reduce((acc, task) => {
    const base = priorityWeight[task.priority] || 1;
    const effort = task.estimatedEffort || 1;
    const overduePenalty = task.dueDate && new Date(task.dueDate) < now && task.status !== TASK_STATUS.DONE ? 2 : 0;
    return acc + base * effort + overduePenalty;
  }, 0);

  const state = score < 12 ? "underloaded" : score <= 24 ? "balanced" : "overloaded";
  return { score, state };
};

const computeDeadlineRisk = async (task) => {
  let riskPoints = 0;
  const now = new Date();

  if (task.dueDate) {
    const hoursLeft = (new Date(task.dueDate) - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) riskPoints += 5;
    else if (hoursLeft < 48) riskPoints += 3;
    else if (hoursLeft < 120) riskPoints += 2;
  }

  const subtasks = await Subtask.find({ task: task._id }).lean();
  if (subtasks.length > 0) {
    const completed = subtasks.filter((sub) => sub.isCompleted).length;
    const completionRatio = completed / subtasks.length;
    if (completionRatio < 0.3) riskPoints += 2;
    else if (completionRatio < 0.6) riskPoints += 1;
  }

  if ((task.dependencyTaskIds || []).length > 0) {
    const openDeps = await Task.countDocuments({
      _id: { $in: task.dependencyTaskIds },
      status: { $ne: TASK_STATUS.DONE },
    });

    if (openDeps > 0) riskPoints += 2;
  }

  if (task.status === TASK_STATUS.DONE) {
    return "Low";
  }

  if (riskPoints >= 6) return "High";
  if (riskPoints >= 3) return "Medium";
  return "Low";
};

const canMarkDone = async (taskId) => {
  const task = await Task.findById(taskId).lean();
  if (!task) return false;

  if (!task.dependencyTaskIds || task.dependencyTaskIds.length === 0) {
    return true;
  }

  const openDeps = await Task.countDocuments({
    _id: { $in: task.dependencyTaskIds },
    status: { $ne: TASK_STATUS.DONE },
  });

  return openDeps === 0;
};

module.exports = {
  computeWorkload,
  computeDeadlineRisk,
  canMarkDone,
};
