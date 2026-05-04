const Task = require("../models/Task");
const Project = require("../models/Project");
require("../models/Label");
const Subtask = require("../models/Subtask");
const TaskComment = require("../models/TaskComment");
const TaskHistory = require("../models/TaskHistory");
const Sprint = require("../models/Sprint");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { getPagination } = require("../utils/pagination");
const { TASK_STATUS, TASK_TYPE } = require("../constants/enums");
const { canWriteProject, canEditTask, canManageTaskEditing } = require("../services/accessService");
const { canMarkDone, computeDeadlineRisk } = require("../services/taskIntelligenceService");
const { trackTaskChange } = require("../services/taskHistoryService");
const { logActivity } = require("../services/activityService");
const { createNotification } = require("../services/notificationService");

const assertProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((m) => String(m.user) === String(userId));
  if (!member) throw new AppError("Forbidden", 403);

  return { project, member };
};

const decorateTaskListItem = (task, { labelByUserId, subtaskStatsByTaskId, openDependencyIdSet, now }) => {
  let riskPoints = 0;

  if (task.dueDate) {
    const hoursLeft = (new Date(task.dueDate) - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) riskPoints += 5;
    else if (hoursLeft < 48) riskPoints += 3;
    else if (hoursLeft < 120) riskPoints += 2;
  }

  const subtaskStats = subtaskStatsByTaskId.get(String(task._id));
  if (subtaskStats?.total) {
    const completionRatio = subtaskStats.completed / subtaskStats.total;
    if (completionRatio < 0.3) riskPoints += 2;
    else if (completionRatio < 0.6) riskPoints += 1;
  }

  const hasOpenDependency = (task.dependencyTaskIds || []).some((dependencyId) =>
    openDependencyIdSet.has(String(dependencyId))
  );
  if (hasOpenDependency) riskPoints += 2;

  const deadlineRisk =
    task.status === TASK_STATUS.DONE
      ? "Low"
      : riskPoints >= 6
        ? "High"
        : riskPoints >= 3
          ? "Medium"
          : "Low";

  return {
    ...task.toObject(),
    assigneeProjectLabel: task.assignee ? labelByUserId.get(String(task.assignee._id)) || "" : "",
    deadlineRisk,
  };
};

const createTask = asyncHandler(async (req, res) => {
  const {
    projectId,
    title,
    description,
    assignee,
    dueDate,
    priority,
    taskType,
    storyPoints,
    sprint,
    status,
    labels = [],
    estimatedEffort,
    dependencyTaskIds = [],
    subtasks = [],
  } = req.body;

  const { project, member } = await assertProjectAccess(projectId, req.user._id);
  if (!canWriteProject(member.role)) throw new AppError("Forbidden", 403);
  if (assignee) {
    const isProjectMember = project.members.some((m) => String(m.user) === String(assignee));
    if (!isProjectMember) throw new AppError("Assignee must be a project member", 400);
  }
  if (taskType === TASK_TYPE.STORY && (!storyPoints || !Number.isInteger(Number(storyPoints)) || Number(storyPoints) < 1)) {
    throw new AppError("Story tasks require storyPoints as a positive integer", 400);
  }
  if (sprint) {
    const sprintDoc = await Sprint.findOne({ _id: sprint, project: project._id }).lean();
    if (!sprintDoc) throw new AppError("Sprint does not belong to this project", 400);
  }

  const task = await Task.create({
    project: project._id,
    team: project.team,
    title,
    description,
    assignee,
    creator: req.user._id,
    dueDate,
    priority,
    taskType,
    storyPoints: taskType === TASK_TYPE.STORY ? Number(storyPoints) : undefined,
    sprint: sprint || undefined,
    status,
    labels,
    estimatedEffort,
    dependencyTaskIds,
  });

  if (subtasks.length > 0) {
    const created = await Subtask.insertMany(
      subtasks.map((sub) => ({
        task: task._id,
        title: sub.title,
      }))
    );

    task.subtaskIds = created.map((sub) => sub._id);
    await task.save();
  }

  await logActivity({
    actor: req.user._id,
    action: "task.created",
    team: project.team,
    project: project._id,
    task: task._id,
    details: { title: task.title },
  });

  if (assignee && String(assignee) !== String(req.user._id)) {
    await createNotification({
      userId: assignee,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `You were assigned task: ${title}`,
      metadata: { taskId: task._id, projectId: project._id },
      io: req.app.get("io"),
      email: {
        preferenceKey: "taskAssigned",
        subject: `Task Sphere: ${title} assigned to you`,
        text: `You were assigned "${title}" in Task Sphere.`,
      },
    });
  }

  req.app.get("io")?.to(`project:${project._id}`).emit("task:created", task);
  const createdTask = await Task.findById(task._id)
    .populate("assignee", "name email avatarUrl")
    .populate("creator", "name email")
    .populate("labels", "name color")
    .populate("sprint", "name status");

  const labelByUserId = new Map(
    (project?.members || []).map((memberItem) => [String(memberItem.user), memberItem.memberLabel || ""])
  );

  return sendSuccess(
    res,
    decorateTaskListItem(createdTask, {
      labelByUserId,
      subtaskStatsByTaskId: new Map(),
      openDependencyIdSet: new Set(),
      now: new Date(),
    }),
    "Task created",
    201
  );
});

const listTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { projectId, status, priority, assignee, label, search, taskType, sprintId } = req.query;

  if (!projectId) throw new AppError("projectId query param is required", 400);
  await assertProjectAccess(projectId, req.user._id);

  const filter = { project: projectId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (taskType) filter.taskType = taskType;
  if (sprintId) filter.sprint = sprintId;
  if (assignee) filter.assignee = assignee;
  if (label) filter.labels = label;
  if (search) filter.$text = { $search: search };

  const [tasks, total, project] = await Promise.all([
    Task.find(filter)
      .populate("assignee", "name email avatarUrl")
      .populate("creator", "name email")
      .populate("labels", "name color")
      .populate("sprint", "name status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
    Project.findById(projectId).lean(),
  ]);

  const labelByUserId = new Map(
    (project?.members || []).map((member) => [String(member.user), member.memberLabel || ""])
  );
  const taskIds = tasks.map((task) => task._id);
  const dependencyIds = Array.from(
    new Set(tasks.flatMap((task) => (task.dependencyTaskIds || []).map((dependencyId) => String(dependencyId))))
  );
  const [subtasks, openDependencyTasks] = await Promise.all([
    Subtask.find({ task: { $in: taskIds } }).select("task isCompleted").lean(),
    dependencyIds.length > 0
      ? Task.find({
        _id: { $in: dependencyIds },
        status: { $ne: TASK_STATUS.DONE },
      }).select("_id").lean()
      : [],
  ]);

  const subtaskStatsByTaskId = new Map();
  subtasks.forEach((subtask) => {
    const key = String(subtask.task);
    const current = subtaskStatsByTaskId.get(key) || { total: 0, completed: 0 };
    current.total += 1;
    if (subtask.isCompleted) current.completed += 1;
    subtaskStatsByTaskId.set(key, current);
  });

  const openDependencyIdSet = new Set(openDependencyTasks.map((task) => String(task._id)));
  const now = new Date();
  const withRisk = tasks.map((task) =>
    decorateTaskListItem(task, {
      labelByUserId,
      subtaskStatsByTaskId,
      openDependencyIdSet,
      now,
    })
  );

  return sendSuccess(res, withRisk, "Tasks fetched", 200, {
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId)
    .populate("assignee", "name email avatarUrl")
    .populate("creator", "name email")
    .populate("labels", "name color")
    .populate("dependencyTaskIds", "title status")
    .populate("sprint", "name status capacity startDate endDate")
    .lean();

  if (!task) throw new AppError("Task not found", 404);
  await assertProjectAccess(task.project, req.user._id);

  const [subtasks, comments, history, risk] = await Promise.all([
    Subtask.find({ task: task._id }).lean(),
    TaskComment.find({ task: task._id }).populate("author", "name avatarUrl").sort({ createdAt: -1 }).lean(),
    TaskHistory.find({ task: task._id }).populate("changedBy", "name").sort({ createdAt: -1 }).lean(),
    computeDeadlineRisk(task),
  ]);

  const project = await Project.findById(task.project).populate("members.user", "name email avatarUrl").lean();

  const labelByUserId = new Map((project?.members || []).map((member) => [String(member.user), member.memberLabel || ""]));
  const currentMembership = project?.members?.find((member) => String(member.user._id) === String(req.user._id));

  return sendSuccess(
    res,
    {
      ...task,
      assigneeProjectLabel: task.assignee ? labelByUserId.get(String(task.assignee._id)) || "" : "",
      subtasks,
      comments,
      history,
      deadlineRisk: risk,
      projectMembers: project?.members || [],
      currentUserProjectRole: currentMembership?.role || null,
      canManageTaskFields: canManageTaskEditing(currentMembership?.role),
      canEditTask: currentMembership
        ? canEditTask({ role: currentMembership.role, userId: req.user._id, task })
        : false,
      availableDependencyTasks: await Task.find({
        project: task.project,
        _id: { $ne: task._id },
      }).select("title status").sort({ createdAt: -1 }).lean(),
    },
    "Task fetched"
  );
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found", 404);

  const { member } = await assertProjectAccess(task.project, req.user._id);
  if (!canEditTask({ role: member.role, userId: req.user._id, task })) throw new AppError("Forbidden", 403);

  const updateFields = [
    "title",
    "description",
    "assignee",
    "dueDate",
    "priority",
    "labels",
    "estimatedEffort",
    "dependencyTaskIds",
    "taskType",
    "storyPoints",
    "sprint",
  ];

  for (const field of updateFields) {
    if (req.body[field] !== undefined) {
      if (field === "assignee" && req.body.assignee) {
        const project = await Project.findById(task.project).lean();
        const isProjectMember = project.members.some((m) => String(m.user) === String(req.body.assignee));
        if (!isProjectMember) throw new AppError("Assignee must be a project member", 400);
      }
      if (field === "sprint" && req.body.sprint) {
        const sprintDoc = await Sprint.findOne({ _id: req.body.sprint, project: task.project }).lean();
        if (!sprintDoc) throw new AppError("Sprint does not belong to this project", 400);
      }
      await trackTaskChange({
        task: task._id,
        changedBy: req.user._id,
        field,
        oldValue: task[field],
        newValue: req.body[field],
      });
      task[field] = field === "storyPoints" && req.body[field] !== null ? Number(req.body[field]) : req.body[field];
    }
  }

  if (req.body.taskType === TASK_TYPE.STORY || task.taskType === TASK_TYPE.STORY) {
    if (!task.storyPoints || !Number.isInteger(Number(task.storyPoints)) || Number(task.storyPoints) < 1) {
      throw new AppError("Story tasks require storyPoints as a positive integer", 400);
    }
  }

  if (req.body.status !== undefined) {
    if (req.body.status === TASK_STATUS.DONE) {
      const allowed = await canMarkDone(task._id);
      if (!allowed) throw new AppError("Task is blocked by unfinished dependencies", 400);
      task.completedAt = new Date();
      task.blockedByOpenDependencies = false;
    }

    await trackTaskChange({
      task: task._id,
      changedBy: req.user._id,
      field: "status",
      oldValue: task.status,
      newValue: req.body.status,
    });
    task.status = req.body.status;
  }

  await task.save();

  await logActivity({
    actor: req.user._id,
    action: "task.updated",
    team: task.team,
    project: task.project,
    task: task._id,
    details: req.body,
  });

  req.app.get("io")?.to(`project:${task.project}`).emit("task:updated", task);

  return sendSuccess(res, task, "Task updated");
});

const moveTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found", 404);

  const { member } = await assertProjectAccess(task.project, req.user._id);
  if (!canEditTask({ role: member.role, userId: req.user._id, task })) throw new AppError("Forbidden", 403);

  if (status === TASK_STATUS.DONE) {
    const allowed = await canMarkDone(task._id);
    if (!allowed) throw new AppError("Blocked by dependencies", 400);
    task.completedAt = new Date();
  }

  await trackTaskChange({
    task: task._id,
    changedBy: req.user._id,
    field: "status",
    oldValue: task.status,
    newValue: status,
    note: "Moved via Kanban",
  });

  task.status = status;
  await task.save();

  req.app.get("io")?.to(`project:${task.project}`).emit("task:moved", {
    taskId: task._id,
    status,
  });

  return sendSuccess(res, task, "Task moved");
});

