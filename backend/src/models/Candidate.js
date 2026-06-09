const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Candidate email is required'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'],
    default: 'Applied',
  },
  extractedInfo: {
    skills: { type: [String], default: [] },
    experience: { type: String, default: 'Not specified' },
    education: { type: String, default: 'Not specified' },
    certifications: { type: [String], default: [] }
  },
  aiMatch: {
    matchPercentage: { type: Number, default: 0 },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    candidateSummary: { type: String, default: 'Processing match summary...' }
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Candidate', candidateSchema);
