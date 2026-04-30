const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
