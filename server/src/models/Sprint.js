const mongoose = require("mongoose");

const burndownSnapshotSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    totalPoints: { type: Number, default: 0 },
    completedPoints: { type: Number, default: 0 },
    remainingPoints: { type: Number, default: 0 },
  },
  { _id: false }
);

const sprintSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Planned", "Active", "Completed", "Cancelled"],
      default: "Planned",
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    taskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    burndownSnapshots: [burndownSnapshotSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Sprint", sprintSchema);
