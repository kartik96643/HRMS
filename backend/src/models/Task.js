const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee is required'],
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigner is required'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required'],
  },
  status: {
    type: String,
    enum: ['Pending', 'In-Progress', 'Completed'],
    default: 'Pending',
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  completedAt: {
    type: Date,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    trim: true,
  },
  assignmentHistory: [
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      previousEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      action: {
        type: String,
        enum: ['Created', 'Reassigned'],
        required: true,
      },
      statusAtAssignment: {
        type: String,
        required: true,
      },
      reason: {
        type: String,
        trim: true,
      }
    }
  ],
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Task', taskSchema);
