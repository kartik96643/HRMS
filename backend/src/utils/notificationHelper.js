const Notification = require('../models/Notification');

const sendNotification = async (userId, type, message) => {
  try {
    if (!userId) return;
    await Notification.create({
      user: userId,
      type,
      message,
    });
  } catch (error) {
    console.error('Failed to write notification to database:', error);
  }
};

module.exports = { sendNotification };
