const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reviewDate: {
    type: Date,
    default: Date.now,
  },
  goals: [{
    text: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
  }],
  ratings: {
    quality: { type: Number, required: true, min: 1, max: 5 },
    teamwork: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    productivity: { type: Number, required: true, min: 1, max: 5 },
  },
  feedback: {
    type: String,
    required: [true, 'Feedback text is required'],
  },
  aiSummary: {
    keyStrengths: { type: [String], default: [] },
    areasForImprovement: { type: [String], default: [] },
    overallSummary: { type: String, default: '' },
    developmentRecommendations: { type: [String], default: [] }
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Performance', performanceSchema);
