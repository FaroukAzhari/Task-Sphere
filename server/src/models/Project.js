const mongoose = require("mongoose");
const { TASK_STATUS } = require("../constants/enums");

const projectMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    memberLabel: { type: String, default: "", trim: true, maxlength: 50 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    deadline: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed", "Archived"],
      default: "Active",
      index: true,
    },
    members: [projectMemberSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    taskStats: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

projectSchema.index({ team: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Project", projectSchema);
