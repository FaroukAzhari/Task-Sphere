const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { syncPlatformRole } = require("../services/roleScopeService");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new AppError("Unauthorized", 401));
    }

    await syncPlatformRole(user);
    req.user = user;
    return next();
  } catch (_error) {
    return next(new AppError("Invalid token", 401));
  }
};

module.exports = protect;
