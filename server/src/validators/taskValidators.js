const { body, query } = require("express-validator");
const { TASK_PRIORITY, TASK_STATUS, TASK_TYPE } = require("../constants/enums");

const createTaskValidator = [
  body("projectId").isMongoId().withMessage("projectId is required"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("priority").optional().isIn(Object.values(TASK_PRIORITY)),
  body("taskType").optional().isIn(Object.values(TASK_TYPE)),
  body("storyPoints").optional({ nullable: true }).isInt({ min: 1 }).withMessage("storyPoints must be a positive integer"),
  body("status").optional().isIn(Object.values(TASK_STATUS)),
  body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid date"),
  body("assignee").optional({ nullable: true }).custom((val) => !val || /^[0-9a-fA-F]{24}$/.test(val)).withMessage("assignee must be a valid id"),
  body("sprint").optional({ nullable: true }).custom((val) => !val || /^[0-9a-fA-F]{24}$/.test(val)),
  body("dependencyTaskIds").optional().isArray(),
  body("storyPoints").custom((value, { req }) => {
    if (req.body.taskType === TASK_TYPE.STORY && (!value || !Number.isInteger(Number(value)) || Number(value) < 1)) {
      throw new Error("Story tasks require storyPoints");
    }
    return true;
  }),
];

const updateTaskValidator = [
  body("title").optional().trim().notEmpty(),
  body("priority").optional().isIn(Object.values(TASK_PRIORITY)),
  body("taskType").optional().isIn(Object.values(TASK_TYPE)),
  body("storyPoints").optional({ nullable: true }).isInt({ min: 1 }),
  body("status").optional().isIn(Object.values(TASK_STATUS)),
  body("dueDate").optional({ nullable: true }).isISO8601(),
  body("assignee").optional({ nullable: true }).custom((val) => !val || /^[0-9a-fA-F]{24}$/.test(val)),
  body("sprint").optional({ nullable: true }).custom((val) => !val || /^[0-9a-fA-F]{24}$/.test(val)),
  body("dependencyTaskIds").optional().isArray(),
];

const taskQueryValidator = [
  query("projectId").optional().isMongoId(),
  query("status").optional().isIn(Object.values(TASK_STATUS)),
  query("priority").optional().isIn(Object.values(TASK_PRIORITY)),
  query("taskType").optional().isIn(Object.values(TASK_TYPE)),
  query("assignee").optional().isMongoId(),
  query("sprintId").optional().isMongoId(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator,
};
