const mongoose = require("mongoose");
const { TASK_PRIORITY, TASK_STATUS, TASK_TYPE } = require("../constants/enums");

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint", index: true },
    dueDate: { type: Date, index: true },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },
    taskType: {
      type: String,
      enum: Object.values(TASK_TYPE),
      default: TASK_TYPE.TASK,
      index: true,
    },
    storyPoints: {
      type: Number,
      min: 1,
      validate: {
        validator(value) {
          if (value === undefined || value === null) return true;
          return Number.isInteger(value) && value > 0;
        },
        message: "storyPoints must be a positive integer",
      },
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.BACKLOG,
      index: true,
    },
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Label" }],
    estimatedEffort: { type: Number, default: 1, min: 1 },
    attachments: [{
      name: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    }],
    subtaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
    dependencyTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task", index: true }],
    blockedByOpenDependencies: { type: Boolean, default: false, index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, assignee: 1 });
taskSchema.index({ title: "text", description: "text" });

taskSchema.pre("save", function validateStoryFields() {
  if (this.taskType === TASK_TYPE.STORY) {
    if (!this.storyPoints || !Number.isInteger(this.storyPoints) || this.storyPoints < 1) {
      throw new Error("Story tasks require storyPoints as a positive integer");
    }
  } else if (this.storyPoints !== undefined && this.storyPoints !== null) {
    this.storyPoints = undefined;
  }
});

module.exports = mongoose.model("Task", taskSchema);
