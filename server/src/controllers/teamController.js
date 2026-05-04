const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const { USER_ROLES, TEAM_MEMBER_STATUS } = require("../constants/enums");
const { canManageTeam, isAcceptedTeamMember, getScopedRoleRank } = require("../services/accessService");
const { createNotification } = require("../services/notificationService");
const { TEAM_ASSIGNABLE_ROLES, normalizeScopedRole } = require("../services/roleScopeService");

const findTeamMember = (team, userId) =>
  team.members.find((member) => String(member.user?._id || member.user) === String(userId));

const findAcceptedTeamMember = (team, userId) =>
  team.members.find(
    (member) =>
      String(member.user?._id || member.user) === String(userId) &&
      isAcceptedTeamMember(member)
  );

const canManageThisTeam = (team, actingMember, user) =>
  String(team.owner?._id || team.owner) === String(user._id) ||
  user.globalRole === USER_ROLES.ADMIN ||
  (actingMember && canManageTeam(actingMember.role));

const serializeTeam = (teamDoc, userId = null) => {
  const team = typeof teamDoc.toObject === "function" ? teamDoc.toObject() : teamDoc;
  team.members = (team.members || []).map((member) => ({
    ...member,
    role: normalizeScopedRole(member.role),
  }));

  if (userId) {
    const currentMembership = team.members.find((member) => String(member.user?._id || member.user) === String(userId)) || null;
    team.currentUserMembership = currentMembership;
    team.currentUserRole = currentMembership?.role || null;
    team.currentUserStatus = currentMembership?.status || TEAM_MEMBER_STATUS.ACCEPTED;
  }

  return team;
};

const ensureSingleTeamLead = (team, targetUserId = null) => {
  const existing = team.members.find(
    (member) =>
      member.role === USER_ROLES.TEAM_LEAD &&
      String(member.user?._id || member.user) !== String(targetUserId || "") &&
      (member.status === TEAM_MEMBER_STATUS.PENDING || isAcceptedTeamMember(member))
  );

  if (existing) {
    throw new AppError("Only one Team Lead can exist per team", 400);
  }
};

const createTeam = asyncHandler(async (req, res) => {
  const { name, description, creatorRole } = req.body;
  const now = new Date();
  const initialRole = TEAM_ASSIGNABLE_ROLES.includes(creatorRole)
    ? creatorRole
    : USER_ROLES.PROJECT_MANAGER;

  const team = await Team.create({
    name,
    description,
    owner: req.user._id,
    members: [
      {
        user: req.user._id,
        role: initialRole,
        invitedBy: req.user._id,
        status: TEAM_MEMBER_STATUS.ACCEPTED,
        invitedAt: now,
        joinedAt: now,
        respondedAt: now,
      },
    ],
  });

  return sendSuccess(res, serializeTeam(team, req.user._id), "Team created", 201);
});

const listTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ "members.user": req.user._id })
    .populate("owner", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, teams.map((team) => serializeTeam(team, req.user._id)), "Teams fetched");
});

const getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId)
    .populate("owner", "name email")
    .populate("members.user", "name email avatarUrl");

  if (!team) throw new AppError("Team not found", 404);

  const actingMember = findTeamMember(team, req.user._id);
  if (!actingMember) throw new AppError("Forbidden", 403);

  return sendSuccess(res, serializeTeam(team, req.user._id), "Team fetched");
});

const inviteMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { email, role } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = findAcceptedTeamMember(team, req.user._id);
  if (!actingMember || !canManageThisTeam(team, actingMember, req.user)) {
    throw new AppError("Forbidden", 403);
  }
  if (!TEAM_ASSIGNABLE_ROLES.includes(role || USER_ROLES.MEMBER)) {
    throw new AppError("Invalid team role", 400);
  }

  const assignedRole = normalizeScopedRole(role || USER_ROLES.MEMBER);
  if (assignedRole === USER_ROLES.TEAM_LEAD) {
    ensureSingleTeamLead(team);
  }

  const invitedUser = await User.findOne({ email });
  if (!invitedUser) throw new AppError("User with provided email not found", 404);

  const existingMembership = findTeamMember(team, invitedUser._id);
  if (existingMembership && isAcceptedTeamMember(existingMembership)) {
    throw new AppError("User is already a team member", 409);
  }
  if (existingMembership?.status === TEAM_MEMBER_STATUS.PENDING) {
    throw new AppError("User already has a pending invite", 409);
  }

  team.members.push({
    user: invitedUser._id,
    role: assignedRole,
    invitedBy: req.user._id,
    status: TEAM_MEMBER_STATUS.PENDING,
    invitedAt: new Date(),
  });

  await team.save();

  await createNotification({
    userId: invitedUser._id,
    type: "team_invite",
    title: "Team invitation pending",
    message: `${req.user.name} invited you to join "${team.name}" as ${assignedRole}. Accept the invitation to join the team.`,
    metadata: {
      teamId: team._id,
      teamName: team.name,
      invitedBy: req.user._id,
      role: assignedRole,
      status: TEAM_MEMBER_STATUS.PENDING,
    },
    io: req.app.get("io"),
    email: {
      preferenceKey: "teamInvites",
      subject: `Task Sphere: Invitation to join ${team.name}`,
      text: `${req.user.name} invited you to join "${team.name}" as ${assignedRole}. Sign in to Task Sphere and accept the invitation.`,
      html: `
        <p>${req.user.name} invited you to join <strong>${team.name}</strong> as <strong>${assignedRole}</strong>.</p>
        <p>Sign in to Task Sphere and accept the invitation before you can be added to projects.</p>
      `,
    },
  });

  const populated = await Team.findById(teamId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeTeam(populated, req.user._id), "Invitation sent");
});

