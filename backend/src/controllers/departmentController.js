const Department = require('../models/Department');
const User = require('../models/User');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private (Admin, HR)
const createDepartment = async (req, res) => {
  const { name, description } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const deptExists = await Department.findOne({ name: name.trim() });
    if (deptExists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = await Department.create({
      name: name.trim(),
      description,
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin only)
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Unassign department from users
    await User.updateMany({ department: req.params.id }, { department: null });

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
};
