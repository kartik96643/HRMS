import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  LineChart,
  Plus,
  Trash,
  Award,
  AlertCircle,
  Check,
  Sparkles,
  User,
  FileText,
  TrendingUp,
  Target,
  Star
} from 'lucide-react';

const Performance = () => {
  const { user: currentUser, isAdmin, isHR, isManager: isDeptManager } = useAuth();
  const isManager = isAdmin || isHR || isDeptManager;

  // Global lists
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Employee (for manager filtering / history)
  const [activeEmployeeId, setActiveEmployeeId] = useState('');

  // Creator Form States
  const [selectedEmp, setSelectedEmp] = useState('');
  const [feedback, setFeedback] = useState('');

  // Goals array inputs
  const [goalsInput, setGoalsInput] = useState(['']);

  // Rating fields (1-5 scale)
  const [ratingQuality, setRatingQuality] = useState(4);
  const [ratingTeamwork, setRatingTeamwork] = useState(4);
  const [ratingComm, setRatingComm] = useState(4);
  const [ratingProductivity, setRatingProductivity] = useState(4);

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [taskMetrics, setTaskMetrics] = useState(null);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users');
      // If department manager, only show employees in their department
      if (currentUser?.role === 'Manager') {
        setEmployees(data.filter(e => e._id !== currentUser._id && e.department?._id === currentUser.department?._id));
      } else {
        setEmployees(data.filter(e => e._id !== currentUser._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async (employeeId) => {
    if (!employeeId) return;
    try {
      const { data } = await api.get(`/performance/employee/${employeeId}`);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load performance reviews', err);
      setError('Could not load performance records.');
    }
  };

  const fetchTaskMetrics = async (employeeId) => {
    if (!employeeId) return;
    try {
      const { data } = await api.get(`/tasks/performance/${employeeId}`);
      setTaskMetrics(data);
    } catch (err) {
      console.error('Failed to load task metrics', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setError('');
      if (isManager) {
        await fetchEmployees();
      } else {
        // If employee, load reviews and task metrics
        await Promise.all([
          fetchReviews(currentUser._id),
          fetchTaskMetrics(currentUser._id)
        ]);
      }
      setLoading(false);
    };
    initData();
  }, [isManager]);

  // Load reviews when manager filters by employee
  useEffect(() => {
    if (isManager && activeEmployeeId) {
      fetchReviews(activeEmployeeId);
      fetchTaskMetrics(activeEmployeeId);
    } else if (isManager) {
      setReviews([]);
      setTaskMetrics(null);
    }
  }, [activeEmployeeId, isManager]);

  // Goals list helpers
  const handleAddGoalInput = () => {
    setGoalsInput([...goalsInput, '']);
  };

  const handleRemoveGoalInput = (index) => {
    setGoalsInput(goalsInput.filter((_, idx) => idx !== index));
  };

  const handleGoalInputChange = (index, value) => {
    const newGoals = [...goalsInput];
    newGoals[index] = value;
    setGoalsInput(newGoals);
  };

  // Create Review Action
  const handleCreateReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp || !feedback) return;

    setFormLoading(true);
    setFormSuccess('');
    // setCreatedSummary(null);

    // Filter out empty goals
    const filteredGoals = goalsInput.filter(g => g.trim() !== '');

    const payload = {
      employee: selectedEmp,
      feedback,
      goals: filteredGoals,
      ratings: {
        quality: Number(ratingQuality),
        teamwork: Number(ratingTeamwork),
        communication: Number(ratingComm),
        productivity: Number(ratingProductivity)
      }
    };

    try {
      const { data } = await api.post('/performance', payload);
      setFormSuccess('Performance review completed successfully!');

      // Store summary to display as result panel
      setCreatedSummary(data);

      // Clear inputs
      setFeedback('');
      setGoalsInput(['']);
      setRatingQuality(4);
      setRatingTeamwork(4);
      setRatingComm(4);
      setRatingProductivity(4);

      // If matching selected manager query, refresh history
      if (selectedEmp === activeEmployeeId) {
        fetchReviews(activeEmployeeId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle goal check status (Employee or Manager)
  const handleToggleGoal = async (reviewId, goalIdx, currentStatus, reviewEmpId) => {
    const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    try {
      await api.put(`/performance/goal/${reviewId}/${goalIdx}`, { status: newStatus });

      // Refresh current records list
      if (isManager) {
        fetchReviews(activeEmployeeId);
      } else {
        fetchReviews(currentUser._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle goal status');
    }
  };

  // CSS width helper for ratings bars
  const getRatingBarWidth = (val) => {
    return `${(val / 5) * 100}%`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Performance Management</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isManager
            ? 'Complete employee appraisals, track goals, and generate AI performance summaries.'
            : 'Track your objectives, review feedback, and view AI developmental reports.'}
        </p>
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
          <p className="mt-4 text-slate-400 text-sm">Loading performance metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MANAGER ONLY VIEW: WRITE APPRAISALS */}
          {isManager && (
            <div className="lg:col-span-1 space-y-6">

              {/* Creator Card */}
              <div className="glass p-6 rounded-2xl border border-slate-800/60 text-left">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Award className="text-primary-500" size={16} /> Write Review
                </h3>

                {formSuccess && (
                  <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold rounded-xl text-emerald-400">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateReviewSubmit} className="space-y-4">
                  {/* Select Employee */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Select Employee</label>
                    <select
                      required
                      value={selectedEmp}
                      onChange={(e) => setSelectedEmp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer"
                    >
                      <option value="">Choose Personnel...</option>
                      {employees.map(e => (
                        <option key={e._id} value={e._id}>{e.name} ({e.position})</option>
                      ))}
                    </select>
                  </div>

                  {/* Ratings blocks (1-5 sliders) */}
                  <div className="space-y-3 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Metrics (1 - 5 Scale)</span>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Work Quality:</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min="1" max="5" value={ratingQuality} onChange={(e) => setRatingQuality(e.target.value)} className="w-24 accent-primary-500 h-1 rounded cursor-pointer" />
                        <span className="font-bold text-primary-400 w-4 text-right">{ratingQuality}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Teamwork:</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min="1" max="5" value={ratingTeamwork} onChange={(e) => setRatingTeamwork(e.target.value)} className="w-24 accent-primary-500 h-1 rounded cursor-pointer" />
                        <span className="font-bold text-primary-400 w-4 text-right">{ratingTeamwork}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Communication:</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min="1" max="5" value={ratingComm} onChange={(e) => setRatingComm(e.target.value)} className="w-24 accent-primary-500 h-1 rounded cursor-pointer" />
                        <span className="font-bold text-primary-400 w-4 text-right">{ratingComm}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Productivity:</span>
                      <div className="flex items-center gap-2">
                        <input type="range" min="1" max="5" value={ratingProductivity} onChange={(e) => setRatingProductivity(e.target.value)} className="w-24 accent-primary-500 h-1 rounded cursor-pointer" />
                        <span className="font-bold text-primary-400 w-4 text-right">{ratingProductivity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Goal inputs */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase">Set OKR Goals</label>
                      <button
                        type="button"
                        onClick={handleAddGoalInput}
                        className="text-[10px] text-primary-400 hover:text-primary-300 font-bold"
                      >
                        + Add Goal
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {goalsInput.map((goal, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Goal ${idx + 1}`}
                            value={goal}
                            onChange={(e) => handleGoalInputChange(idx, e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-lg py-1.5 px-3 text-white text-xs outline-none"
                          />
                          {goalsInput.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGoalInput(idx)}
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition"
                            >
                              <Trash size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback text */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Performance Summary Comments</label>
                    <textarea
                      required
                      rows="3"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Write feedback comments..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none resize-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white font-semibold rounded-xl text-xs transition"
                  >
                    {formLoading ? 'Analyzing...' : 'Publish Appraisal & Generate AI Summary'}
                  </button>
                </form>
              </div>

              {/* Real-time generated AI Summary Preview */}
              {/* {createdSummary && (
                <div className="glass p-5 rounded-2xl border border-primary-500/20 bg-primary-500/5 text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="text-amber-500 animate-pulse" size={13} /> Generated AI Performance Summary
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs leading-normal">
                    <p className="text-slate-350 pr-2 break-words text-slate-300">
                      {createdSummary.aiSummary?.overallSummary}
                    </p>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Key Strengths</span>
                      <ul className="list-disc pl-4 mt-1 text-slate-400 space-y-1 text-[11px]">
                        {createdSummary.aiSummary?.keyStrengths?.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider block">Recommendations</span>
                      <ul className="list-disc pl-4 mt-1 text-slate-400 space-y-1 text-[11px]">
                        {createdSummary.aiSummary?.developmentRecommendations?.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )} */}

            </div>
          )}

          {/* APPRAISALS HISTORY & OBJECTIVES VIEW */}
          <div className={`${isManager ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>

            {/* Manager Filter Search Header */}
            {isManager && (
              <div className="glass p-5 rounded-2xl border border-slate-800/60 flex items-center justify-between gap-4 text-left">
                <div className="flex-1">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Personnel Review Log</span>
                  <select
                    value={activeEmployeeId}
                    onChange={(e) => setActiveEmployeeId(e.target.value)}
                    className="w-full max-w-xs bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none cursor-pointer"
                  >
                    <option value="">Select Employee to View History...</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>{e.name} ({e.position})</option>
                    ))}
                  </select>
                </div>
                {activeEmployeeId && (
                  <div className="text-right text-xs text-slate-400 font-medium">
                    Reviews Loaded: <span className="text-white font-bold">{reviews.length}</span>
                  </div>
                )}
              </div>
            )}

            {/* List Review Cards */}
            <div className="space-y-6">
              {taskMetrics && (
                <div className="glass p-6 rounded-2xl border border-primary-500/20 bg-primary-500/5 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3 pb-2 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="text-primary-500 animate-pulse" size={13} /> Task Performance Analytics Insights
                    </h4>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Auto-calculated metrics</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Task Completion Rate</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{taskMetrics.completionRate}%</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-350 dark:border-slate-800/55">
                        <div className="bg-primary-500 h-full rounded-full" style={{ width: `${taskMetrics.completionRate}%` }}></div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-550 dark:text-slate-500 font-semibold">Completed: {taskMetrics.completedTasks} / {taskMetrics.totalTasks}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Avg Quality Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{taskMetrics.averageRating} / 5</span>
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= Math.round(taskMetrics.averageRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-800'}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-550 dark:text-slate-500 font-semibold">Based on manager task reviews</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">On-Time Completion</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-800 dark:text-white">{taskMetrics.onTimeCompletionRate}%</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-350 dark:border-slate-800/55">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${taskMetrics.onTimeCompletionRate}%` }}></div>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-550 dark:text-slate-500 font-semibold">Tasks finished on or before due date</span>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div key={rev._id} className="glass rounded-2xl border border-slate-800/65 overflow-hidden text-left relative">

                    {/* Header info */}
                    <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                          <User size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{rev.employee?.name}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">{rev.employee?.position} • Reviewed on {new Date(rev.reviewDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Reviewer: <span className="text-slate-200 font-bold">{rev.reviewer?.name || 'Manager'}</span>
                      </div>
                    </div>

                    {/* Appraisals stats and graphs */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-850">

                      {/* Ratings chart */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <TrendingUp size={13} className="text-primary-500" /> Rated Metrics
                        </h5>

                        <div className="space-y-3">
                          {/* Rating 1 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">Work Quality</span>
                              <span className="text-white">{rev.ratings?.quality} / 5</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: getRatingBarWidth(rev.ratings?.quality) }}></div>
                            </div>
                          </div>
                          {/* Rating 2 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">Team Collaboration</span>
                              <span className="text-white">{rev.ratings?.teamwork} / 5</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: getRatingBarWidth(rev.ratings?.teamwork) }}></div>
                            </div>
                          </div>
                          {/* Rating 3 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">Communication</span>
                              <span className="text-white">{rev.ratings?.communication} / 5</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: getRatingBarWidth(rev.ratings?.communication) }}></div>
                            </div>
                          </div>
                          {/* Rating 4 */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-400">Productivity Velocity</span>
                              <span className="text-white">{rev.ratings?.productivity} / 5</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div className="bg-primary-500 h-full rounded-full" style={{ width: getRatingBarWidth(rev.ratings?.productivity) }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Goals Checklist */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Target size={13} className="text-amber-500 animate-pulse" /> Active OKR Goals Checklist
                        </h5>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {rev.goals?.map((goal, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleToggleGoal(rev._id, idx, goal.status, rev.employee?._id)}
                              className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${goal.status === 'Completed'
                                ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400 line-through'
                                : 'bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-800'
                                }`}
                            >
                              <span>{goal.text}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${goal.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                }`}>
                                {goal.status}
                              </span>
                            </div>
                          ))}
                          {(!rev.goals || rev.goals.length === 0) && (
                            <p className="text-xs text-slate-500 italic">No developmental goals set for this period.</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* AI report expansion */}
                    <div className="p-6 bg-slate-900/10 space-y-4">

                      {/* Overall Comments */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1"><FileText size={11} /> Manager Remarks Feedback</span>
                        <p className="text-xs text-slate-350 pr-2 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-850/50">
                          {rev.feedback}
                        </p>
                      </div>

                      {/* AI assessment */}
                      <div className="p-4 rounded-xl border border-primary-500/10 bg-primary-500/5 space-y-3">
                        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                          <Sparkles className="text-amber-500 animate-pulse" size={13} />
                          <span className="text-[10px] text-white font-extrabold uppercase tracking-wide">AI Performance Report Summary</span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {rev.aiSummary?.overallSummary}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Key Strengths Assessed</span>
                            <ul className="list-disc pl-4 text-[11px] text-slate-450 text-slate-400 space-y-1">
                              {rev.aiSummary?.keyStrengths?.map((str, idx) => (
                                <li key={idx}>{str}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-primary-400 uppercase tracking-wider block">Developmental Recommendations</span>
                            <ul className="list-disc pl-4 text-[11px] text-slate-450 text-slate-400 space-y-1">
                              {rev.aiSummary?.developmentRecommendations?.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))
              ) : (
                <div className="glass p-10 rounded-3xl border border-slate-800/60 text-center space-y-3">
                  <LineChart size={36} className="text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    {isManager
                      ? 'Select an employee from the dropdown list to review logs.'
                      : 'No performance reviews published for your account.'}
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Performance;
