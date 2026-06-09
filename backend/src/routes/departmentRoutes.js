const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getDepartments)
  .post(protect, authorize('Admin', 'HR'), createDepartment);

router.route('/:id')
  .delete(protect, authorize('Admin'), deleteDepartment);

module.exports = router;
