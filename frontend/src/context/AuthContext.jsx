import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_URL = rawApiUrl || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
export const BASE_URL = API_URL.startsWith('/') ? '' : API_URL.replace(/\/api\/?$/, '');

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
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = `Cannot connect to backend server at ${API_URL}. Please ensure the server is active.`;
        } else {
          msg = 'Login failed. Please check your credentials.';
        }
      }
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
      let msg = err.response?.data?.message;
      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = `Cannot connect to backend server at ${API_URL}. Please ensure the server is active.`;
        } else {
          msg = 'Registration failed. Please try again.';
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
