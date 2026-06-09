import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  User, 
  LogOut,
  Building,
  Menu,
  X,
  Briefcase,
  LineChart
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'HR', 'Employee'],
    },
    {
      to: '/employees',
      label: 'Employees',
      icon: Users,
      roles: ['Admin', 'HR'],
    },
    {
      to: '/recruitment',
      label: 'Recruitment',
      icon: Briefcase,
      roles: ['Admin', 'HR', 'Employee'],
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: Clock,
      roles: ['Admin', 'HR', 'Employee'],
    },
    {
      to: '/leaves',
      label: 'Leaves',
      icon: CalendarDays,
      roles: ['Admin', 'HR', 'Employee'],
    },
    {
      to: '/performance',
      label: 'Performance',
      icon: LineChart,
      roles: ['Admin', 'HR', 'Employee'],
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: User,
      roles: ['Admin', 'HR', 'Employee'],
    },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 glass border-r border-slate-200/80 dark:border-slate-800/80 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-600/30">
              <Building size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-850 dark:text-white tracking-wide">PulseHR</h1>
              <span className="text-[10px] text-primary-500 dark:text-primary-400 font-bold tracking-wider uppercase">{user?.role} Portal</span>
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Quick Info */}
        <div className="p-6 border-b border-slate-250 dark:border-slate-800/40 flex items-center gap-3">
          <img 
            src={user?.profileImage} 
            alt={user?.name} 
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.position || 'Staff'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition duration-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
