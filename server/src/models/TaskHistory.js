const mongoose = require("mongoose");

const taskHistorySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    field: { type: String, required: true, index: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

taskHistorySchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model("TaskHistory", taskHistorySchema);
