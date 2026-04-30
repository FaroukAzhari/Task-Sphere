const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    title: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false, index: true },
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subtask", subtaskSchema);