const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found", 404);

  await assertProjectAccess(task.project, req.user._id);

  const comment = await TaskComment.create({
    task: task._id,
    author: req.user._id,
    content: req.body.content,
  });

  await logActivity({
    actor: req.user._id,
    action: "task.comment_added",
    team: task.team,
    project: task.project,
    task: task._id,
    details: { comment: req.body.content },
  });

  const populated = await comment.populate("author", "name avatarUrl");
  req.app.get("io")?.to(`project:${task.project}`).emit("task:commented", populated);

  if (task.assignee && String(task.assignee) !== String(req.user._id)) {
    await createNotification({
      userId: task.assignee,
      type: "task_comment",
      title: "New comment on your task",
      message: `${req.user.name} commented on "${task.title}".`,
      metadata: {
        taskId: task._id,
        projectId: task.project,
      },
      io: req.app.get("io"),
    });
  }

  return sendSuccess(res, populated, "Comment added", 201);
});

const addSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError("Task not found", 404);

  const { member } = await assertProjectAccess(task.project, req.user._id);
  if (!canWriteProject(member.role)) throw new AppError("Forbidden", 403);

  const subtask = await Subtask.create({
    task: task._id,
    title: req.body.title,
  });

  task.subtaskIds.push(subtask._id);
  await task.save();

  return sendSuccess(res, subtask, "Subtask added", 201);
});

const toggleSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findById(req.params.subtaskId);
  if (!subtask) throw new AppError("Subtask not found", 404);

  const task = await Task.findById(subtask.task);
  await assertProjectAccess(task.project, req.user._id);

  subtask.isCompleted = !subtask.isCompleted;
  subtask.completedAt = subtask.isCompleted ? new Date() : null;
  await subtask.save();

  return sendSuccess(res, subtask, "Subtask updated");
});

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  moveTaskStatus,
  addComment,
  addSubtask,
  toggleSubtask,
};
