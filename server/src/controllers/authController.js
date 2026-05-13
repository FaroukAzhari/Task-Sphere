const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { signToken } = require("../utils/jwt");
const { resolvePlatformRole, syncPlatformRole } = require("../services/roleScopeService");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    throw new AppError("This email is already registered.", 409, [{ field: "email", message: "This email is already registered.", location: "body", value: email }], "EMAIL_ALREADY_EXISTS");
  }

  const user = await User.create({ name, email, password, globalRole: resolvePlatformRole(email) });
  const token = signToken(user._id);

  return sendSuccess(
    res,
    {
      token,
      user: user.toSafeObject(),
    },
    "User registered",
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Incorrect email or password.", 401, null, "INVALID_CREDENTIALS");
  }

  await syncPlatformRole(user);
  user.lastLoginAt = new Date();
  await user.save();

  return sendSuccess(res, {
    token: signToken(user._id),
    user: user.toSafeObject(),
  }, "Login successful");
});

const me = asyncHandler(async (req, res) => {
  await syncPlatformRole(req.user);
  return sendSuccess(res, req.user, "Current user fetched");
});

const logout = asyncHandler(async (_req, res) => {
  return sendSuccess(res, null, "Logout successful");
});

module.exports = {
  register,
  login,
  me,
  logout,
};
