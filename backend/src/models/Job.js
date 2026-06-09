const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  requirements: {
    type: [String],
    default: [],
  },
  location: {
    type: String,
    default: 'Remote',
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time',
  },
  salaryRange: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Job', jobSchema);
