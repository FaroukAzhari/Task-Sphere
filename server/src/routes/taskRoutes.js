const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createTaskValidator,
  updateTaskValidator,
  taskQueryValidator,
} = require("../validators/taskValidators");
const {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  moveTaskStatus,
  addComment,
  addSubtask,
  toggleSubtask,
} = require("../controllers/taskController");

const router = express.Router();

router.use(protect);

router.get("/", taskQueryValidator, validate, listTasks);
router.get("/:taskId", getTaskById);
router.post("/", createTaskValidator, validate, createTask);
router.patch("/:taskId", updateTaskValidator, validate, updateTask);
router.patch("/:taskId/move", [body("status").notEmpty()], validate, moveTaskStatus);
router.post("/:taskId/comments", [body("content").trim().notEmpty()], validate, addComment);
router.post("/:taskId/subtasks", [body("title").trim().notEmpty()], validate, addSubtask);
router.patch("/subtasks/:subtaskId/toggle", toggleSubtask);

module.exports = router;
