const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Enhanced error handling
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Improved token management
const getAuthToken = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).token : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Enhanced API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    method: 'GET', // default method
    headers: defaultHeaders,
    credentials: 'include', // for cookies if using them
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Handle request body
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = { error: response.statusText };
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new APIError(
        data.message || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    throw error;
  }
};

// Auth API with better structure
export const authAPI = {
  register: async ({ firstName, lastName, email, password }) => {
    return apiCall('/users/register', {
      method: 'POST',
      body: { firstName, lastName, email, password },
    });
  },

  login: async ({ email, password }) => {
    return apiCall('/users/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getProfile: async () => apiCall('/users/profile'),
  updateProfile: async (profileData) => apiCall('/users/profile', { method: 'PUT', body: profileData }),
  deleteAccount: async () => apiCall('/users/account', { method: 'DELETE' }),
};

// Stock API
export const stockAPI = {
  getStocks: (refresh = false) => apiCall(`/stocks${refresh ? '?refresh=true' : ''}`),
  getStock: (symbol) => apiCall(`/stocks/${symbol}`),
  searchStocks: (query) => apiCall(`/stocks/search?q=${encodeURIComponent(query)}`),
  getChartData: (symbol, interval = '5min') => apiCall(`/stocks/${symbol}/chart?interval=${interval}`),
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: (userId) => apiCall(`/portfolio/${userId}`),
  buyStock: (stockData) => apiCall('/portfolio/buy', { method: 'POST', body: stockData }),
  sellStock: (stockData) => apiCall('/portfolio/sell', { method: 'POST', body: stockData }),
};

export default { authAPI, stockAPI, portfolioAPI };