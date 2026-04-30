const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES } = require("../constants/enums");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatarUrl: { type: String, default: "" },
    bio: { type: String, default: "" },
    headline: { type: String, default: "", maxlength: 80, trim: true },
    location: { type: String, default: "", maxlength: 60, trim: true },
    focusMode: {
      type: String,
      enum: ["Builder", "Planner", "Reviewer", "Researcher"],
      default: "Builder",
    },
    accentColor: {
      type: String,
      default: "#0f8b8d",
      match: /^#([A-Fa-f0-9]{6})$/,
    },
    notificationPreferences: {
      emailEnabled: { type: Boolean, default: true },
      taskAssigned: { type: Boolean, default: true },
      sprintUpdates: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      teamInvites: { type: Boolean, default: true },
    },
    globalRole: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const data = this.toObject();
  delete data.password;
  return data;
};

module.exports = mongoose.model("User", userSchema);
