const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const { USER_ROLES } = require("../constants/enums");
const {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  addProjectMember,
  updateProjectMemberLabel,
  getProjectOverview,
} = require("../controllers/projectController");
const {
  listProjectSprints,
  createSprint,
  startSprint,
  closeSprint,
  getSprintBurndown,
} = require("../controllers/sprintController");

const router = express.Router();

router.use(protect);

router.get("/", listProjects);
router.get("/:projectId", getProjectById);
router.get("/:projectId/overview", getProjectOverview);
router.get("/:projectId/sprints", listProjectSprints);
router.get("/:projectId/sprints/:sprintId/burndown", getSprintBurndown);
router.post(
  "/:projectId/members",
  [body("userId").isMongoId(), body("role").optional().isIn(Object.values(USER_ROLES)), body("memberLabel").optional().isString().isLength({ max: 50 })],
  validate,
  addProjectMember
);
router.patch(
  "/:projectId/members/:memberUserId/label",
  [body("memberLabel").optional().isString().isLength({ max: 50 })],
  validate,
  updateProjectMemberLabel
);
router.post(
  "/:projectId/sprints",
  [
    body("name").trim().notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601(),
    body("capacity").isInt({ min: 1 }),
    body("taskIds").optional().isArray(),
  ],
  validate,
  createSprint
);
router.patch("/:projectId/sprints/:sprintId/start", startSprint);
router.patch("/:projectId/sprints/:sprintId/close", closeSprint);
router.post(
  "/",
  [body("teamId").isMongoId(), body("name").trim().notEmpty(), body("deadline").isISO8601()],
  validate,
  createProject
);
router.patch("/:projectId", updateProject);

module.exports = router;
