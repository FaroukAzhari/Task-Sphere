const express = require("express");
const protect = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { USER_ROLES } = require("../constants/enums");
const { listUsers, updateProfile } = require("../controllers/userController");

const router = express.Router();

router.get("/", protect, authorize(USER_ROLES.ADMIN), listUsers);
router.patch("/me", protect, updateProfile);

module.exports = router;
