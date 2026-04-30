const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmailNotification } = require("./emailService");

const createNotification = async ({
  userId,
  type,
  title,
  message,
  metadata = {},
  io = null,
  email = null,
}) => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    metadata,
  });

  if (io) {
    io.to(`user:${userId}`).emit("notification:new", notification);
  }

  if (email?.preferenceKey) {
    const user = await User.findById(userId).select("email name notificationPreferences").lean();
    const preferences = user?.notificationPreferences || {};
    if (user?.email && preferences.emailEnabled !== false && preferences[email.preferenceKey] !== false) {
      await sendEmailNotification({
        to: user.email,
        subject: email.subject || title,
        text: email.text || message,
        html: email.html || `<p>${message}</p>`,
      });
    }
  }

  return notification;
};

module.exports = {
  createNotification,
};
