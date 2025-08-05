import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data) => {
    console.log('Login request data:', data);
    try {
      const response = await api.post('/auth/login', data);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error.response?.data);
      throw error;
    }
  },
  
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

export const subscriptionApi = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
  
  createCheckoutSession: async (data) => {
    const response = await api.post('/subscriptions/create-checkout-session', data);
    return response.data;
  },
  
  createSubscription: async (data) => {
    const response = await api.post('/subscriptions/create', data);
    return response.data;
  },
  
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/subscriptions/current');
      console.log('Current subscription response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  },
  
  cancelSubscription: async () => {
    await api.post('/subscriptions/cancel');
  },
  
  hasActiveSubscription: async () => {
    const response = await api.get('/subscriptions/status');
    return response.data;
  },
};

export const stockPickApi = {
  getStockPicks: async () => {
    const response = await api.get('/stock-picks');
    return response.data;
  },
  
  getRecentStockPicks: async (limit = 10) => {
    const response = await api.get(`/stock-picks/recent?limit=${limit}`);
    return response.data;
  },
  
  syncFromGoogleSheets: async () => {
    const response = await api.post('/stock-picks/sync');
    return response.data;
  },

  getChartData: async (symbol, period = '1mo') => {
    const response = await api.get(`/stock-picks/${symbol}/chart-data?period=${period}`);
    return response.data;
  },

  getStockQuote: async (symbol) => {
    const response = await api.get(`/stock-picks/${symbol}/quote`);
    return response.data;
  },

  getBatchChartData: async (symbols, period = '1mo') => {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const response = await api.get(`/stock-picks/charts/batch?symbols=${symbolsParam}&period=${period}`);
    return response.data;
  },
};

export const contactApi = {
  submitContactForm: async (data) => {
    await api.post('/contact/submit', data);
  },
};

export default api;