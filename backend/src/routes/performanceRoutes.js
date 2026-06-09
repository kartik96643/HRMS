const express = require('express');
const router = express.Router();
const {
  createReview,
  getEmployeeReviews,
  updateGoalStatus
} = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .post(protect, authorize('Admin', 'HR'), createReview);

router.route('/employee/:userId')
  .get(protect, getEmployeeReviews);

router.route('/goal/:reviewId/:goalIndex')
  .put(protect, updateGoalStatus);

module.exports = router;
