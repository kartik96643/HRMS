const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['LeaveRequest', 'JobApplication', 'PerformanceReview', 'EmployeeUpdate', 'TaskAssigned', 'TaskStatusUpdate', 'TaskReviewed', 'TaskReassigned'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
