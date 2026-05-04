const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createTeam,
  listTeams,
  getTeamById,
  inviteMember,
  acceptInvitation,
  declineInvitation,
  updateTeamSettings,
  updateMemberRole,
} = require("../controllers/teamController");
const { TEAM_ASSIGNABLE_ROLES } = require("../services/roleScopeService");

const router = express.Router();

router.use(protect);

router.get("/", listTeams);
router.get("/:teamId", getTeamById);
router.post(
  "/",
  [body("name").trim().notEmpty(), body("creatorRole").optional().isIn(TEAM_ASSIGNABLE_ROLES)],
  validate,
  createTeam
);
router.post(
  "/:teamId/invite",
  [body("email").isEmail(), body("role").optional().isIn(TEAM_ASSIGNABLE_ROLES)],
  validate,
  inviteMember
);
router.post("/:teamId/invitations/:userId/accept", acceptInvitation);
router.post("/:teamId/invitations/:userId/decline", declineInvitation);
router.patch(
  "/:teamId/members/:memberUserId/role",
  [body("role").isIn(TEAM_ASSIGNABLE_ROLES)],
  validate,
  updateMemberRole
);
router.patch("/:teamId", updateTeamSettings);

module.exports = router;
