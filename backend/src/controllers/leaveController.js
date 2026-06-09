const Leave = require('../models/Leave');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationHelper');

// @desc    Create a leave request
// @route   POST /api/leaves
// @access  Private (Employee only, though open to all roles acting as employees)
const createLeaveRequest = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  try {
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    const populatedLeave = await Leave.findById(leave._id).populate('employee', 'name email position');

    // Notify all HR Managers and Admins
    const managers = await User.find({ role: { $in: ['Admin', 'HR'] } });
    for (const mgr of managers) {
      await sendNotification(
        mgr._id,
        'LeaveRequest',
        `New leave request (${leaveType}) submitted by ${req.user.name}`
      );
    }

    res.status(201).json(populatedLeave);
  } catch (error) {
    res.status(550).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in employee's leave requests
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Private (Admin, HR)
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate('employee', 'name email position role status department')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve/Reject leave request
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin, HR)
const updateLeaveStatus = async (req, res) => {
  const { status, rejectionReason } = req.body; // status: 'Approved' or 'Rejected'

  try {
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (Approved or Rejected)' });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;

    if (status === 'Rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // Notify the employee about the decision
    await sendNotification(
      leave.employee,
      'LeaveRequest',
      `Your leave request (${leave.leaveType}) has been ${status}`
    );

    const updatedLeave = await Leave.findById(leave._id)
      .populate('employee', 'name email position')
      .populate('approvedBy', 'name email');

    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
