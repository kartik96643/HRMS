const User = require('../models/User');

// @desc    Get all employees/users
// @route   GET /api/users
// @access  Private (Admin, HR)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).populate('department', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single employee/user by ID
// @route   GET /api/users/:id
// @access  Private (Admin, HR, Owner)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Allow Admin, HR, or the user themselves to view the profile
    if (
      req.user.role !== 'Admin' &&
      req.user.role !== 'HR' &&
      req.user._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this profile' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new employee/user
// @route   POST /api/users
// @access  Private (Admin, HR)
const createUser = async (req, res) => {
  const { name, email, password, role, department, position, salary } = req.body;

  try {
    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Role restrictions: HR can only create Employees
    if (req.user.role === 'HR' && role && role !== 'Employee') {
      return res.status(403).json({ message: 'HR is only authorized to create Employee accounts' });
    }

    // Create user payload
    const userPayload = {
      name,
      email,
      password,
      role: role || 'Employee',
      position,
      salary: salary ? Number(salary) : 0,
    };

    if (department && department !== 'null' && department !== '') {
      userPayload.department = department;
    }

    // Set profile image if uploaded
    if (req.cloudinaryUrl) {
      userPayload.profileImage = req.cloudinaryUrl;
    }

    const user = await User.create(userPayload);

    // Return the created user without password
    const createdUser = await User.findById(user._id).populate('department', 'name');

    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update employee/user
// @route   PUT /api/users/:id
// @access  Private (Admin, HR, Owner)
const updateUser = async (req, res) => {
  const { name, email, password, role, department, position, status, salary } = req.body;

  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Authorization: Admin and HR can update anyone. Owner can update their own details but NOT role, salary, department, status.
    const isOwner = req.user._id.toString() === user._id.toString();
    const isManager = req.user.role === 'Admin' || req.user.role === 'HR';

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // Owner specific restrictions
    if (isOwner && !isManager) {
      if (role && role !== user.role) {
        return res.status(403).json({ message: 'You cannot change your own role' });
      }
      if (status && status !== user.status) {
        return res.status(403).json({ message: 'You cannot change your own status' });
      }
      if (department && department !== user.department?.toString()) {
        return res.status(403).json({ message: 'You cannot change your own department' });
      }
      if (salary && Number(salary) !== user.salary) {
        return res.status(403).json({ message: 'You cannot change your own salary' });
      }
    }

    // Role restrictions: HR cannot change a user's role to Admin, or demote an Admin
    if (req.user.role === 'HR') {
      if (role && role === 'Admin' && user.role !== 'Admin') {
        return res.status(403).json({ message: 'HR cannot assign Admin role' });
      }
      if (user.role === 'Admin' && role && role !== 'Admin') {
        return res.status(403).json({ message: 'HR cannot change Admin accounts' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (position) user.position = position;
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      user.password = password; // Will be hashed in pre-save hook
    }

    // Manager only updates
    if (isManager) {
      if (role) user.role = role;
      if (status) user.status = status;
      if (salary !== undefined) user.salary = Number(salary);
      
      if (department === 'null' || department === '') {
        user.department = null;
      } else if (department) {
        user.department = department;
      }
    }

    // Profile photo upload
    if (req.cloudinaryUrl) {
      user.profileImage = req.cloudinaryUrl;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).populate('department', 'name');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete employee/user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prevent Admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
