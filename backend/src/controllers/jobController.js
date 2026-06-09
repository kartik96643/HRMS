const Job = require('../models/Job');

// @desc    Get all job openings
// @route   GET /api/jobs
// @access  Public (So anyone can view available listings)
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({}).populate('department', 'name');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('department', 'name');
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a job opening
// @route   POST /api/jobs
// @access  Private (Admin, HR)
const createJob = async (req, res) => {
  const { title, description, department, requirements, salaryRange, location, type } = req.body;

  try {
    if (!title || !description || !department) {
      return res.status(400).json({ message: 'Title, description, and department are required' });
    }

    const job = await Job.create({
      title,
      description,
      department,
      requirements: Array.isArray(requirements) ? requirements : requirements ? requirements.split(',').map(s => s.trim()) : [],
      salaryRange,
      location: location || 'Remote',
      type: type || 'Full-time'
    });

    const populatedJob = await Job.findById(job._id).populate('department', 'name');
    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a job opening
// @route   PUT /api/jobs/:id
// @access  Private (Admin, HR)
const updateJob = async (req, res) => {
  const { title, description, department, requirements, salaryRange, location, type, status } = req.body;

  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job opening not found' });
    }

    if (title) job.title = title;
    if (description) job.description = description;
    if (department) job.department = department;
    if (salaryRange) job.salaryRange = salaryRange;
    if (location) job.location = location;
    if (type) job.type = type;
    if (status) job.status = status;

    if (requirements !== undefined) {
      job.requirements = Array.isArray(requirements) ? requirements : requirements.split(',').map(s => s.trim());
    }

    await job.save();
    
    const populatedJob = await Job.findById(job._id).populate('department', 'name');
    res.json(populatedJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob
};
