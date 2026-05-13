const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { syncPlatformRole } = require("../services/roleScopeService");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("You must sign in to continue.", 401, null, "AUTH_REQUIRED"));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new AppError("Your session is no longer valid. Please sign in again.", 401, null, "SESSION_INVALID"));
    }

    await syncPlatformRole(user);
    req.user = user;
    return next();
  } catch (_error) {
    return next(new AppError("Your session is invalid or has expired. Please sign in again.", 401, null, "SESSION_INVALID"));
  }
};

module.exports = protect;
