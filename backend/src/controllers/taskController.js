const Task = require('../models/Task');
const User = require('../models/User');
const Department = require('../models/Department');
const Performance = require('../models/Performance');
const Leave = require('../models/Leave');
const { sendNotification } = require('../utils/notificationHelper');
const { generatePerformanceSummary } = require('../utils/aiSummary');

// Helper to calculate task performance metrics
const calculateTaskMetrics = async (userId, companyId) => {
  const query = companyId ? { assignedTo: userId, company: companyId } : { assignedTo: userId };
  const tasks = await Task.find(query);

  if (tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completionRate: 100, // percentage
      averageRating: 5,    // out of 5
      onTimeCompletionRate: 100,
    };
  }

  const completed = tasks.filter(t => t.status === 'Completed');
  const pending = tasks.filter(t => t.status === 'Pending');
  const inProgress = tasks.filter(t => t.status === 'In-Progress');
  
  const completedCount = completed.length;
  const completionRate = (completedCount / tasks.length) * 100;

  // Average rating of completed tasks that have been rated
  const ratedTasks = completed.filter(t => t.rating !== undefined);
  const averageRating = ratedTasks.length > 0
    ? ratedTasks.reduce((sum, t) => sum + t.rating, 0) / ratedTasks.length
    : 4; // default to 4 if not rated yet

  // On-time completion: completedAt <= dueDate
  const onTimeCompleted = completed.filter(t => t.completedAt && t.dueDate && new Date(t.completedAt) <= new Date(t.dueDate));
  const onTimeCompletionRate = completedCount > 0
    ? (onTimeCompleted.length / completedCount) * 105 // simple weight
    : 100;

  return {
    totalTasks: tasks.length,
    completedTasks: completedCount,
    pendingTasks: pending.length,
    inProgressTasks: inProgress.length,
    completionRate: Math.min(100, Math.round(completionRate)),
    averageRating: Math.round(averageRating * 10) / 10,
    onTimeCompletionRate: Math.min(100, Math.round(onTimeCompletionRate)),
  };
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin, Manager)
const createTask = async (req, res) => {
  const { title, description, assignedTo, dueDate } = req.body;

  try {
    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({ message: 'All fields (title, description, assignedTo, dueDate) are required' });
    }

    const assignee = await User.findOne({ _id: assignedTo, company: req.companyId });
    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found or access denied' });
    }

    // Check if the employee has an approved leave overlapping the task duration (from today to due date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);

    const overlappingLeave = await Leave.findOne({
      employee: assignedTo,
      status: 'Approved',
      company: req.companyId,
      startDate: { $lte: taskDueDate },
      endDate: { $gte: today }
    });

    if (overlappingLeave) {
      const startStr = new Date(overlappingLeave.startDate).toISOString().split('T')[0];
      const endStr = new Date(overlappingLeave.endDate).toISOString().split('T')[0];
      return res.status(400).json({
        message: `Employee is on leave from ${startStr} to ${endStr}`
      });
    }

    // Role restrictions: Manager can only assign to employees in their own department
    if (req.user.role === 'Manager') {
      const dept = await Department.findOne({ manager: req.user._id, company: req.companyId });
      if (!dept || assignee.department?.toString() !== dept._id.toString()) {
        return res.status(403).json({ message: 'Managers can only assign tasks to employees in their own department' });
      }
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      department: assignee.department,
      dueDate,
      company: req.companyId,
      assignmentHistory: [{
        employee: assignedTo,
        previousEmployee: null,
        assignedBy: req.user._id,
        assignedAt: new Date(),
        action: 'Created',
        statusAtAssignment: 'Pending',
        reason: 'Initial Assignment'
      }]
    });

    // Notify employee about new task
    await sendNotification(
      assignedTo,
      'TaskAssigned',
      `You have been assigned a new task: "${title}" by ${req.user.name}`,
      req.companyId
    );

    const populatedTask = await Task.findOne({ _id: task._id, company: req.companyId })
      .populate('assignedTo', 'name email position')
      .populate('assignedBy', 'name email position')
      .populate({
        path: 'assignmentHistory.employee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.previousEmployee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.assignedBy',
        select: 'name email position'
      });

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tasks list based on role
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let filter = { company: req.companyId };

    if (req.user.role === 'Employee' || req.user.role === 'HR') {
      filter.assignedTo = req.user._id;
    } else if (req.user.role === 'Manager') {
      // Find the department managed by this user
      const dept = await Department.findOne({ manager: req.user._id, company: req.companyId });
      if (dept) {
        filter.department = dept._id;
      } else {
        // If they don't manage any department, they can see tasks they assigned
        filter.assignedBy = req.user._id;
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email position department')
      .populate('assignedBy', 'name email position')
      .populate({
        path: 'assignmentHistory.employee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.previousEmployee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.assignedBy',
        select: 'name email position'
      })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update task status (by assignee)
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  const { status } = req.body; // status: 'Pending', 'In-Progress', 'Completed'

  try {
    if (!['Pending', 'In-Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const task = await Task.findOne({ _id: req.params.id, company: req.companyId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Authorization: Only the assignee or Admin/Manager can change status
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isManager = req.user.role === 'Admin' || req.user.role === 'Manager';
    if (!isAssignee && !isManager) {
      return res.status(403).json({ message: 'Not authorized to change this task status' });
    }

    task.status = status;
    if (status === 'Completed') {
      task.completedAt = Date.now();
    } else {
      task.completedAt = undefined;
    }

    await task.save();

    // Notify the assigner when status is updated
    if (isAssignee) {
      await sendNotification(
        task.assignedBy,
        'TaskStatusUpdate',
        `${req.user.name} updated the status of "${task.title}" to ${status}`,
        req.companyId
      );
    }

    const populatedTask = await Task.findOne({ _id: task._id, company: req.companyId })
      .populate('assignedTo', 'name email position department')
      .populate('assignedBy', 'name email position')
      .populate({
        path: 'assignmentHistory.employee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.previousEmployee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.assignedBy',
        select: 'name email position'
      });

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Review and rate a completed task (by manager/assigner)
// @route   PUT /api/tasks/:id/review
// @access  Private (Admin, HR, Manager)
const reviewTask = async (req, res) => {
  const { rating, ratings, feedback } = req.body;

  try {
    if (!feedback) {
      return res.status(400).json({ message: 'Feedback is required' });
    }

    let finalRatings;
    let avgRating;

    if (ratings) {
      const { quality, teamwork, communication, productivity } = ratings;
      if (
        quality === undefined || teamwork === undefined ||
        communication === undefined || productivity === undefined
      ) {
        return res.status(400).json({ message: 'All ratings (quality, teamwork, communication, productivity) are required' });
      }

      const q = Number(quality);
      const t = Number(teamwork);
      const c = Number(communication);
      const p = Number(productivity);

      if (
        isNaN(q) || q < 1 || q > 5 ||
        isNaN(t) || t < 1 || t > 5 ||
        isNaN(c) || c < 1 || c > 5 ||
        isNaN(p) || p < 1 || p > 5
      ) {
        return res.status(400).json({ message: 'All ratings must be numbers between 1 and 5' });
      }

      finalRatings = { quality: q, teamwork: t, communication: c, productivity: p };
      avgRating = (q + t + c + p) / 4;
    } else if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }
      finalRatings = { quality: ratingNum, teamwork: ratingNum, communication: ratingNum, productivity: ratingNum };
      avgRating = ratingNum;
    } else {
      return res.status(400).json({ message: 'Rating/ratings and feedback are required' });
    }

    const task = await Task.findOne({ _id: req.params.id, company: req.companyId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'Completed') {
      return res.status(400).json({ message: 'Only completed tasks can be reviewed' });
    }

    // Authorization: Only the assigner, or a Manager of that department, or Admin (HR is excluded)
    const isAssigner = task.assignedBy.toString() === req.user._id.toString();
    
    let isDeptManager = false;
    if (req.user.role === 'Manager') {
      const dept = await Department.findOne({ manager: req.user._id, company: req.companyId });
      isDeptManager = dept && task.department?.toString() === dept._id.toString();
    }
    
    const isAdmin = req.user.role === 'Admin';

    if (!isAssigner && !isDeptManager && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to review this task' });
    }

    task.rating = avgRating;
    task.feedback = feedback;

    await task.save();

    // Automatically create a Performance review
    const metrics = await calculateTaskMetrics(task.assignedTo, req.companyId);
    const augmentedFeedback = `[Task Completion: ${metrics.completionRate}%, Avg Grade: ${metrics.averageRating}/5, On-Time: ${metrics.onTimeCompletionRate}%]. Task: "${task.title}". ${feedback}`;
    const aiSummary = generatePerformanceSummary(finalRatings, augmentedFeedback);

    await Performance.create({
      employee: task.assignedTo,
      reviewer: req.user._id,
      ratings: finalRatings,
      feedback: `Task Review: "${task.title}" - ${feedback}`,
      aiSummary,
      goals: [],
      company: req.companyId,
    });

    // Notify employee about task feedback and new performance review
    await sendNotification(
      task.assignedTo,
      'TaskReviewed',
      `Your task "${task.title}" has been reviewed by ${req.user.name}. Grade: ${Math.round(avgRating * 10) / 10}/5`,
      req.companyId
    );

    await sendNotification(
      task.assignedTo,
      'PerformanceReview',
      `A new performance review has been published from your task evaluation by ${req.user.name}`,
      req.companyId
    );

    const populatedTask = await Task.findOne({ _id: task._id, company: req.companyId })
      .populate('assignedTo', 'name email position department')
      .populate('assignedBy', 'name email position')
      .populate({
        path: 'assignmentHistory.employee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.previousEmployee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.assignedBy',
        select: 'name email position'
      });

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get task performance metrics for a specific employee
// @route   GET /api/tasks/performance/:userId
// @access  Private
const getEmployeeTaskMetrics = async (req, res) => {
  try {
    const isSelf = req.user._id.toString() === req.params.userId;
    const isDeptManager = req.user.role === 'Manager';
    const isHRAdmin = req.user.role === 'Admin' || req.user.role === 'HR';

    if (!isSelf && !isDeptManager && !isHRAdmin) {
      return res.status(403).json({ message: 'Not authorized to view performance metrics' });
    }

    // Verify the target user belongs to the same company
    const employee = await User.findOne({ _id: req.params.userId, company: req.companyId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const metrics = await calculateTaskMetrics(req.params.userId, req.companyId);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reassign an active task
// @route   PUT /api/tasks/:id/reassign
// @access  Private (Admin, Manager)
const reassignTask = async (req, res) => {
  const { assignedTo, reason } = req.body;

  try {
    if (!assignedTo) {
      return res.status(400).json({ message: 'Assignee is required' });
    }

    const task = await Task.findOne({ _id: req.params.id, company: req.companyId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // A task can only be reassigned if it has not been completed AND reviewed (or is not reviewed yet)
    if (task.rating !== undefined) {
      return res.status(400).json({ message: 'Cannot reassign a task that has already been closed and reviewed' });
    }

    const assignee = await User.findOne({ _id: assignedTo, company: req.companyId });
    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found or access denied' });
    }

    // Role restrictions: Manager can only reassign to employees in their own department
    if (req.user.role === 'Manager') {
      const dept = await Department.findOne({ manager: req.user._id, company: req.companyId });
      if (!dept || task.department.toString() !== dept._id.toString() || assignee.department?.toString() !== dept._id.toString()) {
        return res.status(403).json({ message: 'Managers can only reassign tasks within their own department' });
      }
    }

    // Check if the employee has an approved leave overlapping the task duration (from today to due date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(task.dueDate);

    const overlappingLeave = await Leave.findOne({
      employee: assignedTo,
      status: 'Approved',
      company: req.companyId,
      startDate: { $lte: taskDueDate },
      endDate: { $gte: today }
    });

    if (overlappingLeave) {
      const startStr = new Date(overlappingLeave.startDate).toISOString().split('T')[0];
      const endStr = new Date(overlappingLeave.endDate).toISOString().split('T')[0];
      return res.status(400).json({
        message: `Employee is on leave from ${startStr} to ${endStr}`
      });
    }

    const oldAssigneeId = task.assignedTo;

    // Push to assignmentHistory
    task.assignmentHistory.push({
      employee: assignedTo,
      previousEmployee: oldAssigneeId,
      assignedBy: req.user._id,
      assignedAt: new Date(),
      action: 'Reassigned',
      statusAtAssignment: task.status,
      reason: reason || 'Priority/Staff reassignment'
    });

    // Update assignment details
    task.assignedTo = assignedTo;
    task.status = 'Pending';
    task.completedAt = undefined;

    await task.save();

    // Notify new employee
    await sendNotification(
      assignedTo,
      'TaskAssigned',
      `You have been reassigned a task: "${task.title}" by ${req.user.name}. Reason: ${reason || 'Not specified'}`,
      req.companyId
    );

    // Notify old employee
    await sendNotification(
      oldAssigneeId,
      'TaskReassigned',
      `The task "${task.title}" previously assigned to you has been reassigned to ${assignee.name} by ${req.user.name}`,
      req.companyId
    );

    const populatedTask = await Task.findOne({ _id: task._id, company: req.companyId })
      .populate('assignedTo', 'name email position department')
      .populate('assignedBy', 'name email position')
      .populate({
        path: 'assignmentHistory.employee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.previousEmployee',
        select: 'name email position'
      })
      .populate({
        path: 'assignmentHistory.assignedBy',
        select: 'name email position'
      });

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
  reviewTask,
  getEmployeeTaskMetrics,
  calculateTaskMetrics,
  reassignTask,
};
