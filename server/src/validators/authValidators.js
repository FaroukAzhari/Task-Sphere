const { body } = require("express-validator");

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Please enter your full name."),
  body("email").isEmail().withMessage("Please enter a valid email address."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
];

const loginValidator = [
  body("email").isEmail().withMessage("Please enter a valid email address."),
  body("password").notEmpty().withMessage("Please enter your password."),
];

module.exports = {
  registerValidator,
  loginValidator,
};
