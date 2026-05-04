const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const { TEAM_ASSIGNABLE_ROLES } = require("../services/roleScopeService");
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
const {
  listProjectDiscussions,
  createProjectDiscussion,
  toggleDiscussionPin,
  listProjectDocuments,
  createProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
} = require("../controllers/projectHubController");

const router = express.Router();

router.use(protect);

router.get("/", listProjects);
router.get("/:projectId", getProjectById);
router.get("/:projectId/overview", getProjectOverview);
router.get("/:projectId/hub/discussions", listProjectDiscussions);
router.post(
  "/:projectId/hub/discussions",
  [body("content").trim().isLength({ min: 1, max: 2000 })],
  validate,
  createProjectDiscussion
);
router.patch("/:projectId/hub/discussions/:entryId/pin", toggleDiscussionPin);
router.get("/:projectId/hub/documents", listProjectDocuments);
router.post(
  "/:projectId/hub/documents",
  [
    body("title").trim().isLength({ min: 1, max: 120 }),
    body("description").optional().isString().isLength({ max: 400 }),
    body("url").trim().isURL().isLength({ max: 500 }),
    body("category").optional().isString().isLength({ max: 50 }),
  ],
  validate,
  createProjectDocument
);
router.patch(
  "/:projectId/hub/documents/:documentId",
  [
    body("title").optional().trim().isLength({ min: 1, max: 120 }),
    body("description").optional().isString().isLength({ max: 400 }),
    body("url").optional().trim().isURL().isLength({ max: 500 }),
    body("category").optional().isString().isLength({ max: 50 }),
  ],
  validate,
  updateProjectDocument
);
router.delete("/:projectId/hub/documents/:documentId", deleteProjectDocument);
router.get("/:projectId/sprints", listProjectSprints);
router.get("/:projectId/sprints/:sprintId/burndown", getSprintBurndown);
router.post(
  "/:projectId/members",
  [body("userId").isMongoId(), body("role").optional().isIn(TEAM_ASSIGNABLE_ROLES), body("memberLabel").optional().isString().isLength({ max: 50 })],
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
