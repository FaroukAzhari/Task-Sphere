const Project = require("../models/Project");
const Sprint = require("../models/Sprint");
const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { TASK_STATUS, USER_ROLES } = require("../constants/enums");
const { createNotification } = require("../services/notificationService");

const canRunSprintByRole = (role) => [USER_ROLES.PROJECT_MANAGER, USER_ROLES.TEAM_LEAD].includes(role);

const assertSprintPermission = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((m) => String(m.user) === String(userId));
  if (!member) throw new AppError("Forbidden", 403);
  if (!canRunSprintByRole(member.role)) {
    throw new AppError("Only project manager or team lead can run sprints", 403);
  }

  return { project, member };
};

const assertSprintReadAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((m) => String(m.user) === String(userId));
  if (!member) throw new AppError("Forbidden", 403);

  return { project, member };
};

const calculateSprintPoints = async (taskIds) => {
  const tasks = await Task.find({ _id: { $in: taskIds } }).lean();
  const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || task.estimatedEffort || 1), 0);
  const completedPoints = tasks
    .filter((task) => task.status === TASK_STATUS.DONE)
    .reduce((sum, task) => sum + (task.storyPoints || task.estimatedEffort || 1), 0);

  return {
    totalPoints,
    completedPoints,
    remainingPoints: Math.max(totalPoints - completedPoints, 0),
  };
};

const createSnapshot = async (sprint) => {
  const points = await calculateSprintPoints(sprint.taskIds || []);
  sprint.burndownSnapshots.push({ date: new Date(), ...points });
};

const notifyProjectSprintUpdate = async ({ project, actorId, io, title, message, sprintId }) => {
  await Promise.all(
    (project.members || [])
      .filter((member) => String(member.user) !== String(actorId))
      .map((member) =>
        createNotification({
          userId: member.user,
          type: "sprint_update",
          title,
          message,
          metadata: { projectId: project._id, sprintId },
          io,
          email: {
            preferenceKey: "sprintUpdates",
            subject: `Task Sphere: ${title}`,
            text: message,
          },
        })
      )
  );
};

const listProjectSprints = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await assertSprintReadAccess(projectId, req.user._id);

  const sprints = await Sprint.find({ project: projectId })
    .populate("createdBy", "name")
    .populate("startedBy", "name")
    .populate("closedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, sprints, "Sprints fetched");
});

const createSprint = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, goal, startDate, endDate, capacity, taskIds = [] } = req.body;

  const { project } = await assertSprintPermission(projectId, req.user._id);

  const tasks = await Task.find({ _id: { $in: taskIds }, project: project._id }).select("_id").lean();
  if (taskIds.length > 0 && tasks.length !== taskIds.length) {
    throw new AppError("All sprint tasks must belong to the project", 400);
  }

  const sprint = await Sprint.create({
    team: project.team,
    project: project._id,
    name,
    goal,
    startDate,
    endDate,
    capacity,
    taskIds,
    createdBy: req.user._id,
  });

  await Task.updateMany({ _id: { $in: taskIds } }, { $set: { sprint: sprint._id } });

  await createSnapshot(sprint);
  await sprint.save();
  await notifyProjectSprintUpdate({
    project,
    actorId: req.user._id,
    io: req.app.get("io"),
    title: "Sprint created",
    message: `${req.user.name} created sprint "${name}".`,
    sprintId: sprint._id,
  });

  return sendSuccess(res, sprint, "Sprint created", 201);
});

const startSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params;
  await assertSprintPermission(projectId, req.user._id);

  const sprint = await Sprint.findOne({ _id: sprintId, project: projectId });
  if (!sprint) throw new AppError("Sprint not found", 404);

  if (sprint.status !== "Planned") throw new AppError("Only planned sprints can be started", 400);

  sprint.status = "Active";
  sprint.startedBy = req.user._id;
  await createSnapshot(sprint);
  await sprint.save();
  await notifyProjectSprintUpdate({
    project: await Project.findById(projectId).lean(),
    actorId: req.user._id,
    io: req.app.get("io"),
    title: "Sprint started",
    message: `${req.user.name} started sprint "${sprint.name}".`,
    sprintId: sprint._id,
  });

  return sendSuccess(res, sprint, "Sprint started");
});

const closeSprint = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params;
  await assertSprintPermission(projectId, req.user._id);

  const sprint = await Sprint.findOne({ _id: sprintId, project: projectId });
  if (!sprint) throw new AppError("Sprint not found", 404);

  if (!["Planned", "Active"].includes(sprint.status)) {
    throw new AppError("Sprint cannot be closed", 400);
  }

  sprint.status = "Completed";
  sprint.closedBy = req.user._id;
  sprint.completedAt = new Date();
  await createSnapshot(sprint);
  await sprint.save();
  await notifyProjectSprintUpdate({
    project: await Project.findById(projectId).lean(),
    actorId: req.user._id,
    io: req.app.get("io"),
    title: "Sprint closed",
    message: `${req.user.name} closed sprint "${sprint.name}".`,
    sprintId: sprint._id,
  });

  return sendSuccess(res, sprint, "Sprint closed");
});

const getSprintBurndown = asyncHandler(async (req, res) => {
  const { projectId, sprintId } = req.params;
  await assertSprintReadAccess(projectId, req.user._id);

  const sprint = await Sprint.findOne({ _id: sprintId, project: projectId }).lean();
  if (!sprint) throw new AppError("Sprint not found", 404);

  return sendSuccess(res, sprint.burndownSnapshots || [], "Sprint burndown fetched");
});

module.exports = {
  listProjectSprints,
  createSprint,
  startSprint,
  closeSprint,
  getSprintBurndown,
};
