import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  let token = null;
  
  // Determine if this is an admin request by checking the URL
  const isAdminRequest = config.url.includes('/admin/') || config.url.includes('/blog/admin/');
  
  if (isAdminRequest) {
    // For admin requests, prioritize admin token
    token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  } else {
    // For regular requests, prioritize user token
    token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  }
  
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
      console.log('🔍 Fetching current subscription...');
      const response = await api.get('/subscriptions/current');
      console.log('📡 Current subscription API response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        dataType: typeof response.data,
        dataLength: response.data?.length,
        isEmpty: !response.data || response.data === '' || response.data === null
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching current subscription:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  
  cancelSubscription: async () => {
    await api.post('/subscriptions/cancel');
  },
  
  hasActiveSubscription: async () => {
    try {
      console.log('🔍 Checking subscription status...');
      const response = await api.get('/subscriptions/status');
      console.log('📡 Subscription status API response:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error checking subscription status:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
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

export const adminApi = {
  login: async (data) => {
    const response = await api.post('/admin/login', data);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getSubscribers: async () => {
    const response = await api.get('/admin/users/subscribers');
    return response.data;
  },

  getNonSubscribers: async () => {
    const response = await api.get('/admin/users/non-subscribers');
    return response.data;
  },

  getFiles: async () => {
    const response = await api.get('/admin/files');
    return response.data;
  },

  uploadFile: async (formData) => {
    const response = await api.post('/admin/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (fileId) => {
    const response = await api.get(`/admin/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteFile: async (fileId) => {
    await api.delete(`/admin/files/${fileId}`);
  },
};

export const blogApi = {
  getPosts: async () => {
    const response = await api.get('/blog/posts');
    return response.data;
  },

  getPost: async (id) => {
    const response = await api.get(`/blog/posts/${id}`);
    return response.data;
  },

  admin: {
    getPosts: async () => {
      const response = await api.get('/blog/admin/posts');
      return response.data;
    },

    createPost: async (data) => {
      const response = await api.post('/blog/admin/posts', data);
      return response.data;
    },

    updatePost: async (id, data) => {
      const response = await api.put(`/blog/admin/posts/${id}`, data);
      return response.data;
    },

    deletePost: async (id) => {
      await api.delete(`/blog/admin/posts/${id}`);
    },

    publishPost: async (id) => {
      const response = await api.post(`/blog/admin/posts/${id}/publish`);
      return response.data;
    },

    unpublishPost: async (id) => {
      const response = await api.post(`/blog/admin/posts/${id}/unpublish`);
      return response.data;
    },
  },
};

export const fileApi = {
  getFiles: async () => {
    const response = await api.get('/files');
    return response.data;
  },

  downloadFile: async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;