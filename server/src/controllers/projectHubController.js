const Project = require("../models/Project");
const ProjectDiscussion = require("../models/ProjectDiscussion");
const ProjectDocument = require("../models/ProjectDocument");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { canWriteProject, canManageTaskEditing } = require("../services/accessService");

const assertProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate("members.user", "name email avatarUrl").lean();
  if (!project) throw new AppError("Project not found", 404);

  const member = project.members.find((item) => String(item.user._id) === String(userId));
  if (!member) throw new AppError("Forbidden", 403);

  return { project, member };
};

const listProjectDiscussions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await assertProjectMembership(projectId, req.user._id);

  const discussions = await ProjectDiscussion.find({ project: projectId })
    .populate("author", "name email avatarUrl")
    .populate("pinnedBy", "name")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, discussions, "Project discussions fetched");
});

const createProjectDiscussion = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { member } = await assertProjectMembership(projectId, req.user._id);
  if (!canWriteProject(member.role)) throw new AppError("Forbidden", 403);

  const discussion = await ProjectDiscussion.create({
    project: projectId,
    author: req.user._id,
    content: req.body.content,
  });

  const populated = await ProjectDiscussion.findById(discussion._id)
    .populate("author", "name email avatarUrl")
    .populate("pinnedBy", "name")
    .lean();

  return sendSuccess(res, populated, "Discussion posted", 201);
});

const toggleDiscussionPin = asyncHandler(async (req, res) => {
  const { projectId, entryId } = req.params;
  const { member } = await assertProjectMembership(projectId, req.user._id);
  if (!canManageTaskEditing(member.role)) throw new AppError("Forbidden", 403);

  const discussion = await ProjectDiscussion.findOne({ _id: entryId, project: projectId });
  if (!discussion) throw new AppError("Discussion not found", 404);

  discussion.isPinned = !discussion.isPinned;
  discussion.pinnedBy = discussion.isPinned ? req.user._id : undefined;
  discussion.pinnedAt = discussion.isPinned ? new Date() : undefined;
  await discussion.save();

  const populated = await ProjectDiscussion.findById(discussion._id)
    .populate("author", "name email avatarUrl")
    .populate("pinnedBy", "name")
    .lean();

  return sendSuccess(res, populated, discussion.isPinned ? "Discussion pinned" : "Discussion unpinned");
});

const listProjectDocuments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  await assertProjectMembership(projectId, req.user._id);

  const documents = await ProjectDocument.find({ project: projectId })
    .populate("uploadedBy", "name email avatarUrl")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, documents, "Project documents fetched");
});

const createProjectDocument = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { member } = await assertProjectMembership(projectId, req.user._id);
  if (!canWriteProject(member.role)) throw new AppError("Forbidden", 403);

  const document = await ProjectDocument.create({
    project: projectId,
    title: req.body.title,
    description: req.body.description,
    url: req.body.url,
    category: req.body.category || "General",
    uploadedBy: req.user._id,
  });

  const populated = await ProjectDocument.findById(document._id)
    .populate("uploadedBy", "name email avatarUrl")
    .lean();

  return sendSuccess(res, populated, "Project document saved", 201);
});

const updateProjectDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const { member } = await assertProjectMembership(projectId, req.user._id);
  if (!canWriteProject(member.role)) throw new AppError("Forbidden", 403);

  const document = await ProjectDocument.findOne({ _id: documentId, project: projectId });
  if (!document) throw new AppError("Project document not found", 404);

  ["title", "description", "url", "category"].forEach((field) => {
    if (req.body[field] !== undefined) document[field] = req.body[field];
  });
  await document.save();

  const populated = await ProjectDocument.findById(document._id)
    .populate("uploadedBy", "name email avatarUrl")
    .lean();

  return sendSuccess(res, populated, "Project document updated");
});

const deleteProjectDocument = asyncHandler(async (req, res) => {
  const { projectId, documentId } = req.params;
  const { member } = await assertProjectMembership(projectId, req.user._id);
  if (!canManageTaskEditing(member.role)) throw new AppError("Forbidden", 403);

  const document = await ProjectDocument.findOneAndDelete({ _id: documentId, project: projectId });
  if (!document) throw new AppError("Project document not found", 404);

  return sendSuccess(res, null, "Project document deleted");
});

module.exports = {
  listProjectDiscussions,
  createProjectDiscussion,
  toggleDiscussionPin,
  listProjectDocuments,
  createProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
};
