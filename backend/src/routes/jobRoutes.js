const express = require('express');
const router = express.Router();
const { getJobs, getJobById, createJob, updateJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(getJobs)
  .post(protect, authorize('Admin', 'HR'), createJob);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorize('Admin', 'HR'), updateJob);

module.exports = router;
