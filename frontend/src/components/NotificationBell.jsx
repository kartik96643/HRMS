import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Calendar, 
  Search, 
  LineChart, 
  UserPlus, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const timer = setInterval(fetchNotifications, 30000);
      return () => clearInterval(timer);
    }
  }, [user]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type) => {
    switch (type) {
      case 'LeaveRequest':
        return <Calendar className="text-amber-500" size={14} />;
      case 'JobApplication':
        return <Search className="text-primary-500" size={14} />;
      case 'PerformanceReview':
        return <LineChart className="text-purple-500" size={14} />;
      default:
        return <UserPlus className="text-emerald-500" size={14} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-slate-450 hover:bg-slate-800/60 hover:text-white transition relative text-slate-400"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-650 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass rounded-2xl border border-slate-800 shadow-2xl py-2 z-50 text-left">
          <div className="px-4 py-2 border-b border-slate-850 flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-primary-400 font-bold text-[10px]">{unreadCount} unread</span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-850">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n._id}
                  onClick={(e) => !n.isRead && handleMarkRead(n._id, e)}
                  className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-slate-850/40 transition-colors ${
                    !n.isRead ? 'bg-primary-500/5' : ''
                  }`}
                >
                  <div className="w-7 h-7 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="text-xs text-slate-200 leading-normal font-medium pr-4 break-words">
                      {n.message}
                    </p>
                    <span className="text-[9px] text-slate-500 block">
                      {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={(e) => handleMarkRead(n._id, e)}
                      className="text-slate-500 hover:text-white flex-shrink-0 self-center"
                      title="Mark as Read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-xs text-slate-500 font-medium">
                <AlertCircle size={24} className="mx-auto mb-2 text-slate-600" />
                No notifications received yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
