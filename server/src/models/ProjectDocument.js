const mongoose = require("mongoose");

const projectDocumentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 400 },
    url: { type: String, required: true, trim: true, maxlength: 500 },
    category: { type: String, default: "General", trim: true, maxlength: 50 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

projectDocumentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model("ProjectDocument", projectDocumentSchema);
