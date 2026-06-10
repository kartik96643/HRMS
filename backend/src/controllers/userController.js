const User = require('../models/User');

// @desc    Get all employees/users
// @route   GET /api/users
// @access  Private (Admin, HR)
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.companyId }).populate('department', 'name');
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
    const user = await User.findOne({ _id: req.params.id, company: req.companyId }).populate('department', 'name');
    
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
      company: req.companyId,
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
    const createdUser = await User.findOne({ _id: user._id, company: req.companyId }).populate('department', 'name');

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
    let user = await User.findOne({ _id: req.params.id, company: req.companyId });

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const isOwner = req.user._id.toString() === user._id.toString();
    const isHR = req.user.role === 'HR';
    const isAdmin = req.user.role === 'Admin';
    const isEditor = isAdmin || isHR;

    // 1. Authorization: Only the owner, Admin, or HR can edit a profile.
    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    // 2. "No one can edit the admin, only admin can edit their profile"
    if (user.role === 'Admin' && !isOwner) {
      return res.status(403).json({ message: 'No one can edit the admin, only admin can edit their profile' });
    }

    // 3. Admin and HR (as editors) can only edit: role, position, department, status, and salary of other users.
    // They CANNOT edit password, email, name, or profileImage of other users.
    if (!isOwner && isEditor) {
      if (
        (name && name !== user.name) ||
        (email && email !== user.email) ||
        (password && password.trim() !== '') ||
        req.cloudinaryUrl
      ) {
        return res.status(403).json({
          message: 'Admin and HR can only edit role, position, department, and salary of other employees; not their password, email, and name.'
        });
      }
    }

    // 4. Owners (non-admin) CANNOT edit their own role, status, department, position, or salary.
    if (isOwner && !isAdmin) {
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
      if (position && position !== user.position) {
        return res.status(403).json({ message: 'You cannot change your own position' });
      }
    }

    // 5. Role restrictions: HR cannot change a user's role to Admin, or demote an Admin
    if (isHR) {
      if (role && role === 'Admin' && user.role !== 'Admin') {
        return res.status(403).json({ message: 'HR cannot assign Admin role' });
      }
      if (user.role === 'Admin' && role && role !== 'Admin') {
        return res.status(403).json({ message: 'HR cannot change Admin accounts' });
      }
    }

    // Update personal fields (Owner only)
    if (isOwner) {
      if (name) user.name = name;
      if (email) user.email = email;
      if (password && password.trim() !== '') {
        user.password = password; // Will be hashed in pre-save hook
      }
      if (req.cloudinaryUrl) {
        user.profileImage = req.cloudinaryUrl;
      }
    }

    // Update job/work fields (Editor only)
    if (isEditor) {
      if (role) user.role = role;
      if (status) user.status = status;
      if (salary !== undefined) user.salary = Number(salary);
      if (position) user.position = position;
      
      if (department === 'null' || department === '') {
        user.department = null;
      } else if (department) {
        user.department = department;
      }
    }

    await user.save();

    const updatedUser = await User.findOne({ _id: user._id, company: req.companyId }).populate('department', 'name');
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
    const user = await User.findOne({ _id: req.params.id, company: req.companyId });

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prevent Admin from deleting themselves
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete their own account' });
    }

    await User.findOneAndDelete({ _id: req.params.id, company: req.companyId });
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
