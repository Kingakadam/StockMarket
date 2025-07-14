const API_BASE_URL = 'http://localhost:5000/api';

// Get JWT token from localStorage
const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.token;
  }
  return null;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    return apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Get user profile
  getProfile: async () => {
    return apiCall('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get all users (admin)
  getAllUsers: async () => {
    return apiCall('/users/all');
  },

  // Get user statistics
  getUserStats: async () => {
    return apiCall('/users/stats');
  },

  // Delete user account
  deleteAccount: async () => {
    return apiCall('/users/account', {
      method: 'DELETE',
    });
  },
};

// Stock API calls
export const stockAPI = {
  // Get all stocks
  getStocks: async (refresh = false) => {
    return apiCall(`/stocks${refresh ? '?refresh=true' : ''}`);
  },

  // Get specific stock by symbol
  getStock: async (symbol) => {
    return apiCall(`/stocks/${symbol}`);
  },

  // Search stocks
  searchStocks: async (query) => {
    return apiCall(`/stocks/search?q=${encodeURIComponent(query)}`);
  },

  // Get chart data for a stock
  getChartData: async (symbol, interval = '5min') => {
    return apiCall(`/stocks/${symbol}/chart?interval=${interval}`);
  },
};

// Portfolio API calls
export const portfolioAPI = {
  // Get user portfolio
  getPortfolio: async (userId) => {
    return apiCall(`/portfolio/${userId}`);
  },

  // Buy stock
  buyStock: async (stockData) => {
    return apiCall('/portfolio/buy', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },

  // Sell stock
  sellStock: async (stockData) => {
    return apiCall('/portfolio/sell', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },
};

export default {
  authAPI,
  stockAPI,
  portfolioAPI,
};
