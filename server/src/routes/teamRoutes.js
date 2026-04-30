const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createTeam,
  listTeams,
  getTeamById,
  inviteMember,
  updateTeamSettings,
  updateMemberRole,
} = require("../controllers/teamController");
const { USER_ROLES } = require("../constants/enums");

const router = express.Router();

router.use(protect);

router.get("/", listTeams);
router.get("/:teamId", getTeamById);
router.post("/", [body("name").trim().notEmpty()], validate, createTeam);
router.post(
  "/:teamId/invite",
  [body("email").isEmail(), body("role").optional().isIn(Object.values(USER_ROLES))],
  validate,
  inviteMember
);
router.patch(
  "/:teamId/members/:memberUserId/role",
  [body("role").isIn(Object.values(USER_ROLES))],
  validate,
  updateMemberRole
);
router.patch("/:teamId", updateTeamSettings);

module.exports = router;
