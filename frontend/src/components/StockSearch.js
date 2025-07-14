import { useState } from 'react';
import { stockAPI } from '../services/api';

const StockSearch = ({ onStockSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = await stockAPI.searchStocks(searchQuery);
      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search stocks');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleStockClick = (stock) => {
    if (onStockSelect) {
      onStockSelect(stock);
    }
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search Results */}
      {(loading || results.length > 0 || error) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Searching...</span>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && !error && (
            <div className="px-4 py-3 text-center text-gray-500">
              No stocks found for "{query}"
            </div>
          )}

          {!loading && results.map((stock, index) => (
            <div
              key={index}
              onClick={() => handleStockClick(stock)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{stock.symbol}</div>
                  <div className="text-sm text-gray-600 truncate">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{stock.type}</div>
                  <div className="text-xs text-gray-400">{stock.region}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockSearch;
