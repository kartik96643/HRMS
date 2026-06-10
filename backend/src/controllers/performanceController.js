const Performance = require('../models/Performance');
const User = require('../models/User');
const { generatePerformanceSummary } = require('../utils/aiSummary');
const { sendNotification } = require('../utils/notificationHelper');
const { calculateTaskMetrics } = require('./taskController');

// @desc    Create a performance review (triggers AI summary generator)
// @route   POST /api/performance
// @access  Private (Admin, Manager)
const createReview = async (req, res) => {
  const { employee, goals, ratings, feedback } = req.body;

  try {
    if (!employee || !ratings || !feedback) {
      return res.status(400).json({ message: 'Employee, ratings, and feedback are required' });
    }

    const reviewedUser = await User.findOne({ _id: employee, company: req.companyId });
    if (!reviewedUser) {
      return res.status(404).json({ message: 'Target employee not found or access denied' });
    }

    // Calculate task metrics to augment the review
    const metrics = await calculateTaskMetrics(employee, req.companyId);
    const augmentedFeedback = `[Task Completion: ${metrics.completionRate}%, Avg Grade: ${metrics.averageRating}/5, On-Time: ${metrics.onTimeCompletionRate}%]. ${feedback}`;

    // Run AI Summary Generator based on ratings and feedback text
    const aiSummary = generatePerformanceSummary(ratings, augmentedFeedback);

    // Format goals: expect an array of strings or goals payload
    const formattedGoals = Array.isArray(goals)
      ? goals.map(g => (typeof g === 'string' ? { text: g, status: 'Pending' } : g))
      : [];

    const review = await Performance.create({
      employee,
      reviewer: req.user._id,
      goals: formattedGoals,
      ratings,
      feedback,
      aiSummary,
      company: req.companyId,
    });

    // Notify employee about new performance review
    await sendNotification(
      employee,
      'PerformanceReview',
      `A new performance review has been published by your manager, ${req.user.name}`,
      req.companyId
    );

    const populatedReview = await Performance.findOne({ _id: review._id, company: req.companyId })
      .populate('employee', 'name email position')
      .populate('reviewer', 'name email');

    res.status(201).json(populatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get performance review history for a specific employee
// @route   GET /api/performance/employee/:userId
// @access  Private (Admin, HR, Manager, Owner)
const getEmployeeReviews = async (req, res) => {
  try {
    // Authorization: Admin, HR and Manager can view. Employees can only view their own.
    const isOwner = req.user._id.toString() === req.params.userId;
    const isManager = req.user.role === 'Admin' || req.user.role === 'HR' || req.user.role === 'Manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Not authorized to view this employee reviews' });
    }

    // Verify target employee belongs to the company
    const employee = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const reviews = await Performance.find({ employee: req.params.userId, company: req.companyId })
      .populate('employee', 'name email position')
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update employee goal status
// @route   PUT /api/performance/goal/:reviewId/:goalIndex
// @access  Private (Admin, Manager, Owner)
const updateGoalStatus = async (req, res) => {
  const { status } = req.body; // status: 'Pending' or 'Completed'

  try {
    const review = await Performance.findOne({ _id: req.params.reviewId, company: req.companyId });
    if (!review) {
      return res.status(404).json({ message: 'Performance record not found' });
    }

    // Authorization: Admin, Manager, or Owner
    const isOwner = req.user._id.toString() === review.employee.toString();
    const isManager = req.user.role === 'Admin' || req.user.role === 'Manager';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this performance goal' });
    }

    const goalIndex = Number(req.params.goalIndex);
    if (isNaN(goalIndex) || goalIndex < 0 || goalIndex >= review.goals.length) {
      return res.status(400).json({ message: 'Invalid goal index' });
    }

    review.goals[goalIndex].status = status || 'Completed';
    await review.save();

    // Notify manager if goal is marked as completed by employee
    if (isOwner && status === 'Completed') {
      await sendNotification(
        review.reviewer,
        'PerformanceReview',
        `${req.user.name} has marked their goal ("${review.goals[goalIndex].text}") as Completed`,
        req.companyId
      );
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReview,
  getEmployeeReviews,
  updateGoalStatus
};
