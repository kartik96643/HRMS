const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const User = require('../models/User');
const { parseResumeAndScore } = require('../utils/aiParser');
const { sendNotification } = require('../utils/notificationHelper');

// @desc    Apply for a job (create candidate application)
// @route   POST /api/candidates
// @access  Public
const createCandidate = async (req, res) => {
  const { job, name, email, phone, notes } = req.body;

  try {
    if (!job || !name || !email) {
      return res.status(400).json({ message: 'Job, name, and email are required' });
    }

    const targetJob = await Job.findById(job);
    if (!targetJob) {
      return res.status(404).json({ message: 'Target job opening not found' });
    }

    // Retrieve Cloudinary URL from middleware upload buffer, if any
    console.log(req.cloudinaryUrl,'req.clo')
    const resumeUrl = req.cloudinaryUrl || '';

    // Run AI resume parsing & candidate matching score calculation
    const { extractedInfo, aiMatch } = await parseResumeAndScore(name, email, targetJob.requirements, req.file);

    const candidate = await Candidate.create({
      job,
      name,
      email,
      phone,
      resumeUrl,
      notes,
      extractedInfo,
      aiMatch
    });

    // Notify Admins and HR Managers about this new application
    const managers = await User.find({ role: { $in: ['Admin', 'HR'] } });
    for (const mgr of managers) {
      await sendNotification(
        mgr._id,
        'JobApplication',
        `New application from ${name} for ${targetJob.title} (${aiMatch.matchPercentage}% match)`
      );
    }

    res.status(201).json(candidate);
  } catch (error) {
    res.status(550).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get candidates by Job ID
// @route   GET /api/candidates/job/:jobId
// @access  Private (Admin, HR)
const getCandidatesByJob = async (req, res) => {
  try {
    const candidates = await Candidate.find({ job: req.params.jobId }).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single candidate by ID
// @route   GET /api/candidates/:id
// @access  Private (Admin, HR)
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('job', 'title department');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update candidate application status
// @route   PUT /api/candidates/:id/status
// @access  Private (Admin, HR)
const updateCandidateStatus = async (req, res) => {
  const { status, notes } = req.body;

  try {
    const candidate = await Candidate.findById(req.params.id).populate('job', 'title');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate application not found' });
    }

    if (status) candidate.status = status;
    if (notes) candidate.notes = notes;

    await candidate.save();

    // Trigger notification if candidate status changes to Hired or Offered
    if (status === 'Hired' || status === 'Offered') {
      const managers = await User.find({ role: { $in: ['Admin', 'HR'] } });
      for (const mgr of managers) {
        await sendNotification(
          mgr._id,
          'JobApplication',
          `Application for ${candidate.name} updated to ${status} for ${candidate.job?.title}`
        );
      }
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createCandidate,
  getCandidatesByJob,
  getCandidateById,
  updateCandidateStatus
};
