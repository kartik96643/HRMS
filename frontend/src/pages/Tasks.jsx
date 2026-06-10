import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Star, 
  MessageSquare,
  Calendar,
  Sparkles,
  Info,
  X
} from 'lucide-react';

const Tasks = () => {
  const { user: currentUser } = useAuth();
  const isSupervisor = currentUser?.role === 'Admin' || currentUser?.role === 'HR' || currentUser?.role === 'Manager';

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Create Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Review Task Form State
  const [ratingQuality, setRatingQuality] = useState(4);
  const [ratingTeamwork, setRatingTeamwork] = useState(4);
  const [ratingComm, setRatingComm] = useState(4);
  const [ratingProductivity, setRatingProductivity] = useState(4);
  const [feedback, setFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
      setError('Could not fetch tasks from server.');
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users');
      // Managers can only assign tasks to employees in their own department
      if (currentUser?.role === 'Manager') {
        setEmployees(data.filter(emp => emp.department?._id === currentUser.department?._id && emp._id !== currentUser._id));
      } else {
        setEmployees(data.filter(emp => emp._id !== currentUser._id));
      }
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      await fetchTasks();
      if (isSupervisor) {
        await fetchEmployees();
      }
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  // Handle task status update (Employee action)
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      setError('');
      const { data } = await api.put(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? data : t));
      setSuccess(`Task marked as ${newStatus}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  // Handle task creation (Supervisor action)
  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !assignedTo || !dueDate) return;

    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/tasks', {
        title,
        description,
        assignedTo,
        dueDate
      });
      setTasks([data, ...tasks]);
      setSuccess('Task assigned successfully!');
      setIsCreateModalOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Open review modal
  const openReviewModal = (task) => {
    setSelectedTask(task);
    setRatingQuality(4);
    setRatingTeamwork(4);
    setRatingComm(4);
    setRatingProductivity(4);
    setFeedback('');
    setIsReviewModalOpen(true);
  };

  // Handle task review submission (Supervisor action)
  const handleReviewTaskSubmit = async (e) => {
    e.preventDefault();
    if (!feedback || !selectedTask) return;

    setReviewLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.put(`/tasks/${selectedTask._id}/review`, {
        ratings: {
          quality: Number(ratingQuality),
          teamwork: Number(ratingTeamwork),
          communication: Number(ratingComm),
          productivity: Number(ratingProductivity)
        },
        feedback
      });
      setTasks(tasks.map(t => t._id === selectedTask._id ? data : t));
      setSuccess('Task reviewed and graded successfully!');
      setIsReviewModalOpen(false);
      setSelectedTask(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  // Grouping helpers
  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const progressTasks = tasks.filter(t => t.status === 'In-Progress');
  const completedTasks = tasks.filter(t => t.status === 'Completed' && t.rating === undefined);
  const reviewedTasks = tasks.filter(t => t.rating !== undefined);

  // Status helper colors
  const getStatusColor = (status, hasRating) => {
    if (hasRating) return 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-emerald-500';
    if (status === 'Completed') return 'bg-amber-500/10 text-amber-450 border border-amber-500/20 text-amber-500';
    if (status === 'In-Progress') return 'bg-sky-500/10 text-sky-455 border border-sky-500/20 text-sky-500';
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <CheckSquare className="text-primary-500" /> Task Board
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isSupervisor 
              ? 'Assign duties, monitor execution timelines, and grade completed works.' 
              : 'View duties assigned to you, update status, and see manager feedback.'}
          </p>
        </div>
        {isSupervisor && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-600/10 transition flex items-center gap-2"
          >
            <Plus size={16} /> Assign Task
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-xl flex items-center gap-3">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading task boards...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Column 1: Pending */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-850 mb-4 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pending</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold">{pendingTasks.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {pendingTasks.map(task => (
                  <div key={task._id} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{task.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-900/40 space-y-2 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><User size={11} /> {task.assignedTo?.name}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      {!isSupervisor && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'In-Progress')}
                          className="w-full py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-[9px] transition"
                        >
                          Start Work
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-6">No pending tasks</p>
                )}
              </div>
            </div>

            {/* Column 2: In-Progress */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-850 mb-4 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">In-Progress</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold">{progressTasks.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {progressTasks.map(task => (
                  <div key={task._id} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{task.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-900/40 space-y-2 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><User size={11} /> {task.assignedTo?.name}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      {!isSupervisor && (
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'Completed')}
                          className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[9px] transition"
                        >
                          Submit to Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {progressTasks.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-6">No active works</p>
                )}
              </div>
            </div>

            {/* Column 3: Completed (Awaiting Grade) */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-850 mb-4 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Awaiting Grade</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold">{completedTasks.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {completedTasks.map(task => (
                  <div key={task._id} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-3 shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-normal">{task.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{task.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-900/40 space-y-2 text-[10px]">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><User size={11} /> {task.assignedTo?.name}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                      {isSupervisor ? (
                        <button
                          onClick={() => openReviewModal(task)}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-505 text-white font-bold rounded-lg text-[9px] transition bg-amber-550 hover:bg-amber-500"
                        >
                          Rate & Close Task
                        </button>
                      ) : (
                        <div className="text-[9px] text-center italic text-amber-500 bg-amber-500/5 py-1 rounded border border-amber-500/10">
                          Awaiting Manager Review
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-6">No items completed yet</p>
                )}
              </div>
            </div>

            {/* Column 4: Reviewed */}
            <div className="p-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 rounded-2xl flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-850 mb-4 px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Closed / Reviewed</span>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-450 font-bold">{reviewedTasks.length}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                {reviewedTasks.map(task => (
                  <div key={task._id} className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-3 shadow-sm bg-emerald-500/5 dark:bg-emerald-500/5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-white leading-normal truncate max-w-[120px]">{task.title}</h4>
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black flex items-center gap-0.5">
                          {task.rating} <Star size={8} className="fill-emerald-650" />
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 line-clamp-2">{task.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-900/40 space-y-1 text-[9px] text-slate-500">
                      <p className="text-slate-800 dark:text-slate-350 italic pr-1 break-words"><MessageSquare size={10} className="inline mr-1" />"{task.feedback}"</p>
                      <div className="flex items-center justify-between pt-1 font-semibold">
                        <span>To: {task.assignedTo?.name}</span>
                        <span>By: {task.assignedBy?.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {reviewedTasks.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-6">No tasks closed</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 1: Assign Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Assign New Task</h2>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Design Landing Page"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Task Description</label>
                <textarea
                  required
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify task requirements, instructions, and deliverables details..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none resize-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Assign To</label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none cursor-pointer"
                >
                  <option value="">Choose Employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-850 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submitLoading ? 'Creating...' : 'Assign Duty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Review Task */}
      {isReviewModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
            <button onClick={() => setIsReviewModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Rate & Close Task</h2>
            <p className="text-[11px] text-slate-400 mb-6">Task: <span className="text-white font-bold">{selectedTask.title}</span></p>

            <form onSubmit={handleReviewTaskSubmit} className="space-y-4">
              {/* Ratings block (1-5 sliders) */}
              <div className="space-y-3 p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Performance Metrics (1 - 5 Scale)</span>

                <div className="flex items-center justify-between text-xs text-slate-350">
                  <span className="font-medium">Work Quality:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={ratingQuality} 
                      onChange={(e) => setRatingQuality(e.target.value)} 
                      className="w-24 accent-primary-500 h-1 bg-slate-800 rounded cursor-pointer" 
                    />
                    <span className="font-bold text-primary-400 w-4 text-right">{ratingQuality}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-350">
                  <span className="font-medium">Teamwork:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={ratingTeamwork} 
                      onChange={(e) => setRatingTeamwork(e.target.value)} 
                      className="w-24 accent-primary-500 h-1 bg-slate-800 rounded cursor-pointer" 
                    />
                    <span className="font-bold text-primary-400 w-4 text-right">{ratingTeamwork}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-350">
                  <span className="font-medium">Communication:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={ratingComm} 
                      onChange={(e) => setRatingComm(e.target.value)} 
                      className="w-24 accent-primary-500 h-1 bg-slate-800 rounded cursor-pointer" 
                    />
                    <span className="font-bold text-primary-400 w-4 text-right">{ratingComm}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-350">
                  <span className="font-medium">Productivity:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="5" 
                      value={ratingProductivity} 
                      onChange={(e) => setRatingProductivity(e.target.value)} 
                      className="w-24 accent-primary-500 h-1 bg-slate-800 rounded cursor-pointer" 
                    />
                    <span className="font-bold text-primary-400 w-4 text-right">{ratingProductivity}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Review Feedback</label>
                <textarea
                  required
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback on the quality, speed, communication and accuracy of this task output..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-xs outline-none resize-none transition"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-850 justify-end">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white rounded-xl text-xs font-semibold transition"
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Grade & Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
