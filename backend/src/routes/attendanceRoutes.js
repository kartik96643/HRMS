const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getMySummary,
  getAttendanceReports,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/my-attendance', protect, getMyAttendance);
router.get('/summary', protect, getMySummary);
router.get('/reports', protect, authorize('Admin', 'HR'), getAttendanceReports);

module.exports = router;
