import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedSubscription = localStorage.getItem('subscription');
    
    if (storedToken && storedUser && storedUser !== 'undefined') {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        if (storedSubscription && storedSubscription !== 'undefined') {
          setSubscription(JSON.parse(storedSubscription));
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('subscription');
      }
    }
    
    setLoading(false);
  }, []);

  // Function to fetch user's subscription status
  const fetchSubscription = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const subscriptionData = await response.json();
        setSubscription(subscriptionData);
        localStorage.setItem('subscription', JSON.stringify(subscriptionData));
      } else {
        setSubscription(null);
        localStorage.removeItem('subscription');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
      localStorage.removeItem('subscription');
    }
  };

  // Fetch subscription when user logs in
  useEffect(() => {
    if (user && token) {
      fetchSubscription();
    }
  }, [user, token]);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const user = { email: response.email, firstName: response.firstName };
      setToken(response.token);
      setUser(user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await authApi.register(data);
      const user = { email: response.email, firstName: response.firstName };
      setToken(response.token);
      setUser(user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSubscription(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('subscription');
  };

  const value = {
    user,
    token,
    subscription,
    login,
    register,
    logout,
    fetchSubscription,
    isAuthenticated: !!token,
    hasActiveSubscription: subscription?.status === 'ACTIVE',
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};