import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

let normalizedApiUrl;
if (rawApiUrl) {
  // Ensure /api suffix is present and clean
  const clean = rawApiUrl.replace(/\/+$/, '');
  normalizedApiUrl = clean.endsWith('/api') ? clean : `${clean}/api`;
} else {
  normalizedApiUrl = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://campusredressal-1.onrender.com/api';
}

export const API_URL = normalizedApiUrl;
export const BASE_URL = API_URL.replace(/\/api\/?$/, '');

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
      console.log(`[Auth] Attempting login to ${API_URL}/auth/login with ${email}`);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      console.error('[Auth] Login error details:', err.response || err);
      let msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' && !err.response.data.includes('<!DOCTYPE')
          ? err.response.data
          : null);

      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = `Cannot connect to backend server at ${API_URL}. Please ensure the server is active.`;
        } else if (err.response?.status === 400) {
          msg = 'Invalid email or password. Please check your credentials.';
        } else if (err.response?.status === 404) {
          msg = 'User not found. Please check your email or register an account.';
        } else {
          msg = err.message || 'Login failed. Please check your credentials.';
        }
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (name, email, password, studentId) => {
    setError(null);
    try {
      console.log(`[Auth] Attempting register to ${API_URL}/auth/register with ${email}`);
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, studentId });
      const { token, user: registeredUser } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      console.error('[Auth] Register error details:', err.response || err);
      let msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' && !err.response.data.includes('<!DOCTYPE')
          ? err.response.data
          : null);

      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = `Cannot connect to backend server at ${API_URL}. Please ensure the server is active.`;
        } else if (err.response?.status === 400) {
          msg = 'Registration error: Please verify your details or use an allowed email.';
        } else {
          msg = err.message || 'Registration failed. Please try again.';
        }
      }
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
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, API_URL, BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
