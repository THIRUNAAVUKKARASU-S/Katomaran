import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative flex flex-col items-center">
          {/* Animated Spinner */}
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          {/* Glowing backgound pulse */}
          <div className="absolute w-20 h-20 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <span className="mt-4 text-sm font-medium tracking-wider text-slate-500 dark:text-slate-400">
            Loading LinkLite...
          </span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
