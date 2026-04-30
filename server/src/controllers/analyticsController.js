const Task = require("../models/Task");
const Project = require("../models/Project");
const ActivityLog = require("../models/ActivityLog");
const Sprint = require("../models/Sprint");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const { TASK_STATUS } = require("../constants/enums");
const { computeWorkload } = require("../services/taskIntelligenceService");

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { teamId, projectId } = req.query;

  const projectFilter = { "members.user": req.user._id };
  if (teamId) projectFilter.team = teamId;
  if (projectId) projectFilter._id = projectId;

  const projects = await Project.find(projectFilter).lean();
  if (!projects.length) throw new AppError("No projects found for user", 404);

  const projectIds = projects.map((p) => p._id);
  const tasks = await Task.find({ project: { $in: projectIds } })
    .populate("assignee", "name email")
    .lean();

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);

  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== TASK_STATUS.DONE);
  const upcomingDeadlines = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== TASK_STATUS.DONE)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10);
  const completedThisWeek = tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= weekAgo).length;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const projectProgress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const workloadMap = new Map();
  tasks.forEach((task) => {
    if (!task.assignee) return;
    const key = String(task.assignee._id);
    if (!workloadMap.has(key)) {
      workloadMap.set(key, {
        userId: key,
        name: task.assignee.name,
        tasks: [],
      });
    }
    if (task.status !== TASK_STATUS.DONE) {
      workloadMap.get(key).tasks.push(task);
    }
  });

  const workloadDistribution = Array.from(workloadMap.values()).map((entry) => {
    const workload = computeWorkload(entry.tasks);
    return {
      userId: entry.userId,
      name: entry.name,
      activeTasks: entry.tasks.length,
      score: workload.score,
      balanceState: workload.state,
    };
  });

  const completionTrends = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);

    const count = tasks.filter((t) => {
      if (!t.completedAt) return false;
      return new Date(t.completedAt).toISOString().slice(0, 10) === key;
    }).length;

    completionTrends.push({ date: key, completed: count });
  }

  const priorityDistribution = ["Low", "Medium", "High", "Critical"].map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length,
  }));

  const activeSprints = await Sprint.find({ project: { $in: projectIds }, status: "Active" }).lean();
  const sprintHealth = activeSprints.map((sprint) => {
    const sprintTasks = tasks.filter((task) => String(task.sprint) === String(sprint._id));
    const totalPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || task.estimatedEffort || 1), 0);
    const completedPoints = sprintTasks
      .filter((task) => task.status === TASK_STATUS.DONE)
      .reduce((sum, task) => sum + (task.storyPoints || task.estimatedEffort || 1), 0);
    const blockedTasks = sprintTasks.filter((task) => task.blockedByOpenDependencies).length;
    const today = new Date();
    const totalDuration = Math.max((new Date(sprint.endDate) - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24), 1);
    const elapsedDuration = Math.max((today - new Date(sprint.startDate)) / (1000 * 60 * 60 * 24), 0);
    const elapsedRatio = Math.min(elapsedDuration / totalDuration, 1);
    const completionRatio = totalPoints ? completedPoints / totalPoints : 0;
    const scopeCount = sprint.taskIds?.length || 0;

    return {
      sprintId: String(sprint._id),
      name: sprint.name,
      status: sprint.status,
      totalPoints,
      completedPoints,
      remainingPoints: Math.max(totalPoints - completedPoints, 0),
      blockedTasks,
      scopeCount,
      completionRatio: Math.round(completionRatio * 100),
      timeElapsedRatio: Math.round(elapsedRatio * 100),
      confidence:
        completionRatio + 0.1 >= elapsedRatio
          ? "On track"
          : completionRatio + 0.25 >= elapsedRatio
            ? "Watch"
            : "At risk",
    };
  });

  const todayKey = new Date().toISOString().slice(0, 10);
  const blockedTasks = tasks.filter(
    (task) => task.status !== TASK_STATUS.DONE && Array.isArray(task.dependencyTaskIds) && task.dependencyTaskIds.length > 0
  );
  const standup = {
    reviewQueue: tasks.filter((task) => task.status === TASK_STATUS.REVIEW).slice(0, 5),
    blockedTasks: blockedTasks.slice(0, 5),
    dueToday: tasks.filter((task) => task.dueDate && new Date(task.dueDate).toISOString().slice(0, 10) === todayKey && task.status !== TASK_STATUS.DONE).slice(0, 5),
    myFocus: tasks
      .filter((task) => task.assignee && String(task.assignee._id) === String(req.user._id) && task.status !== TASK_STATUS.DONE)
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .slice(0, 4),
    shippedRecently: tasks
      .filter((task) => task.completedAt && new Date(task.completedAt) >= weekAgo)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5),
  };

  const recentActivity = await ActivityLog.find({ project: { $in: projectIds } })
    .populate("actor", "name")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return sendSuccess(res, {
    upcomingDeadlines,
    overdueTasks,
    completedThisWeek,
    projectProgress,
    workloadDistribution,
    completionTrends,
    priorityDistribution,
    sprintHealth,
    standup,
    recentActivity,
  }, "Analytics fetched");
});

module.exports = {
  getDashboardAnalytics,
};
