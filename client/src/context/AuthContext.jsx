import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/chatApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('chat_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  useEffect(() => {
    const verifyStoredUser = async () => {
      if (token && token !== 'demo_token_xyz') {
        try {
          const res = await authApi.getCurrentUser();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('chat_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyStoredUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('chat_token', res.data.token);
        localStorage.setItem('chat_user', JSON.stringify(res.data.user));
        return { success: true };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return {
        success: false,
        message,
        remainingAttempts: err.response?.data?.remainingAttempts,
        lockUntil: err.response?.data?.lockUntil
      };
    }
  };

  const loginAsDemo = () => {
    const demoUser = {
      _id: 'demo_user_1',
      username: 'Alex Rivera',
      email: 'alex@example.com',
      about: 'Product Designer & Full-stack Engineer.',
      avatar: '',
      status: 'online'
    };
    setUser(demoUser);
    setToken('demo_token_xyz');
    localStorage.setItem('chat_user', JSON.stringify(demoUser));
    localStorage.setItem('chat_token', 'demo_token_xyz');
  };

  const register = async (username, email, password) => {
    setError(null);
    try {
      const res = await authApi.register({ username, email, password });
      return {
        success: true,
        message: res.data.message,
        otp: res.data.otp,
        email
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const verifyOtp = async (email, otp) => {
    setError(null);
    try {
      const res = await authApi.verifyOtp({ email, otp });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('chat_token', res.data.token);
        localStorage.setItem('chat_user', JSON.stringify(res.data.user));
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'OTP Verification failed';
      setError(message);
      return {
        success: false,
        message,
        remainingAttempts: err.response?.data?.remainingAttempts
      };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await authApi.resendOtp({ email });
      return {
        success: true,
        message: res.data.message,
        otp: res.data.otp
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      if (token && token !== 'demo_token_xyz') await authApi.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('chat_token');
      localStorage.removeItem('chat_user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('chat_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isDemo: token === 'demo_token_xyz',
        login,
        loginAsDemo,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