const acceptInvitation = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  if (String(userId) !== String(req.user._id)) {
    throw new AppError("Forbidden", 403);
  }

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const member = findTeamMember(team, userId);
  if (!member || member.status !== TEAM_MEMBER_STATUS.PENDING) {
    throw new AppError("Pending invitation not found", 404);
  }

  const now = new Date();
  member.status = TEAM_MEMBER_STATUS.ACCEPTED;
  member.joinedAt = now;
  member.respondedAt = now;
  await team.save();
  await Notification.updateMany(
    {
      user: req.user._id,
      type: "team_invite",
      "metadata.teamId": team._id,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
        "metadata.status": TEAM_MEMBER_STATUS.ACCEPTED,
      },
    }
  );

  if (member.invitedBy) {
    await createNotification({
      userId: member.invitedBy,
      type: "team_invite_accepted",
      title: "Invitation accepted",
      message: `${req.user.name} accepted the invitation to join "${team.name}".`,
      metadata: {
        teamId: team._id,
        teamName: team.name,
        invitedUserId: req.user._id,
      },
      io: req.app.get("io"),
      email: {
        preferenceKey: "teamInvites",
        subject: `Task Sphere: ${req.user.name} joined ${team.name}`,
        text: `${req.user.name} accepted the invitation to join "${team.name}".`,
        html: `<p><strong>${req.user.name}</strong> accepted the invitation to join <strong>${team.name}</strong>.</p>`,
      },
    });
  }

  const populated = await Team.findById(teamId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeTeam(populated, req.user._id), "Invitation accepted");
});

const declineInvitation = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  if (String(userId) !== String(req.user._id)) {
    throw new AppError("Forbidden", 403);
  }

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const member = findTeamMember(team, userId);
  if (!member || member.status !== TEAM_MEMBER_STATUS.PENDING) {
    throw new AppError("Pending invitation not found", 404);
  }

  team.members = team.members.filter((teamMember) => String(teamMember.user) !== String(userId));
  await team.save();
  await Notification.updateMany(
    {
      user: req.user._id,
      type: "team_invite",
      "metadata.teamId": team._id,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        "metadata.status": "declined",
      },
    }
  );

  const populated = await Team.findById(teamId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeTeam(populated, req.user._id), "Invitation declined");
});

const updateTeamSettings = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = findAcceptedTeamMember(team, req.user._id);
  if (!actingMember || !canManageThisTeam(team, actingMember, req.user)) {
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
  return sendSuccess(res, serializeTeam(team, req.user._id), "Team updated");
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { teamId, memberUserId } = req.params;
  const { role } = req.body;

  const team = await Team.findById(teamId);
  if (!team) throw new AppError("Team not found", 404);

  const actingMember = findAcceptedTeamMember(team, req.user._id);
  if (!actingMember || !canManageThisTeam(team, actingMember, req.user)) throw new AppError("Forbidden", 403);
  if (!TEAM_ASSIGNABLE_ROLES.includes(role)) {
    throw new AppError("Invalid team role", 400);
  }
  if (normalizeScopedRole(role) === USER_ROLES.TEAM_LEAD) {
    ensureSingleTeamLead(team, memberUserId);
  }

  const member = findTeamMember(team, memberUserId);
  if (!member || !isAcceptedTeamMember(member)) throw new AppError("Accepted team member not found", 404);
  if (String(memberUserId) === String(req.user._id) && getScopedRoleRank(role) < getScopedRoleRank(member.role)) {
    throw new AppError("You cannot change your own role to a lower hierarchy", 400);
  }

  member.role = normalizeScopedRole(role);
  await team.save();

  const populated = await Team.findById(teamId).populate("members.user", "name email avatarUrl");
  return sendSuccess(res, serializeTeam(populated, req.user._id), "Member role updated");
});

module.exports = {
  createTeam,
  listTeams,
  getTeamById,
  inviteMember,
  acceptInvitation,
  declineInvitation,
  updateTeamSettings,
  updateMemberRole,
};
