import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Send, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  User,
  Clock
} from 'lucide-react';

const Leaves = () => {
  const { user, isAdmin, isHR } = useAuth();
  
  // Shared States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' or 'manage'

  // Apply Form States
  const [leaveType, setLeaveType] = useState('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  // History / Requests States
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);

  // Reject Modal State
  const [rejectingLeaveId, setRejectingLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchMyLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/my-leaves');
      setMyLeaves(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch personal leave requests.');
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const { data } = await api.get('/leaves');
      setAllLeaves(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch organization leave requests.');
    }
  };

  const initData = async () => {
    setLoading(true);
    setError('');
    await fetchMyLeaves();
    if (isAdmin || isHR) {
      await fetchAllLeaves();
      setActiveTab('manage'); // Default to manager view
    }
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, [isAdmin, isHR]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormSuccess('');
    setError('');

    try {
      await api.post('/leaves', {
        leaveType,
        startDate,
        endDate,
        reason
      });
      setFormSuccess('Leave application submitted successfully!');
      setLeaveType('Sick');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchMyLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      try {
        await api.put(`/leaves/${leaveId}/status`, { status: 'Approved' });
        fetchAllLeaves();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve request');
      }
    }
  };

  const handleOpenRejectModal = (leaveId) => {
    setRejectingLeaveId(leaveId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      await api.put(`/leaves/${rejectingLeaveId}/status`, {
        status: 'Rejected',
        rejectionReason: rejectionReason
      });
      setIsRejectModalOpen(false);
      fetchAllLeaves();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Group leaves for manager review
  const pendingLeaves = allLeaves.filter(l => l.status === 'Pending');
  const processedLeaves = allLeaves.filter(l => l.status !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Leave Planner</h1>
          <p className="text-slate-400 text-sm mt-1">Apply for time off and review approval workflows.</p>
        </div>

        {/* Tab Selection */}
        {(isAdmin || isHR) && (
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'apply' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Request Leave
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'manage' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Approval Queue ({pendingLeaves.length})
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading leave database...</p>
        </div>
      ) : (
        <>
          {/* REQUEST LEAVE TAB */}
          {activeTab === 'apply' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Request Form */}
              <div className="glass p-6 rounded-2xl border border-slate-800/60 self-start">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Send className="text-primary-500" size={18} /> Apply for Time Off
                </h3>

                {formSuccess && (
                  <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none cursor-pointer"
                    >
                      <option value="Sick">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Annual">Annual Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please explain the reason for leave..."
                      rows="4"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-primary-600/15 flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </form>
              </div>

              {/* History list */}
              <div className="lg:col-span-2 glass rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/60">
                  <h3 className="text-base font-bold text-white">Your Leave Requests</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Leave Type</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {myLeaves.length > 0 ? (
                        myLeaves.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-800/10">
                            <td className="px-6 py-4 font-semibold text-white">{l.leaveType}</td>
                            <td className="px-6 py-4 text-xs text-slate-300">
                              <div>{new Date(l.startDate).toLocaleDateString()} to</div>
                              <div>{new Date(l.endDate).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 max-w-[200px] truncate" title={l.reason}>
                              {l.reason}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                l.status === 'Approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : l.status === 'Rejected'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {l.status}
                              </span>
                              {l.status === 'Rejected' && l.rejectionReason && (
                                <div className="text-[10px] text-red-400 mt-1 italic max-w-[150px] truncate" title={l.rejectionReason}>
                                  Note: {l.rejectionReason}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-12 text-slate-500">
                            No leave requests submitted yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* APPROVAL QUEUE TAB (Admin/HR only) */}
          {activeTab === 'manage' && (
            <div className="space-y-8">
              
              {/* Pending Section */}
              <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800/60 flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-amber-500" /> Pending Approval Queue
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
                    {pendingLeaves.length} requests
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Reason</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pendingLeaves.length > 0 ? (
                        pendingLeaves.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-850/25 transition">
                            {/* Employee */}
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{l.employee?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{l.employee?.position} • {l.employee?.email}</div>
                            </td>
                            {/* Type */}
                            <td className="px-6 py-4 font-bold text-slate-300">{l.leaveType}</td>
                            {/* Dates */}
                            <td className="px-6 py-4 text-xs text-slate-300">
                              <div>From: <span className="font-semibold text-white">{new Date(l.startDate).toLocaleDateString()}</span></div>
                              <div className="mt-0.5">To: <span className="font-semibold text-white">{new Date(l.endDate).toLocaleDateString()}</span></div>
                            </td>
                            {/* Reason */}
                            <td className="px-6 py-4 max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(l._id)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-semibold text-xs flex items-center gap-1 transition"
                                  title="Approve"
                                >
                                  <Check size={14} /> Approve
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(l._id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 font-semibold text-xs flex items-center gap-1 transition"
                                  title="Reject"
                                >
                                  <X size={14} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-slate-500">
                            Clear queue! No pending leave requests.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* History / Processed Section */}
              <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/60">
                  <h3 className="text-base font-bold text-slate-400">Processed Requests Log</h3>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Dates</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Processed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {processedLeaves.length > 0 ? (
                        processedLeaves.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-800/10">
                            {/* Employee */}
                            <td className="px-6 py-3">
                              <div className="font-semibold text-white">{l.employee?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{l.employee?.email}</div>
                            </td>
                            {/* Type */}
                            <td className="px-6 py-3 font-semibold text-slate-300">{l.leaveType}</td>
                            {/* Dates */}
                            <td className="px-6 py-3 text-xs text-slate-400">
                              {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                l.status === 'Approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {l.status}
                              </span>
                              {l.status === 'Rejected' && l.rejectionReason && (
                                <div className="text-[10px] text-red-400 mt-1 italic max-w-[150px] truncate" title={l.rejectionReason}>
                                  Note: {l.rejectionReason}
                                </div>
                              )}
                            </td>
                            {/* Processed By */}
                            <td className="px-6 py-3 text-xs text-slate-400 font-medium">
                              {l.approvedBy?.name || 'Manager'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-8 text-slate-500">
                            No processed leave history.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">Reject Leave Request</h2>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Rejection Reason / Feedback
                </label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows="4"
                  className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3.5 text-white text-sm outline-none resize-none bg-slate-950"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-650 hover:bg-red-600 bg-red-600 text-white rounded-xl text-sm font-semibold transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaves;
