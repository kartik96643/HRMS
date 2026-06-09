import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import Landing from './pages/Landing';
import Recruitment from './pages/Recruitment';
import Performance from './pages/Performance';
import NotificationBell from './components/NotificationBell';
import { Menu, Sun, Moon } from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Navigation Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Content wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-slate-200/80 dark:border-slate-800/60 glass px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:text-slate-400 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden lg:block">PulseHR Cloud</h2>
          </div>

          <div className="flex items-center gap-5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/60 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 flex items-center justify-center"
              aria-label="Toggle theme"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun size={17} className="transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon size={17} className="transition-transform duration-300 rotate-0 hover:-rotate-12" />
              )}
            </button>

            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-850"
              />
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin', 'HR', 'Employee']} />}>
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/attendance" element={<Layout><Attendance /></Layout>} />
        <Route path="/leaves" element={<Layout><Leaves /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/recruitment" element={<Layout><Recruitment /></Layout>} />
        <Route path="/performance" element={<Layout><Performance /></Layout>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Admin', 'HR']} />}>
        <Route path="/employees" element={<Layout><Employees /></Layout>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
