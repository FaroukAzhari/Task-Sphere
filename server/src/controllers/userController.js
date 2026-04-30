const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");
const { getPagination } = require("../utils/pagination");
const ALLOWED_FOCUS_MODES = new Set(["Builder", "Planner", "Reviewer", "Researcher"]);

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const search = req.query.search?.trim();

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, users, "Users fetched", 200, {
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    bio,
    avatarUrl,
    headline,
    location,
    focusMode,
    accentColor,
    notificationPreferences,
  } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (headline !== undefined) user.headline = String(headline || "").slice(0, 80);
  if (location !== undefined) user.location = String(location || "").slice(0, 60);
  if (focusMode !== undefined) {
    if (!ALLOWED_FOCUS_MODES.has(focusMode)) {
      throw new AppError("Invalid focus mode", 400);
    }
    user.focusMode = focusMode;
  }
  if (accentColor !== undefined) {
    if (accentColor && !/^#([A-Fa-f0-9]{6})$/.test(accentColor)) {
      throw new AppError("Accent color must be a valid hex value", 400);
    }
    user.accentColor = accentColor || "#0f8b8d";
  }
  if (avatarUrl !== undefined) {
    if (
      avatarUrl &&
      !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(avatarUrl)
    ) {
      throw new AppError("Avatar must be a PNG or JPEG image", 400);
    }
    user.avatarUrl = avatarUrl;
  }
  if (notificationPreferences !== undefined) {
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...notificationPreferences,
    };
  }

  await user.save();

  return sendSuccess(res, user.toSafeObject(), "Profile updated");
});

module.exports = {
  listUsers,
  updateProfile,
};
