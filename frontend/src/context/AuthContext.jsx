import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default auth headers if token exists
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthHeader(token);
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data);
      } catch (err) {
        console.error('Error loading user from token', err);
        localStorage.removeItem('token');
        setAuthHeader(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password, studentId) => {
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, studentId });
      const { token, user: registeredUser } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
