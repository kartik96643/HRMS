import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  FileSpreadsheet,
  Download,
  Search,
  UserCheck
} from 'lucide-react';

const Attendance = () => {
  const { user, isAdmin, isHR } = useAuth();
  
  // Shared / Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' or 'organization'

  // Personal Timesheet states
  const [myLogs, setMyLogs] = useState([]);
  const [summary, setSummary] = useState({ present: 0, late: 0, totalCheckedIn: 0 });
  const [todayRecord, setTodayRecord] = useState(null);

  // Organization Reports states (Admin/HR)
  const [orgLogs, setOrgLogs] = useState([]);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [reportSearch, setReportSearch] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Month array for selection
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Year list
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const fetchPersonalLogs = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        api.get('/attendance/my-attendance'),
        api.get('/attendance/summary')
      ]);
      setMyLogs(logsRes.data);
      setSummary(summaryRes.data);

      // Check if checked in today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRec = logsRes.data.find(r => r.date === todayStr);
      setTodayRecord(todayRec || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load personal attendance records.');
    }
  };

  const fetchOrgReports = async () => {
    setReportLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/attendance/reports?month=${filterMonth}&year=${filterYear}`);
      setOrgLogs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch organization attendance reports.');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchPersonalLogs();
      if (isAdmin || isHR) {
        await fetchOrgReports();
        setActiveTab('organization'); // Default to reports for HR/Admin
      }
      setLoading(false);
    };

    initData();
  }, [isAdmin, isHR]);

  const handleCheckIn = async () => {
    try {
      const { data } = await api.post('/attendance/check-in');
      setTodayRecord(data);
      fetchPersonalLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const { data } = await api.post('/attendance/check-out');
      setTodayRecord(data);
      fetchPersonalLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchOrgReports();
  };

  // Filter organization logs by search
  const filteredOrgLogs = orgLogs.filter(log => {
    const nameMatch = log.employee?.name?.toLowerCase().includes(reportSearch.toLowerCase());
    const emailMatch = log.employee?.email?.toLowerCase().includes(reportSearch.toLowerCase());
    const positionMatch = log.employee?.position?.toLowerCase().includes(reportSearch.toLowerCase());
    return nameMatch || emailMatch || positionMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Attendance Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor check-ins, check-outs, and timesheets.</p>
        </div>

        {/* Tab Selector */}
        {(isAdmin || isHR) && (
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl self-start sm:self-center">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'personal' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Timesheet
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'organization' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Organization Reports
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
          <p className="mt-4 text-slate-400 text-sm">Loading attendance dashboards...</p>
        </div>
      ) : (
        <>
          {/* PERSONAL TIMESHEET TAB */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Check-In Console Widget */}
              <div className="glass-card p-6 rounded-2xl border border-slate-800/40 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="text-primary-500 animate-pulse" size={18} /> Attendance Console
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Clock-in when you start work, clock-out when you finish.</p>
                </div>

                <div className="py-8 border-y border-slate-800/40 text-center">
                  {todayRecord ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                        <CheckCircle size={14} /> Checked-In Today
                      </div>
                      <div className="text-slate-300 text-sm space-y-2 font-medium">
                        <p>Checked In: <span className="text-white font-bold">{new Date(todayRecord.checkIn).toLocaleTimeString()}</span></p>
                        {todayRecord.checkOut ? (
                          <p>Checked Out: <span className="text-white font-bold">{new Date(todayRecord.checkOut).toLocaleTimeString()}</span></p>
                        ) : (
                          <p className="text-xs text-slate-500">Currently active on duty</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 font-medium">You have not clocked in for today yet.</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    disabled={!!todayRecord}
                    onClick={handleCheckIn}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-sm text-white rounded-xl transition duration-150"
                  >
                    Check In
                  </button>
                  <button
                    disabled={!todayRecord || !!todayRecord.checkOut}
                    onClick={handleCheckOut}
                    className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 font-bold text-sm text-white rounded-xl transition duration-150"
                  >
                    Check Out
                  </button>
                </div>
              </div>

              {/* Monthly Stats Summary */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Stat 1 */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800/40 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Check-Ins</span>
                    <h3 className="text-3xl font-extrabold text-white mt-2">{summary.totalCheckedIn}</h3>
                    <span className="text-[10px] text-slate-500 block mt-1">This month</span>
                  </div>
                  {/* Stat 2 */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800/40 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Present Days</span>
                    <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{summary.present}</h3>
                    <span className="text-[10px] text-slate-500 block mt-1">On-time logs</span>
                  </div>
                  {/* Stat 3 */}
                  <div className="glass-card p-6 rounded-2xl border border-slate-800/40 text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Late Days</span>
                    <h3 className="text-3xl font-extrabold text-amber-400 mt-2">{summary.late}</h3>
                    <span className="text-[10px] text-slate-500 block mt-1">After 9:00 AM</span>
                  </div>
                </div>

                {/* Personal Logs Table */}
                <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Your Timesheet Logs</h3>
                    <span className="text-xs text-slate-400">Showing all records</span>
                  </div>
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300">
                      <thead className="bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Check-In</th>
                          <th className="px-6 py-3">Check-Out</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {myLogs.length > 0 ? (
                          myLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-800/10">
                              <td className="px-6 py-3 font-semibold text-white">
                                {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </td>
                              <td className="px-6 py-3 text-slate-300">
                                {new Date(log.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-3 text-slate-300">
                                {log.checkOut 
                                  ? new Date(log.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                                  : <span className="text-slate-500 italic">Not checked out</span>}
                              </td>
                              <td className="px-6 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  log.status === 'Present' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-slate-500">
                              No attendance history logged.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ORGANIZATION REPORTS TAB (Admin/HR only) */}
          {activeTab === 'organization' && (
            <div className="space-y-6">
              
              {/* Report Query Controls */}
              <div className="glass p-5 rounded-2xl border border-slate-800/60 flex flex-col md:flex-row gap-4 items-end">
                <form onSubmit={handleFilterSubmit} className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {/* Select Month */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Month</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none cursor-pointer"
                    >
                      {months.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Year */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2 px-3 text-white text-sm outline-none cursor-pointer"
                    >
                      {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={reportLoading}
                      className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-700/60 text-white font-semibold text-sm rounded-xl transition duration-200"
                    >
                      {reportLoading ? 'Loading...' : 'Generate Report'}
                    </button>
                  </div>
                </form>

                {/* Filter report search */}
                <div className="relative w-full md:w-[250px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search employee name..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-primary-500 rounded-xl py-2 pl-9 pr-4 text-white text-sm outline-none transition"
                  />
                </div>
              </div>

              {/* Organization Reports Table */}
              <div className="glass rounded-2xl border border-slate-800/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="text-primary-500" size={18} /> 
                    Timesheet Report: {months.find(m => m.value === filterMonth)?.label} {filterYear}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Total Logs: <span className="text-white font-bold">{filteredOrgLogs.length}</span></span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Check-In</th>
                        <th className="px-6 py-4">Check-Out</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-transparent">
                      {reportLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-12">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <span className="text-xs text-slate-400">Compiling report data...</span>
                          </td>
                        </tr>
                      ) : filteredOrgLogs.length > 0 ? (
                        filteredOrgLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-slate-800/10">
                            {/* Employee */}
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{log.employee?.name || 'Unknown'}</div>
                              <div className="text-xs text-slate-400">{log.employee?.position} • {log.employee?.email}</div>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 text-white font-medium">
                              {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>

                            {/* Check In */}
                            <td className="px-6 py-4 text-slate-300">
                              {new Date(log.checkIn).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </td>

                            {/* Check Out */}
                            <td className="px-6 py-4 text-slate-300">
                              {log.checkOut 
                                ? new Date(log.checkOut).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                                : <span className="text-slate-500 italic">Active</span>}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                log.status === 'Present' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-12 text-slate-500">
                            No logs found for this query.
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

    </div>
  );
};

export default Attendance;
