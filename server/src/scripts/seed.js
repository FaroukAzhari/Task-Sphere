require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/Project");
const Task = require("../models/Task");
const TaskComment = require("../models/TaskComment");
const Notification = require("../models/Notification");
const { USER_ROLES, TEAM_MEMBER_STATUS, TASK_STATUS, TASK_PRIORITY, TASK_TYPE } = require("../constants/enums");

const pick = (arr, i) => arr[i % arr.length];

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    TaskComment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const seedPasswordHash = await bcrypt.hash("password123", 10);
  const users = await User.insertMany([
    { name: "Admin One", email: "admin@tasksphere.dev", password: seedPasswordHash, globalRole: USER_ROLES.ADMIN },
    { name: "Maya PM", email: "maya@tasksphere.dev", password: seedPasswordHash, globalRole: USER_ROLES.PROJECT_MANAGER },
    { name: "Omar Lead", email: "omar@tasksphere.dev", password: seedPasswordHash, globalRole: USER_ROLES.TEAM_LEAD },
    { name: "Lina Viewer", email: "lina@tasksphere.dev", password: seedPasswordHash, globalRole: USER_ROLES.VIEWER },
    { name: "Sara Member", email: "sara@tasksphere.dev", password: seedPasswordHash, globalRole: USER_ROLES.MEMBER },
  ]);

  const [admin, pm, memberA, viewer, memberB] = users;

  const team = await Team.create({
    name: "Task Sphere Demo Team",
    description: "University software engineering team",
    owner: admin._id,
    members: [
      { user: admin._id, role: USER_ROLES.ADMIN, invitedBy: admin._id, status: TEAM_MEMBER_STATUS.ACCEPTED, joinedAt: new Date(), respondedAt: new Date() },
      { user: pm._id, role: USER_ROLES.PROJECT_MANAGER, invitedBy: admin._id, status: TEAM_MEMBER_STATUS.ACCEPTED, joinedAt: new Date(), respondedAt: new Date() },
      { user: memberA._id, role: USER_ROLES.TEAM_LEAD, invitedBy: pm._id, status: TEAM_MEMBER_STATUS.ACCEPTED, joinedAt: new Date(), respondedAt: new Date() },
      { user: memberB._id, role: USER_ROLES.MEMBER, invitedBy: pm._id, status: TEAM_MEMBER_STATUS.ACCEPTED, joinedAt: new Date(), respondedAt: new Date() },
      { user: viewer._id, role: USER_ROLES.VIEWER, invitedBy: pm._id, status: TEAM_MEMBER_STATUS.ACCEPTED, joinedAt: new Date(), respondedAt: new Date() },
    ],
  });

  const project = await Project.create({
    team: team._id,
    name: "Task Sphere MVP",
    description: "Collaborative kanban platform",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    members: team.members.filter((m) => m.status === TEAM_MEMBER_STATUS.ACCEPTED).map((m) => ({
      user: m.user,
      role: m.role,
      memberLabel:
        m.role === USER_ROLES.PROJECT_MANAGER
          ? "Planner"
          : m.role === USER_ROLES.TEAM_LEAD
            ? "Delivery Lead"
            : m.role === USER_ROLES.VIEWER
              ? "Observer"
              : "Contributor",
    })),
    createdBy: pm._id,
    status: "Active",
  });

  const assignees = [pm, memberA, memberB];
  const statuses = Object.values(TASK_STATUS);
  const priorities = Object.values(TASK_PRIORITY);
  const taskTypes = Object.values(TASK_TYPE);

  const tasks = await Task.insertMany(
    Array.from({ length: 15 }).map((_, idx) => {
      const taskType = pick(taskTypes, idx);
      return {
        project: project._id,
        team: team._id,
        title: `Task ${idx + 1}`,
        description: `Implementation detail for task ${idx + 1}`,
        assignee: pick(assignees, idx)._id,
        creator: pm._id,
        dueDate: new Date(Date.now() + (idx + 1) * 24 * 60 * 60 * 1000),
        priority: pick(priorities, idx),
        taskType,
        storyPoints: taskType === TASK_TYPE.STORY ? ((idx % 8) + 1) : undefined,
        status: pick(statuses, idx),
        estimatedEffort: (idx % 5) + 1,
      };
    })
  );

  await TaskComment.insertMany(
    tasks.slice(0, 6).map((task, idx) => ({
      task: task._id,
      author: pick(assignees, idx)._id,
      content: `Comment for ${task.title}`,
    }))
  );

  await Notification.insertMany(
    users.map((user, idx) => ({
      user: user._id,
      type: "seed_notice",
      title: "Welcome to Task Sphere",
      message: `Demo notification #${idx + 1}`,
      isRead: false,
    }))
  );

  console.log("Seed complete");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
