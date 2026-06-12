import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Load User Profile on mount/token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/api/user/profile');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user profile', err);
        // If profile fetch fails due to invalid token, clear token
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  // Register User
  const signup = async (name, email, password, confirmPassword) => {
    try {
      const res = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        confirmPassword
      });
      const { token: userToken, user: userData } = res.data;
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      };
    }
  };

  const [activeWorkspace, setActiveWorkspace] = useState(null);

  // Logout User
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setActiveWorkspace(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, activeWorkspace, setActiveWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
