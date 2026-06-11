const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTaskStatus,
  reviewTask,
  getEmployeeTaskMetrics,
  reassignTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// IMPORTANT: /performance/:userId must be defined BEFORE /:id/* routes
// so Express doesn't match the literal string 'performance' as a task :id
router.route('/')
  .get(protect, getTasks)
  .post(protect, authorize('Admin', 'Manager'), createTask);

router.route('/performance/:userId')
  .get(protect, getEmployeeTaskMetrics);

router.route('/:id/status')
  .put(protect, updateTaskStatus);

router.route('/:id/review')
  .put(protect, authorize('Admin', 'Manager'), reviewTask);

router.route('/:id/reassign')
  .put(protect, authorize('Admin', 'Manager'), reassignTask);

module.exports = router;
