const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const { USER_ROLES } = require("../constants/enums");
const { canManageTeam, roleRank } = require("../services/accessService");
const { createNotification } = require("../services/notificationService");
const elevatedRoles = new Set([USER_ROLES.ADMIN]);
const ensureSingleTeamLead = (team, targetUserId = null) => {
  const existing = team.members.find(
    (member) =>
      member.role === USER_ROLES.TEAM_LEAD &&
      (!targetUserId || String(member.user) !== String(targetUserId))
  );

  if (existing) {
    throw new AppError("Only one Team Lead can exist per team", 400);
  }
};

const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const team = await Team.create({
    name,
    description,
    owner: req.user._id,
    members: [
      {
        user: req.user._id,
        role: USER_ROLES.ADMIN,
        invitedBy: req.user._id,
      },
    ],
  });

  return sendSuccess(res, team, "Team created", 201);
});

const listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ "members.user": req.user._id })
    .populate("owner", "name email")
    .sort({ createdAt: -1 });

  return sendSuccess(res, teams, "Teams fetched");
});

const getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId)
    .populate("owner", "name email")
    .populate("members.user", "name email avatarUrl");

  if (!team) throw new AppError("Team not found", 404);

  const actingMember = team.members.find((m) => String(m.user._id) === String(req.user._id));
  if (!actingMember) throw new AppError("Forbidden", 403);

  return sendSuccess(res, team, "Team fetched");
});

const inviteMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = team.members.find((m) => String(m.user) === String(req.user._id));
  if (!actingMember || !canManageTeam(actingMember.role)) {
    throw new AppError("Forbidden", 403);
  }
  if (elevatedRoles.has(role) && actingMember.role !== USER_ROLES.ADMIN) {
    throw new AppError("Only admins can assign admin role", 403);
  }
  if (role === USER_ROLES.TEAM_LEAD) {
    ensureSingleTeamLead(team);
  }

  const invitedUser = await User.findOne({ email });
  if (!invitedUser) throw new AppError("User with provided email not found", 404);

  const exists = team.members.some((m) => String(m.user) === String(invitedUser._id));
  if (exists) throw new AppError("User is already a team member", 409);

  const assignedRole = role || USER_ROLES.MEMBER;

  team.members.push({
    user: invitedUser._id,
    role: assignedRole,
    invitedBy: req.user._id,
  });

  await team.save();
  invitedUser.globalRole = assignedRole;
  await invitedUser.save();
  await createNotification({
    userId: invitedUser._id,
    type: "team_invite",
    title: "Added to a team",
    message: `${req.user.name} added you to "${team.name}" as ${assignedRole}.`,
    metadata: {
      teamId: team._id,
      invitedBy: req.user._id,
      role: assignedRole,
    },
    io: req.app.get("io"),
    email: {
      preferenceKey: "teamInvites",
      subject: `Task Sphere: Added to team ${team.name}`,
      text: `${req.user.name} added you to "${team.name}" as ${assignedRole}.`,
      html: `
        <p>${req.user.name} added you to <strong>${team.name}</strong> as <strong>${assignedRole}</strong>.</p>
        <p>Open Task Sphere to view your teams and projects.</p>
      `,
    },
  });

  return sendSuccess(res, team, "Member invited");
});

const updateTeamSettings = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = team.members.find((m) => String(m.user) === String(req.user._id));
  if (!actingMember || !canManageTeam(actingMember.role)) {
    throw new AppError("Forbidden", 403);
  }

  if (req.body.name !== undefined) team.name = req.body.name;
  if (req.body.description !== undefined) team.description = req.body.description;
  if (req.body.settings !== undefined) {
    team.settings = {
      ...team.settings,
      ...req.body.settings,
    };
  }

  await team.save();
  return sendSuccess(res, team, "Team updated");
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { teamId, memberUserId } = req.params;
  const { role } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = team.members.find((m) => String(m.user) === String(req.user._id));
  if (!actingMember || !canManageTeam(actingMember.role)) throw new AppError("Forbidden", 403);
  if (elevatedRoles.has(role) && actingMember.role !== USER_ROLES.ADMIN) {
    throw new AppError("Only admins can assign admin role", 403);
  }
  if (role === USER_ROLES.TEAM_LEAD) {
    ensureSingleTeamLead(team, memberUserId);
  }

  const member = team.members.find((m) => String(m.user) === String(memberUserId));
  if (!member) throw new AppError("Team member not found", 404);
  if (String(memberUserId) === String(req.user._id) && (roleRank[role] || 0) < (roleRank[member.role] || 0)) {
    throw new AppError("You cannot change your own role to a lower hierarchy", 400);
  }

  member.role = role;
  await team.save();
  await User.findByIdAndUpdate(memberUserId, { globalRole: role });

  const populated = await Team.findById(teamId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, populated, "Member role updated");
});

module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  inviteMember,
  updateTeamSettings,
  updateMemberRole,
};
