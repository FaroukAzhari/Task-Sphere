const express = require("express");
const { body } = require("express-validator");
const protect = require("../middleware/auth");
const validate = require("../middleware/validate");
const { chatWithFonAi } = require("../controllers/aiController");

const router = express.Router();

router.use(protect);

router.post(
  "/chat",
  [
    body("message").trim().isLength({ min: 2, max: 1200 }),
    body("history").optional().isArray({ max: 8 }),
    body("history.*.role").optional().isIn(["user", "assistant"]),
    body("history.*.content").optional().isString().isLength({ min: 1, max: 1200 }),
  ],
  validate,
  chatWithFonAi
);

module.exports = router;
