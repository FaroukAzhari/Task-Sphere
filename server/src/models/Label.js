const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#2563eb" },
  },
  { timestamps: true }
);

labelSchema.index({ team: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Label", labelSchema);
