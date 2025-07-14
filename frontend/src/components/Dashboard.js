import React, { useState, useEffect } from 'react';
import { stockAPI, portfolioAPI } from '../services/api';
import Portfolio from './Portfolio';
import StockSearch from './StockSearch';
import Analytics from './Analytics';
import MarketChart from './Charts/MarketChart';
import io from 'socket.io-client';

const Dashboard = ({ onLogout }) => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolio, setPortfolio] = useState({ holdings: [], summary: {} });
  const [socket, setSocket] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Fetch stock data
    fetchStocks();

    // Initialize socket connection for real-time updates
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for stock updates
    newSocket.on('stockUpdate', (updatedStocks) => {
      setStockData(updatedStocks);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchStocks = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const stocks = await stockAPI.getStocks(refresh);
      setStockData(stocks);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const portfolioData = await portfolioAPI.getPortfolio(user.id);
      setPortfolio(portfolioData);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (socket) {
      socket.close();
    }
    onLogout();
  };

  const handleStockSelect = async (selectedStock) => {
    try {
      // Fetch detailed stock data
      const stockData = await stockAPI.getStock(selectedStock.symbol);

      // Add to our stock list if not already present
      const existingStock = stockData.find(stock => stock.symbol === selectedStock.symbol);
      if (!existingStock) {
        setStockData(prev => [...prev, stockData]);
      }

      // Switch to portfolio tab for trading
      setActiveTab('portfolio');
    } catch (error) {
      console.error('Error fetching selected stock:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Market Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome back{user ? `, ${user.firstName}` : ''}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' ? (
          <div>
        {/* Stock Search */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Stocks</h2>
            <StockSearch onStockSelect={handleStockSelect} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900">$24,567.89</p>
                <p className="text-sm text-green-600">+$1,234.56 (5.3%)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Gain/Loss</p>
                <p className="text-2xl font-semibold text-gray-900">+$456.78</p>
                <p className="text-sm text-green-600">+1.89%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Positions</p>
                <p className="text-2xl font-semibold text-gray-900">12</p>
                <p className="text-sm text-gray-500">Stocks & ETFs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Market Overview</h2>
                {lastUpdated && (
                  <p className="text-sm text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchStocks(true)}
                  disabled={refreshing}
                  className={`text-sm font-medium px-3 py-1 rounded ${
                    refreshing
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                  }`}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading stocks...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchStocks}
                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    High/Low
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockData.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{stock.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stock.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${stock.price?.toFixed(2) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.isPositive ? '+' : ''}{stock.change?.toFixed(2) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stock.isPositive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stock.changePercent || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="text-green-600">${stock.high?.toFixed(2) || 'N/A'}</div>
                        <div className="text-red-600">${stock.low?.toFixed(2) || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => setActiveTab('portfolio')}
                      >
                        Buy
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => setActiveTab('portfolio')}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Market Overview Chart */}
        <div className="mt-8">
          <MarketChart stocks={stockData} type="performance" height={300} />
        </div>
        </div>
        ) : activeTab === 'portfolio' ? (
          <Portfolio user={user} />
        ) : activeTab === 'analytics' ? (
          <Analytics user={user} stockData={stockData} />
        ) : null}
      </main>
    </div>
  );
};

export default Dashboard;
