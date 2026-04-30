const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const AppError = require("../utils/AppError");

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return sendSuccess(res, notifications, "Notifications fetched", 200, { unreadCount });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.notificationId,
    user: req.user._id,
  });

  if (!notification) throw new AppError("Notification not found", 404);

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return sendSuccess(res, notification, "Notification marked as read");
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, {
    $set: { isRead: true, readAt: new Date() },
  });

  return sendSuccess(res, null, "All notifications marked as read");
});

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};
