import { useState, useEffect } from 'react';
import { portfolioAPI, stockAPI } from '../services/api';

const Portfolio = ({ user }) => {
  const [portfolio, setPortfolio] = useState({ holdings: [], summary: {} });
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [transactionData, setTransactionData] = useState({ quantity: '', price: '' });

  useEffect(() => {
    if (user) {
      fetchPortfolio();
      fetchStocks();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const data = await portfolioAPI.getPortfolio(user.id);
      setPortfolio(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const stockData = await stockAPI.getStocks();
      setStocks(stockData);
    } catch (err) {
      console.error('Error fetching stocks:', err);
    }
  };

  const handleBuy = async () => {
    try {
      await portfolioAPI.buyStock({
        symbol: selectedStock.symbol,
        quantity: parseInt(transactionData.quantity),
        price: parseFloat(transactionData.price)
      });
      
      setShowBuyModal(false);
      setTransactionData({ quantity: '', price: '' });
      fetchPortfolio();
      alert('Stock purchased successfully!');
    } catch (error) {
      alert('Error buying stock: ' + error.message);
    }
  };

  const handleSell = async () => {
    try {
      await portfolioAPI.sellStock({
        symbol: selectedStock.symbol,
        quantity: parseInt(transactionData.quantity),
        price: parseFloat(transactionData.price)
      });
      
      setShowSellModal(false);
      setTransactionData({ quantity: '', price: '' });
      fetchPortfolio();
      alert('Stock sold successfully!');
    } catch (error) {
      alert('Error selling stock: ' + error.message);
    }
  };

  const openBuyModal = (stock) => {
    setSelectedStock(stock);
    setTransactionData({ quantity: '', price: stock.price.toString() });
    setShowBuyModal(true);
  };

  const openSellModal = (holding) => {
    const stock = stocks.find(s => s.symbol === holding.symbol);
    setSelectedStock({ ...holding, currentPrice: stock?.price || 0 });
    setTransactionData({ quantity: '', price: stock?.price.toString() || '' });
    setShowSellModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchPortfolio}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">${portfolio.summary.totalValue || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900">${portfolio.summary.totalInvested || '0.00'}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${
              parseFloat(portfolio.summary.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${portfolio.summary.totalGainLoss || '0.00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Gain/Loss %</p>
            <p className={`text-2xl font-bold ${
              parseFloat(portfolio.summary.totalGainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolio.summary.totalGainLossPercent || '0.00'}%
            </p>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Holdings</h2>
        </div>
        
        {portfolio.holdings.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No holdings yet. Start by buying some stocks!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.holdings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {holding.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {holding.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ${holding.averagePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ${holding.currentValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${holding.gainLoss.toFixed(2)} ({holding.gainLossPercent}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openSellModal(holding)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Stocks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Stocks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map((stock) => (
                <tr key={stock.symbol}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {stock.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {stock.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    ${stock.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openBuyModal(stock)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Buy {selectedStock?.symbol}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({...transactionData, quantity: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price per share</label>
                <input
                  type="number"
                  value={transactionData.price}
                  onChange={(e) => setTransactionData({...transactionData, price: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  step="0.01"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total: ${(parseFloat(transactionData.quantity || 0) * parseFloat(transactionData.price || 0)).toFixed(2)}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBuyModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!transactionData.quantity || !transactionData.price}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Sell {selectedStock?.symbol}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity (Available: {selectedStock?.quantity})
                </label>
                <input
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData({...transactionData, quantity: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  max={selectedStock?.quantity}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price per share</label>
                <input
                  type="number"
                  value={transactionData.price}
                  onChange={(e) => setTransactionData({...transactionData, price: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  step="0.01"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total: ${(parseFloat(transactionData.quantity || 0) * parseFloat(transactionData.price || 0)).toFixed(2)}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSellModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={!transactionData.quantity || !transactionData.price}
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
