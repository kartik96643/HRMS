import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  User, 
  Plus, 
  Edit, 
  X, 
  Upload, 
  Search, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';

const Recruitment = () => {
  const { user, isAdmin, isHR } = useAuth();
  const isManager = isAdmin || isHR;

  // State arrays
  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Panels
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Job Form States
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobDept, setJobDept] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLoc, setJobLoc] = useState('Remote');
  const [jobType, setJobType] = useState('Full-time');
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  // Application Form States
  const [applyJobId, setApplyJobId] = useState('');
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candNotes, setCandNotes] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreview, setResumePreview] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');

  // Kanban Pipeline Stages
  const pipelineStages = ['Applied', 'Screening', 'Interview', 'Offered', 'Hired', 'Rejected'];

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsRes, deptsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/departments')
      ]);
      setJobs(jobsRes.data);
      setDepartments(deptsRes.data);
      
      // Default to first open job if available
      const openJobs = jobsRes.data.filter(j => j.status === 'Open');
      if (openJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(openJobs[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch job data from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (jobId) => {
    if (!jobId) return;
    try {
      const { data } = await api.get(`/candidates/job/${jobId}`);
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load candidate applications', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedJobId && isManager) {
      fetchCandidates(selectedJobId);
    }
  }, [selectedJobId, isManager]);

  const resetJobForm = () => {
    setJobTitle('');
    setJobDesc('');
    setJobDept('');
    setJobReqs('');
    setJobSalary('');
    setJobLoc('Remote');
    setJobType('Full-time');
    setEditingJobId(null);
  };

  const openCreateJobModal = () => {
    resetJobForm();
    setIsJobModalOpen(true);
  };

  const openEditJobModal = (job) => {
    setJobTitle(job.title);
    setJobDesc(job.description);
    setJobDept(job.department?._id || '');
    setJobReqs(job.requirements.join(', '));
    setJobSalary(job.salaryRange || '');
    setJobLoc(job.location || 'Remote');
    setJobType(job.type || 'Full-time');
    setEditingJobId(job._id);
    setIsJobModalOpen(true);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc || !jobDept) return;

    setJobLoading(true);
    try {
      const payload = {
        title: jobTitle,
        description: jobDesc,
        department: jobDept,
        requirements: jobReqs,
        salaryRange: jobSalary,
        location: jobLoc,
        type: jobType
      };

      if (editingJobId) {
        await api.put(`/jobs/${editingJobId}`, payload);
      } else {
        await api.post('/jobs', payload);
      }
      setIsJobModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save job opening');
    } finally {
      setJobLoading(false);
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
    if (window.confirm(`Are you sure you want to change the job status to ${newStatus}?`)) {
      try {
        await api.put(`/jobs/${job._id}`, { status: newStatus });
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to toggle status');
      }
    }
  };

  const openApplyModal = (jobId) => {
    setApplyJobId(jobId);
    setCandName('');
    setCandEmail('');
    setCandPhone('');
    setCandNotes('');
    setResumeFile(null);
    setResumePreview('');
    setApplySuccess('');
    setIsApplyModalOpen(true);
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumePreview(file.name);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplySuccess('');

    const formData = new FormData();
    formData.append('job', applyJobId);
    formData.append('name', candName);
    formData.append('email', candEmail);
    formData.append('phone', candPhone);
    formData.append('notes', candNotes);
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    try {
      await api.post('/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApplySuccess('Your job application has been submitted successfully! The AI systems are screening your profile.');
      setCandName('');
      setCandEmail('');
      setCandPhone('');
      setCandNotes('');
      setResumeFile(null);
      setResumePreview('');
      
      // If manager is viewing the same job, refresh lists
      if (isManager && applyJobId === selectedJobId) {
        fetchCandidates(selectedJobId);
      }
      setTimeout(() => {
        setIsApplyModalOpen(false);
        setApplySuccess('');
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleCandidateClick = (cand) => {
    setSelectedCandidate(cand);
    setIsCandidateModalOpen(true);
  };

  const handleUpdateCandidateStatus = async (status) => {
    try {
      const { data } = await api.put(`/candidates/${selectedCandidate._id}/status`, { status });
      // Update local state
      setCandidates(candidates.map(c => c._id === data._id ? data : c));
      setSelectedCandidate(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update candidate status');
    }
  };

  // Color picker helper for match score
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-red-400 border-red-500/20 bg-red-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Recruitment Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Manage jobs, review applicants, and view AI-matched profiles.</p>
        </div>
        {isManager && (
          <button
            onClick={openCreateJobModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-600/10 transition flex items-center gap-2"
          >
            <Plus size={16} /> Create Job Opening
          </button>
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
          <p className="mt-4 text-slate-400 text-sm">Loading recruitment portal...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT COLUMN: Open Job Openings (All users see this) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Job Postings</h3>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div 
                  key={job._id}
                  onClick={() => isManager && setSelectedJobId(job._id)}
                  className={`p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex flex-col justify-between ${
                    isManager && selectedJobId === job._id
                      ? 'bg-primary-500/5 border-primary-500/40 shadow-md'
                      : 'glass border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{job.department?.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        job.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700/60'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1.5">{job.title}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-2 font-medium">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {job.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/60">
                    <span className="text-[10px] text-primary-400 font-bold">{job.salaryRange || 'Competitive'}</span>
                    
                    {isManager ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => openEditJobModal(job)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => toggleJobStatus(job)}
                          className="px-1.5 py-0.5 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-white rounded transition"
                          title="Toggle Status"
                        >
                          Toggle
                        </button>
                      </div>
                    ) : (
                      job.status === 'Open' && (
                        <button
                          onClick={() => openApplyModal(job._id)}
                          className="px-2.5 py-1 bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold rounded-lg transition"
                        >
                          Apply Now
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-xs text-slate-500 italic pl-1">No job openings created.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Pipeline Kanban Board (HR/Admin only) */}
          <div className="lg:col-span-3">
            {isManager ? (
              <div className="space-y-6">
                
                {/* Active Job Meta */}
                {selectedJobId && (
                  <div className="glass p-5 rounded-2xl border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {jobs.find(j => j._id === selectedJobId)?.title} Applicants
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Requirements: {jobs.find(j => j._id === selectedJobId)?.requirements?.join(', ') || 'None'}
                      </p>
                    </div>
                    <button
                      onClick={() => openApplyModal(selectedJobId)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
                    >
                      Apply on behalf of candidate
                    </button>
                  </div>
                )}

                {/* Pipeline Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
                  {pipelineStages.map((stage) => {
                    const stageCandidates = candidates.filter(c => c.status === stage);
                    return (
                      <div key={stage} className="p-3 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-3 px-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stage}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-semibold">{stageCandidates.length}</span>
                        </div>

                        {/* Kanban Stage Cards */}
                        <div className="flex-1 space-y-2.5 overflow-y-auto">
                          {stageCandidates.map((cand) => (
                            <div 
                              key={cand._id}
                              onClick={() => handleCandidateClick(cand)}
                              className="p-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-left cursor-pointer transition duration-150 relative overflow-hidden group shadow-sm hover:shadow-md"
                            >
                              {/* Left score highlight bar */}
                              <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                                cand.aiMatch?.matchPercentage >= 80 ? 'bg-emerald-500' : cand.aiMatch?.matchPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}></div>
                              
                              <h5 className="text-xs font-bold text-slate-200 truncate pr-6 pl-1">{cand.name}</h5>
                              <p className="text-[9px] text-slate-500 truncate pl-1 mt-0.5">{cand.email}</p>
                              
                              <div className="flex items-center justify-between mt-3 pl-1 pt-2 border-t border-slate-900/60">
                                <span className={`text-[9px] px-1 rounded font-bold ${getScoreColor(cand.aiMatch?.matchPercentage)}`}>
                                  {cand.aiMatch?.matchPercentage}% Match
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              /* Non-Manager placeholder dashboard info */
              <div className="glass p-8 rounded-3xl border border-slate-800/60 text-center space-y-4 max-w-xl mx-auto mt-6">
                <Briefcase size={40} className="text-primary-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">PulseHR Internal Transfers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browse available job openings on the left side of the screen. If you meet the qualifications or wish to refer a external candidate, click "Apply Now" to submit candidate resumes directly to our HR team.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: Create/Edit Job */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <button onClick={() => setIsJobModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">
              {editingJobId ? 'Edit Job Opening' : 'Create Job Opening'}
            </h2>

            <form onSubmit={handleJobSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Department</label>
                  <select
                    value={jobDept}
                    onChange={(e) => setJobDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Location</label>
                  <input
                    type="text"
                    value={jobLoc}
                    onChange={(e) => setJobLoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Salary Range</label>
                  <input
                    type="text"
                    value={jobSalary}
                    placeholder="e.g. $80k - $100k"
                    onChange={(e) => setJobSalary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Requirements (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Git, HTML5"
                  value={jobReqs}
                  onChange={(e) => setJobReqs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2.5 px-3 text-white text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Description</label>
                <textarea
                  required
                  rows="4"
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none resize-none transition"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-850 justify-end">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={jobLoading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
                >
                  {jobLoading ? 'Saving...' : 'Save Opening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Apply Form */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
            <button onClick={() => setIsApplyModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Apply for Position</h2>
            <p className="text-xs text-slate-500 mb-6">
              Job: <span className="text-slate-350 font-bold">{jobs.find(j => j._id === applyJobId)?.title}</span>
            </p>

            {applySuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold rounded-xl leading-normal text-emerald-400">
                {applySuccess}
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none transition bg-slate-950"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Upload Resume File</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition">
                      <Upload size={13} /> Select File
                      <input 
                        type="file" 
                        required
                        accept=".pdf,.docx,.doc,.txt" 
                        onChange={handleResumeChange} 
                        className="hidden" 
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {resumePreview || 'No file selected'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Cover Notes</label>
                  <textarea
                    rows="3"
                    value={candNotes}
                    onChange={(e) => setCandNotes(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none resize-none transition bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  disabled={applyLoading}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-750 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-primary-600/15 flex items-center justify-center gap-2"
                >
                  {applyLoading ? 'Uploading...' : 'Submit Application'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Candidate AI Match Details */}
      {isCandidateModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left">
            <button onClick={() => setIsCandidateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={20} />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-5 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="text-primary-500" size={20} /> {selectedCandidate.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedCandidate.email} • {selectedCandidate.phone || 'No phone'}
                </p>
              </div>

              {/* Status pill controls */}
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Set Pipeline Status</span>
                <div className="flex flex-wrap gap-1">
                  {pipelineStages.map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateCandidateStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                        selectedCandidate.status === st 
                          ? 'bg-primary-600 text-white border-primary-500 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Details columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Side: Match Scoring */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={13} /> AI Candidate Match Score
                  </h3>
                  
                  {/* Gauge */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-sm border-4 ${
                      selectedCandidate.aiMatch?.matchPercentage >= 80 
                        ? 'border-emerald-500/30 text-emerald-400' 
                        : selectedCandidate.aiMatch?.matchPercentage >= 50 
                        ? 'border-amber-500/30 text-amber-400' 
                        : 'border-red-500/30 text-red-400'
                    }`}>
                      {selectedCandidate.aiMatch?.matchPercentage}%
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-white">Score Assessment</p>
                      <p className="text-[10px] text-slate-400 leading-normal pr-2">
                        {selectedCandidate.aiMatch?.candidateSummary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overlaps list */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">Matching Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedCandidate.aiMatch?.matchingSkills?.map((sk, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded text-[9px] font-semibold text-emerald-400">
                          {sk}
                        </span>
                      ))}
                      {selectedCandidate.aiMatch?.matchingSkills?.length === 0 && (
                        <span className="text-[10px] text-slate-500 italic">None identified</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="text-[10px] text-red-400 font-bold block mb-1">Missing Requirements</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedCandidate.aiMatch?.missingSkills?.map((sk, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-red-500/10 text-red-450 border border-red-500/20 rounded text-[9px] font-semibold text-red-400">
                          {sk}
                        </span>
                      ))}
                      {selectedCandidate.aiMatch?.missingSkills?.length === 0 && (
                        <span className="text-[10px] text-slate-500 italic">None missing</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Review Notes</span>
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed min-h-[60px]">
                    {selectedCandidate.notes || <span className="text-slate-500 italic">No notes provided</span>}
                  </div>
                </div>
              </div>

              {/* Right Side: Resume details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="text-primary-500" size={13} /> Extracted Resume Information
                  </h3>
                  
                  {/* File link */}
                  {selectedCandidate.resumeUrl && (
                    <a
                      href={selectedCandidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 hover:text-white rounded-lg border border-slate-700 transition"
                    >
                      <FileText size={12} /> View Uploaded Resume Document
                    </a>
                  )}

                  {/* Summary details list */}
                  <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Professional Experience</span>
                      <p className="text-slate-200 mt-1 font-medium">{selectedCandidate.extractedInfo?.experience}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Education & Studies</span>
                      <p className="text-slate-200 mt-1 font-medium">{selectedCandidate.extractedInfo?.education}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Certifications</span>
                      <p className="text-slate-200 mt-1 font-medium">
                        {selectedCandidate.extractedInfo?.certifications?.join(', ') || 'No certifications logged'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Technical Skill Registry</span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedCandidate.extractedInfo?.skills?.map((sk, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-medium border border-slate-700/40">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Recruitment;
