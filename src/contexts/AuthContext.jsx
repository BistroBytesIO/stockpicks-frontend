import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, subscriptionApi } from '../services/api';

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
  const fetchSubscription = async (forceRefresh = false) => {
    if (!token) {
      console.log('🔒 No token available, skipping subscription fetch');
      return;
    }
    
    console.log('🔄 Fetching subscription status...', { forceRefresh });
    
    try {
      // First try to get current subscription details
      try {
        const subscriptionData = await subscriptionApi.getCurrentSubscription();
        
        console.log('🔍 Processing subscription data:', {
          subscriptionData,
          dataType: typeof subscriptionData,
          isNull: subscriptionData === null,
          isUndefined: subscriptionData === undefined,
          isEmpty: subscriptionData === '',
          isEmptyObject: subscriptionData && typeof subscriptionData === 'object' && Object.keys(subscriptionData).length === 0
        });
        
        // Check if response is null, undefined, empty string, or empty object
        if (!subscriptionData || 
            subscriptionData === '' || 
            (typeof subscriptionData === 'object' && Object.keys(subscriptionData).length === 0) ||
            (typeof subscriptionData === 'string' && subscriptionData.includes('No active subscription'))) {
          
          console.log('❌ No subscription data found, trying fallback status check...');
          
          // Fallback: check subscription status
          try {
            const hasActive = await subscriptionApi.hasActiveSubscription();
            console.log('📊 Subscription status check result:', hasActive);
            
            if (hasActive) {
              console.log('✅ User has active subscription (fallback)');
              setSubscription({ status: 'ACTIVE' });
              localStorage.setItem('subscription', JSON.stringify({ status: 'ACTIVE' }));
            } else {
              console.log('❌ No active subscription found');
              setSubscription(null);
              localStorage.removeItem('subscription');
            }
          } catch (statusError) {
            console.error('❌ Status check failed:', statusError);
            setSubscription(null);
            localStorage.removeItem('subscription');
          }
        } else {
          console.log('✅ Subscription data received:', subscriptionData);
          setSubscription(subscriptionData);
          localStorage.setItem('subscription', JSON.stringify(subscriptionData));
        }
      } catch (error) {
        console.error('❌ Current subscription API failed:', error);
        
        // Fallback: check subscription status
        try {
          const hasActive = await subscriptionApi.hasActiveSubscription();
          console.log('📊 Fallback status check result:', hasActive);
          
          if (hasActive) {
            console.log('✅ User has active subscription (fallback after error)');
            setSubscription({ status: 'ACTIVE' });
            localStorage.setItem('subscription', JSON.stringify({ status: 'ACTIVE' }));
          } else {
            console.log('❌ No active subscription found (fallback)');
            setSubscription(null);
            localStorage.removeItem('subscription');
          }
        } catch (statusError) {
          console.error('❌ Both subscription APIs failed:', statusError);
          setSubscription(null);
          localStorage.removeItem('subscription');
        }
      }
    } catch (error) {
      console.error('❌ General error fetching subscription:', error);
      setSubscription(null);
      localStorage.removeItem('subscription');
    }
  };

  // Fetch subscription when user logs in
  useEffect(() => {
    if (user && token && !loading) {
      fetchSubscription();
    }
  }, [user, token, loading]);

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

  // Debug logging
  console.log('AuthContext state:', {
    user: !!user,
    token: !!token,
    subscription,
    hasActiveSubscription: subscription?.status === 'ACTIVE',
    loading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};