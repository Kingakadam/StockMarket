import { useState, useEffect } from 'react';
import StockChart from './Charts/StockChart';
import PortfolioChart from './Charts/PortfolioChart';
import MarketChart from './Charts/MarketChart';
import { portfolioAPI } from '../services/api';

const Analytics = ({ user, stockData }) => {
  const [portfolio, setPortfolio] = useState({ holdings: [], summary: {} });
  const [selectedStock, setSelectedStock] = useState(null);
  const [activeChartType, setActiveChartType] = useState('market-performance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
    if (stockData && stockData.length > 0 && !selectedStock) {
      setSelectedStock(stockData[0].symbol);
      console.log('Selected default stock:', stockData[0].symbol);
    }
  }, [user, stockData, selectedStock]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const portfolioData = await portfolioAPI.getPortfolio(user.id);
      setPortfolio(portfolioData);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartTypes = [
    { id: 'market-performance', label: 'Market Performance', category: 'market' },
    { id: 'market-price', label: 'Price Comparison', category: 'market' },
    { id: 'market-volume', label: 'Trading Volume', category: 'market' },
    { id: 'market-range', label: 'Price Range', category: 'market' },
    { id: 'portfolio-composition', label: 'Portfolio Composition', category: 'portfolio' },
    { id: 'portfolio-gainloss', label: 'Gain/Loss Analysis', category: 'portfolio' },
    { id: 'portfolio-performance', label: 'Performance Analysis', category: 'portfolio' },
  ];

  const renderChart = () => {
    const [category, type] = activeChartType.split('-');
    
    if (category === 'market') {
      return (
        <MarketChart 
          stocks={stockData} 
          type={type}
          height={400}
        />
      );
    } else if (category === 'portfolio') {
      if (portfolio.holdings.length === 0) {
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No portfolio data available</p>
                <p className="text-sm text-gray-500">Start trading to see portfolio analytics</p>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <PortfolioChart 
          portfolio={portfolio} 
          type={type === 'composition' ? 'pie' : type}
          height={400}
        />
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {chartTypes.map((chart) => (
            <button
              key={chart.id}
              onClick={() => setActiveChartType(chart.id)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                activeChartType === chart.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {chart.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Chart */}
        <div className="lg:col-span-2">
          {renderChart()}
        </div>

        {/* Stock Price Chart */}
        <div className="space-y-6">
          {/* Stock Selector */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stock Price Chart</h3>
            <select
              value={selectedStock || ''}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a stock</option>
              {stockData.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Chart */}
          {selectedStock ? (
            <StockChart symbol={selectedStock} height={300} />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center h-72">
                <div className="text-center">
                  <p className="text-gray-600">Select a stock to view its chart</p>
                  <p className="text-sm text-gray-500 mt-2">Choose from the dropdown above</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Stocks</span>
                <span className="font-semibold">{stockData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gainers</span>
                <span className="font-semibold text-green-600">
                  {stockData.filter(stock => stock.isPositive).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Losers</span>
                <span className="font-semibold text-red-600">
                  {stockData.filter(stock => !stock.isPositive).length}
                </span>
              </div>
              {portfolio.summary && (
                <>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Value</span>
                    <span className="font-semibold">${portfolio.summary.totalValue || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Gain/Loss</span>
                    <span className={`font-semibold ${
                      parseFloat(portfolio.summary.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${portfolio.summary.totalGainLoss || '0.00'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market Performance Mini Chart */}
        <MarketChart 
          stocks={stockData} 
          type="performance"
          height={250}
        />

        {/* Portfolio Composition Mini Chart */}
        {portfolio.holdings.length > 0 ? (
          <PortfolioChart 
            portfolio={portfolio} 
            type="pie"
            height={250}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-gray-600">No portfolio data</p>
                <p className="text-sm text-gray-500 mt-2">Start trading to see charts</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stockData.slice(0, 6).map((stock) => (
            <div key={stock.symbol} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-900">{stock.symbol}</div>
              <div className="text-sm text-gray-600">${stock.price?.toFixed(2)}</div>
              <div className={`text-sm font-medium ${
                stock.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {stock.changePercent}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
