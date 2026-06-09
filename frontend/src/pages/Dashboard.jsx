import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Users, 
  Calendar, 
  Clock, 
  Briefcase, 
  UserCheck, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, isAdmin, isHR } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    departmentsCount: 0,
    todayCheckins: 0
  });
  const [empSummary, setEmpSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    totalCheckedIn: 0
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Clock state for real-time display
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        if (isAdmin || isHR) {
          // Fetch HR/Admin Stats
          const [usersRes, leavesRes, deptsRes, attendanceRes] = await Promise.all([
            api.get('/users'),
            api.get('/leaves'),
            api.get('/departments'),
            api.get(`/attendance/reports?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`)
          ]);

          const pending = leavesRes.data.filter(l => l.status === 'Pending').length;
          
          // Count today's checkins
          const todayStr = new Date().toISOString().split('T')[0];
          const todayRecords = attendanceRes.data.filter(r => r.date === todayStr);

          setStats({
            totalEmployees: usersRes.data.length,
            pendingLeaves: pending,
            departmentsCount: deptsRes.data.length,
            todayCheckins: todayRecords.length
          });
        } else {
          // Fetch Employee Stats
          const [summaryRes, attendanceRes] = await Promise.all([
            api.get('/attendance/summary'),
            api.get('/attendance/my-attendance')
          ]);

          setEmpSummary(summaryRes.data);

          // Find today's record if any
          const todayStr = new Date().toISOString().split('T')[0];
          const todayRecord = attendanceRes.data.find(r => r.date === todayStr);
          setTodayAttendance(todayRecord || null);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
        setError('Unable to load full dashboard metrics. Please verify backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, isHR]);

  const handleCheckIn = async () => {
    try {
      const { data } = await api.post('/attendance/check-in');
      setTodayAttendance(data);
      // Refresh summary
      const summaryRes = await api.get('/attendance/summary');
      setEmpSummary(summaryRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const { data } = await api.post('/attendance/check-out');
      setTodayAttendance(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-slate-800/60">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Welcome back, {user?.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {user?.position} • {user?.department?.name || 'Operations'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-2xl font-bold text-primary-400 tracking-wider">
              {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-xl flex items-center gap-3">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading dashboard analytics...</p>
        </div>
      ) : (
        <>
          {/* Admin / HR Metrics Grid */}
          {(isAdmin || isHR) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Employees */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-slate-800/40 relative overflow-hidden group hover:border-primary-500/30 transition duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Employees</span>
                  <h3 className="text-3xl font-extrabold text-white">{stats.totalEmployees}</h3>
                  <Link to="/employees" className="text-xs text-primary-400 flex items-center gap-1 group-hover:text-primary-300 transition-colors">
                    Manage list <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-400">
                  <Users size={22} />
                </div>
              </div>

              {/* Card 2: Pending Leaves */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-slate-800/40 relative overflow-hidden group hover:border-amber-500/30 transition duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Leaves</span>
                  <h3 className="text-3xl font-extrabold text-white">{stats.pendingLeaves}</h3>
                  <Link to="/leaves" className="text-xs text-amber-400 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                    Review applications <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  <Calendar size={22} />
                </div>
              </div>

              {/* Card 3: Today's Checkins */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-slate-800/40 relative overflow-hidden group hover:border-emerald-500/30 transition duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clocked-In Today</span>
                  <h3 className="text-3xl font-extrabold text-white">{stats.todayCheckins}</h3>
                  <Link to="/attendance" className="text-xs text-emerald-400 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
                    View reports <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                  <UserCheck size={22} />
                </div>
              </div>

              {/* Card 4: Departments */}
              <div className="glass-card p-6 rounded-2xl flex items-center justify-between border border-slate-800/40 relative overflow-hidden group hover:border-indigo-500/30 transition duration-300">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departments</span>
                  <h3 className="text-3xl font-extrabold text-white">{stats.departmentsCount}</h3>
                  <Link to="/employees" className="text-xs text-indigo-400 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                    View organization <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Briefcase size={22} />
                </div>
              </div>
            </div>
          )}

          {/* Employee Metrics Grid */}
          {(!isAdmin && !isHR) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Check-In/Check-Out Action Panel */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="text-primary-500" size={18} /> Attendance Console
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Log your start and end times for work records.</p>
                </div>

                <div className="py-6 flex flex-col items-center justify-center border-y border-slate-800/40">
                  {todayAttendance ? (
                    <div className="text-center space-y-4">
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                        Clocked In Today
                      </div>
                      <div className="text-slate-300 text-xs space-y-1">
                        <p>Check-In: <span className="text-white font-bold">{new Date(todayAttendance.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></p>
                        {todayAttendance.checkOut && (
                          <p>Check-Out: <span className="text-white font-bold">{new Date(todayAttendance.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400">You haven't checked in yet today.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    disabled={!!todayAttendance}
                    onClick={handleCheckIn}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-sm text-white rounded-xl shadow-lg shadow-emerald-600/10 disabled:shadow-none transition duration-200"
                  >
                    Check In
                  </button>
                  <button
                    disabled={!todayAttendance || !!todayAttendance.checkOut}
                    onClick={handleCheckOut}
                    className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-sm text-white rounded-xl shadow-lg shadow-amber-600/10 disabled:shadow-none transition duration-200"
                  >
                    Check Out
                  </button>
                </div>
              </div>

              {/* Monthly Summary Stats Card */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800/40 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={18} /> Monthly Records
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Summary for {time.toLocaleString(undefined, { month: 'long' })} {time.getFullYear()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 font-medium block">Present</span>
                    <span className="text-2xl font-black text-emerald-400 block mt-1">{empSummary.present}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 font-medium block">Late</span>
                    <span className="text-2xl font-black text-amber-400 block mt-1">{empSummary.late}</span>
                  </div>
                </div>

                <Link
                  to="/attendance"
                  className="w-full text-center py-3 bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white rounded-xl transition duration-200"
                >
                  View Full Attendance Sheets
                </Link>
              </div>

              {/* Quick Leave Requests panel */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800/40 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="text-amber-500" size={18} /> Leave Status
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Need time off? Request leaves easily.</p>
                </div>

                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <Calendar size={32} className="text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400">Keep track of your sick, annual, and casual leaves.</p>
                </div>

                <Link
                  to="/leaves"
                  className="w-full text-center py-3 bg-primary-600 hover:bg-primary-500 text-xs font-semibold text-white rounded-xl shadow-lg shadow-primary-600/10 transition duration-200"
                >
                  Apply For Leave
                </Link>
              </div>
            </div>
          )}

          {/* General Quick Links and Portal Actions */}
          <div className="glass p-6 rounded-2xl border border-slate-800/60">
            <h3 className="text-base font-bold text-slate-200 mb-4">Portal Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/profile" className="p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700 rounded-xl text-center transition">
                <span className="text-xs font-bold text-slate-300 block">Edit Profile Photo</span>
              </Link>
              <Link to="/attendance" className="p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700 rounded-xl text-center transition">
                <span className="text-xs font-bold text-slate-300 block">View Timesheet Logs</span>
              </Link>
              <Link to="/leaves" className="p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700 rounded-xl text-center transition">
                <span className="text-xs font-bold text-slate-300 block">Leave Applications</span>
              </Link>
              {(isAdmin || isHR) && (
                <Link to="/employees" className="p-4 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700 rounded-xl text-center transition">
                  <span className="text-xs font-bold text-slate-300 block">Add New Staff</span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
