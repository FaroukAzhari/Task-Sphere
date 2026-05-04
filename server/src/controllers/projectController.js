const Project = require("../models/Project");
const Team = require("../models/Team");
const Task = require("../models/Task");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const { canWriteProject, canManageTeam, isAcceptedTeamMember } = require("../services/accessService");
const { TEAM_ASSIGNABLE_ROLES, normalizeScopedRole } = require("../services/roleScopeService");

const serializeProject = (projectDoc) => {
  const project = typeof projectDoc.toObject === "function" ? projectDoc.toObject() : projectDoc;
  project.members = (project.members || []).map((member) => ({
    ...member,
    role: normalizeScopedRole(member.role),
  }));
  return project;
};

const canManageProjectTeam = (team, member, user) =>
  String(team.owner?._id || team.owner) === String(user._id) ||
  user.globalRole === "Admin" ||
  (member && canManageTeam(member.role));
const normalizeDayStart = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
};

const createProject = asyncHandler(async (req, res) => {
  const { teamId, name, description, deadline, memberIds = [] } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const teamMember = team.members.find((m) => String(m.user) === String(req.user._id));
  if (!teamMember || !isAcceptedTeamMember(teamMember) || !canManageProjectTeam(team, teamMember, req.user)) {
    throw new AppError("Forbidden", 403);
  }

  const members = team.members
    .filter(
      (m) =>
        isAcceptedTeamMember(m) &&
        (memberIds.length === 0 || memberIds.includes(String(m.user)) || String(m.user) === String(req.user._id))
    )
    .map((m) => ({ user: m.user, role: normalizeScopedRole(m.role) }));

  if (deadline) {
    const today = normalizeDayStart(new Date());
    const requested = normalizeDayStart(deadline);
    if (requested < today) {
      throw new AppError("Project deadline cannot be earlier than today", 400);
    }
  }

  const project = await Project.create({
    team: teamId,
    name,
    description,
    deadline,
    members,
    createdBy: req.user._id,
  });

  return sendSuccess(res, serializeProject(project), "Project created", 201);
});

const listProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.teamId) filter.team = req.query.teamId;
  filter["members.user"] = req.user._id;

  const projects = await Project.find(filter)
    .populate("team", "name")
    .sort({ createdAt: -1 });

  return sendSuccess(res, projects.map((project) => serializeProject(project)), "Projects fetched");
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId)
    .populate("team", "name description")
    .populate("members.user", "name email avatarUrl");

  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((m) => String(m.user._id) === String(req.user._id));
  if (!member) throw new AppError("Forbidden", 403);

  return sendSuccess(res, serializeProject(project), "Project fetched");
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((m) => String(m.user) === String(req.user._id));
  if (!member || !canWriteProject(member.role)) throw new AppError("Forbidden", 403);

  const fields = ["name", "description", "deadline", "status"];
  if (req.body.deadline !== undefined) {
    const today = normalizeDayStart(new Date());
    const requested = normalizeDayStart(req.body.deadline);
    if (requested < today) {
      throw new AppError("Project deadline cannot be earlier than today", 400);
    }
  }
  fields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();

  return sendSuccess(res, serializeProject(project), "Project updated");
});

const addProjectMember = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { userId, role = "Member", memberLabel = "" } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const actingMember = project.members.find((m) => String(m.user) === String(req.user._id));
  if (!actingMember || !canWriteProject(actingMember.role)) throw new AppError("Forbidden", 403);
  if (!TEAM_ASSIGNABLE_ROLES.includes(role)) {
    throw new AppError("Invalid project role", 400);
  }

  const exists = project.members.some((m) => String(m.user) === String(userId));
  if (exists) throw new AppError("User is already in this project", 409);

  const team = await Team.findById(project.team).lean();
  const inTeam = team.members.some(
    (member) => String(member.user) === String(userId) && isAcceptedTeamMember(member)
  );
  if (!inTeam) throw new AppError("User must belong to the project team", 400);

  project.members.push({ user: userId, role: normalizeScopedRole(role), memberLabel });
  await project.save();

  const populated = await Project.findById(projectId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeProject(populated), "Project member added");
});

const updateProjectMemberLabel = asyncHandler(async (req, res) => {
  const { projectId, memberUserId } = req.params;
  const { memberLabel = "" } = req.body;

  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const actingMember = project.members.find((m) => String(m.user) === String(req.user._id));
  if (!actingMember || !canWriteProject(actingMember.role)) throw new AppError("Forbidden", 403);

  const targetMember = project.members.find((m) => String(m.user) === String(memberUserId));
  if (!targetMember) throw new AppError("Project member not found", 404);

  targetMember.memberLabel = memberLabel;
  await project.save();

  const populated = await Project.findById(projectId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeProject(populated), "Project member label updated");
});

const getProjectOverview = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId).lean();
  if (!project) throw new AppError("Project not found", 404);

  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalTasks = taskStats.reduce((acc, row) => acc + row.count, 0);
  const done = taskStats.find((row) => row._id === "Done")?.count || 0;

  return sendSuccess(res, {
    project,
    taskStats,
    progress: totalTasks === 0 ? 0 : Math.round((done / totalTasks) * 100),
  }, "Project overview fetched");
});

module.exports = {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  updateProjectMemberLabel,
  getProjectOverview,
};
