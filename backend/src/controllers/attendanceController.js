const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Check-in for the day
// @route   POST /api/attendance/check-in
// @access  Private (Employee only, or allowed for all, but typically employees check-in)
const checkIn = async (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

  try {
    // Check if already checked in today
    const existingRecord = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (existingRecord) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const checkInTime = new Date();
    
    // Check if late (after 9:00 AM)
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    let status = 'Present';
    if (hours > 9 || (hours === 9 && minutes > 0)) {
      status = 'Late';
    }

    const record = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: checkInTime,
      status,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check-out for the day
// @route   POST /api/attendance/check-out
// @access  Private (Employee only)
const checkOut = async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const record = await Attendance.findOne({
      employee: req.user._id,
      date: today,
    });

    if (!record) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (record.checkOut) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    record.checkOut = new Date();
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user's attendance logs
// @route   GET /api/attendance/my-attendance
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const logs = await Attendance.find({ employee: req.user._id }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user's monthly summary stats
// @route   GET /api/attendance/summary
// @access  Private
const getMySummary = async (req, res) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const monthString = `${year}-${month}`; // YYYY-MM prefix

  try {
    // Find all attendance records of the user for this month
    const records = await Attendance.find({
      employee: req.user._id,
      date: { $regex: `^${monthString}` }
    });

    const summary = {
      present: 0,
      late: 0,
      absent: 0, // In full deployment, we can count total working days - present/late
      totalCheckedIn: records.length,
    };

    records.forEach(r => {
      if (r.status === 'Present') summary.present++;
      if (r.status === 'Late') summary.late++;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get monthly reports for HR & Admin
// @route   GET /api/attendance/reports
// @access  Private (Admin, HR)
const getAttendanceReports = async (req, res) => {
  const { month, year } = req.query; // format: month=06, year=2026

  if (!month || !year) {
    return res.status(400).json({ message: 'Please provide month and year parameters' });
  }

  const monthString = `${year}-${String(month).padStart(2, '0')}`;

  try {
    // Find all records matching YYYY-MM
    const records = await Attendance.find({
      date: { $regex: `^${monthString}` }
    }).populate('employee', 'name email role position department');

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getMySummary,
  getAttendanceReports,
};
