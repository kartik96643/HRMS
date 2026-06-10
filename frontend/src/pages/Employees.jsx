import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Upload, 
  Filter, 
  AlertCircle,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

const Employees = () => {
  const { user: currentUser, isAdmin, isHR } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const isEditingSelf = currentEmpId === currentUser?._id;
  const isPersonalInfoDisabled = isEditMode && !isEditingSelf;
  const isWorkInfoDisabled = isEditMode && isEditingSelf && !isAdmin;

  // Department Creation State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments')
      ]);
      setEmployees(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from API server. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('Employee');
    setDepartment('');
    setPosition('');
    setSalary('');
    setImageFile(null);
    setImagePreview('');
    setFormError('');
  };

  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    resetForm();
    setIsEditMode(true);
    setCurrentEmpId(emp._id);
    setName(emp.name);
    setEmail(emp.email);
    setRole(emp.role);
    setDepartment(emp.department?._id || '');
    setPosition(emp.position || '');
    setSalary(emp.salary || '');
    setImagePreview(emp.profileImage || '');
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password) formData.append('password', password);
    formData.append('role', role);
    formData.append('department', department);
    formData.append('position', position);
    formData.append('salary', salary);
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      if (isEditMode) {
        await api.put(`/users/${currentEmpId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        if (!password) {
          setFormError('Password is required for new accounts');
          setFormLoading(false);
          return;
        }
        await api.post('/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save employee record');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId) => {
    if (window.confirm('Are you sure you want to remove this employee from records?')) {
      try {
        await api.delete(`/users/${empId}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete operation failed');
      }
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;

    try {
      await api.post('/departments', {
        name: newDeptName,
        description: newDeptDesc
      });
      setNewDeptName('');
      setNewDeptDesc('');
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept ? emp.department?._id === selectedDept : true;
    const matchesRole = selectedRole ? emp.role === selectedRole : true;

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Employee Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage personnel registry, roles, and profiles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(isAdmin || isHR) && (
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700/60 transition flex items-center gap-2"
            >
              <Briefcase size={16} /> Add Dept
            </button>
          )}
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-600/10 transition flex items-center gap-2"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="glass p-5 rounded-2xl border border-slate-800/60 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm outline-none transition duration-200"
          />
        </div>

        {/* Filter Department */}
        <div className="relative min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Filter size={14} />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 pl-9 pr-8 text-white text-sm outline-none appearance-none transition duration-200 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Role */}
        <div className="relative min-w-[150px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <ShieldCheck size={14} />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 pl-9 pr-8 text-white text-sm outline-none appearance-none transition duration-200 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading user directory...</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Employee</th>
                  <th scope="col" className="px-6 py-4">Department & Role</th>
                  <th scope="col" className="px-6 py-4">Position</th>
                  <th scope="col" className="px-6 py-4">Salary</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-transparent">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-800/20 transition duration-150">
                      {/* Name & Photo */}
                      <td className="flex items-center gap-3 px-6 py-4">
                        <img 
                          src={emp.profileImage} 
                          alt={emp.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div className="font-semibold text-white">
                          <div>{emp.name}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{emp.email}</div>
                        </div>
                      </td>

                      {/* Dept & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/40">
                            {emp.department?.name || 'Unassigned'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${
                            emp.role === 'Admin' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : emp.role === 'HR'
                              ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {emp.role}
                          </span>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-6 py-4 text-slate-300 font-medium">{emp.position || 'Staff'}</td>

                      {/* Salary */}
                      <td className="px-6 py-4 text-slate-300">${emp.salary?.toLocaleString() || 0}</td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(isAdmin || isHR) && (emp.role !== 'Admin' || emp._id === currentUser._id) && (
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          {isAdmin && emp._id !== currentUser._id && (
                            <button
                              onClick={() => handleDeleteEmployee(emp._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-500">
                      No employees matched your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {isEditMode ? 'Edit Employee Details' : 'Register New Employee'}
            </h2>

            {formError && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Profile Image Select */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-800/60">
                <img 
                  src={imagePreview || 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png'} 
                  alt="Avatar Preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-700 bg-slate-800"
                />
                {!isPersonalInfoDisabled && (
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700 flex items-center gap-2">
                      <Upload size={14} /> Upload Profile Photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-2">JPEG or PNG. Max file size: 5MB.</p>
                  </div>
                )}
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPersonalInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition disabled:opacity-50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPersonalInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition disabled:opacity-50"
                  />
                </div>

                 {/* Password (Required for create, optional for edit) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Password {isEditMode && <span className="text-[10px] text-slate-500 font-normal">(Leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    required={!isEditMode}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPersonalInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition disabled:opacity-50"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role Permissions</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isWorkInfoDisabled || (isHR && role === 'Admin')}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition cursor-pointer bg-slate-950 disabled:opacity-50"
                  >
                    <option value="Employee">Employee</option>
                    <option value="HR">HR</option>
                    {isAdmin && <option value="Admin">Admin</option>}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isWorkInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title / Position</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Lead Designer"
                    disabled={isWorkInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition disabled:opacity-50"
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Salary ($)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    disabled={isWorkInfoDisabled}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-800/40 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700/60 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-600/20 transition flex items-center gap-2"
                >
                  {formLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsDeptModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create New Department</h2>

            <form onSubmit={handleAddDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
