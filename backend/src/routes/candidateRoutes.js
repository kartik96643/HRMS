const express = require('express');
const router = express.Router();
const {
  createCandidate,
  getCandidatesByJob,
  getCandidateById,
  updateCandidateStatus
} = require('../controllers/candidateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadResume, uploadToCloudinary } = require('../middleware/uploadMiddleware');

// Post candidate is public for applications (uses file upload fields)
router.route('/')
  .post(uploadResume.single('resume'), uploadToCloudinary, createCandidate);

router.route('/:id')
  .get(protect, authorize('Admin', 'HR'), getCandidateById);

router.route('/:id/status')
  .put(protect, authorize('Admin', 'HR'), updateCandidateStatus);

router.route('/job/:jobId')
  .get(protect, authorize('Admin', 'HR'), getCandidatesByJob);

module.exports = router;
