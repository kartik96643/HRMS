const express = require('express');
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, authorize('Admin', 'HR'), getAllLeaves)
  .post(protect, createLeaveRequest);

router.get('/my-leaves', protect, getMyLeaves);
router.put('/:id/status', protect, authorize('Admin', 'HR'), updateLeaveStatus);

module.exports = router;
