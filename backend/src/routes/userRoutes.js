const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload, uploadToCloudinary } = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, authorize('Admin', 'HR'), getUsers)
  .post(protect, authorize('Admin', 'HR'), upload.single('profileImage'), uploadToCloudinary, createUser);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, upload.single('profileImage'), uploadToCloudinary, updateUser)
  .delete(protect, authorize('Admin'), deleteUser);

module.exports = router;
