import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User, 
  Mail, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Shield, 
  Upload, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const Profile = () => {
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setImagePreview(user.profileImage || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password) {
      formData.append('password', password);
    }
    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    try {
      await api.put(`/users/${user._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Profile updated successfully!');
      setPassword('');
      setImageFile(null);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">View your employment records and update your profile photo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Position Summary */}
        <div className="glass p-6 rounded-3xl border border-slate-800/60 flex flex-col items-center text-center space-y-4 self-start">
          <div className="relative group">
            <img 
              src={imagePreview || 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/avatar.png'} 
              alt={user?.name} 
              className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 bg-slate-900 group-hover:opacity-85 transition duration-150"
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.name}</h3>
            <p className="text-sm text-primary-400 font-semibold">{user?.position || 'Staff'}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/60">
              {user?.role} Portal
            </span>
          </div>

          {/* Quick Stats */}
          <div className="w-full pt-4 border-t border-slate-800/40 text-left space-y-2.5 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-2 text-slate-300">
              <Briefcase size={14} className="text-slate-500" />
              <span>{user?.department?.name || 'Operations Dept'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar size={14} className="text-slate-500" />
              <span>Joined: {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <DollarSign size={14} className="text-slate-500" />
              <span>Salary: ${user?.salary?.toLocaleString() || 0} / year</span>
            </div>
          </div>
        </div>

        {/* Right Column: Update details form */}
        <div className="md:col-span-2 glass p-6 md:p-8 rounded-3xl border border-slate-800/60">
          <h3 className="text-lg font-bold text-white mb-6">Profile Settings</h3>

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl flex items-center gap-2">
              <Check size={16} /> {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Upload Row */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-800/40">
              <div className="flex-1">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Profile Image</span>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 hover:text-white rounded-xl border border-slate-700 transition">
                  <Upload size={14} /> Choose Image File
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition"
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
                  className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition"
                />
              </div>

              {/* Password */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Change Password <span className="text-[10px] text-slate-500 font-normal">(Leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none transition"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 border-t border-slate-800/40 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-600/15 transition flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};

export default Profile;
