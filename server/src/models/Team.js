const mongoose = require("mongoose");
const { USER_ROLES } = require("../constants/enums");

const teamMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [teamMemberSchema],
    settings: {
      visibility: { type: String, enum: ["private", "public"], default: "private" },
      allowMemberInvite: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

teamSchema.index({ name: 1 });
teamSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Team", teamSchema);
