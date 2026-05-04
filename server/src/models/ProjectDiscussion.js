const mongoose = require("mongoose");

const projectDiscussionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    isPinned: { type: Boolean, default: false, index: true },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    pinnedAt: Date,
  },
  { timestamps: true }
);

projectDiscussionSchema.index({ project: 1, isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("ProjectDiscussion", projectDiscussionSchema);
