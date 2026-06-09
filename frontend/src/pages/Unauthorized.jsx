import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mb-6 animate-pulse">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Access Denied</h1>
      <p className="text-slate-400 max-w-md mb-8">
        You do not have the required permissions to access this page. Please contact your system administrator if you believe this is an error.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-primary-600/20"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
