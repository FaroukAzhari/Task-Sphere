const express = require("express");
const protect = require("../middleware/auth");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/dashboard", protect, getDashboardAnalytics);

module.exports = router;
