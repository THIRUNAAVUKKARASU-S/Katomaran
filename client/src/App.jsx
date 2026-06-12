import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import LinkExpired from './pages/LinkExpired';
import NotFound from './pages/NotFound';
import PasswordGate from './pages/PasswordGate';
import PublicAnalytics from './pages/PublicAnalytics';
import Workspace from './pages/Workspace';
import APIKeys from './pages/APIKeys';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/* React Hot Toast configurations for alerts */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid rgba(255,255,255,0.05)',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Link State Pages */}
            <Route path="/expired" element={<LinkExpired />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/p/:shortCode" element={<PasswordGate />} />
            <Route path="/stats/:shortCode" element={<PublicAnalytics />} />

            {/* Private Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/analytics/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/workspaces" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Workspace />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/apikeys" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <APIKeys />
                  </Layout>
                </ProtectedRoute>
              } 
            />

            {/* Fallback routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
