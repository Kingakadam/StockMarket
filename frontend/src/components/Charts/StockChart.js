import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { stockChartOptions, colors } from './ChartConfig';
import { stockAPI } from '../../services/api';

const StockChart = ({ symbol, height = 400 }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState('5min');

  useEffect(() => {
    if (symbol) {
      fetchChartData();
    }
  }, [symbol, interval]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching chart data for ${symbol} with interval ${interval}`);

      // Try to get chart data from API
      const data = await stockAPI.getChartData(symbol, interval);

      if (data && data.length > 0) {
        console.log(`Received ${data.length} data points for ${symbol}`);

        const chartDataset = {
          labels: data.map(item => new Date(item.timestamp)),
          datasets: [
            {
              label: `${symbol} Price`,
              data: data.map(item => item.close),
              borderColor: colors.primary,
              backgroundColor: colors.primaryLight,
              borderWidth: 2,
              fill: true,
              tension: 0.1,
              pointRadius: 0,
              pointHoverRadius: 5,
            },
          ],
        };

        setChartData(chartDataset);
      } else {
        console.log(`No chart data received for ${symbol}, creating mock data`);
        // Create mock data for demonstration
        createMockChartData();
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      console.log(`Creating mock data for ${symbol} due to API error`);
      // Create mock data as fallback
      createMockChartData();
    } finally {
      setLoading(false);
    }
  };

  const createMockChartData = () => {
    // Create mock intraday data for demonstration
    const now = new Date();
    const mockData = [];

    // Generate 20 data points over the last 2 hours
    for (let i = 19; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 6 * 60 * 1000); // 6 minutes apart
      const basePrice = 150 + Math.random() * 50; // Random price between 150-200
      const price = basePrice + Math.sin(i * 0.5) * 10; // Add some wave pattern

      mockData.push({
        timestamp: timestamp.toISOString(),
        close: price
      });
    }

    const chartDataset = {
      labels: mockData.map(item => new Date(item.timestamp)),
      datasets: [
        {
          label: `${symbol} Price (Demo Data)`,
          data: mockData.map(item => item.close),
          borderColor: colors.primary,
          backgroundColor: colors.primaryLight,
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };

    setChartData(chartDataset);
    setError(null); // Clear error since we have mock data
  };

  const handleIntervalChange = (newInterval) => {
    setInterval(newInterval);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchChartData}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {symbol} Price Chart
        </h3>
        <div className="flex space-x-2">
          {['5min', '15min', '30min', '60min'].map((int) => (
            <button
              key={int}
              onClick={() => handleIntervalChange(int)}
              className={`px-3 py-1 text-sm rounded ${
                interval === int
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ height }}>
        <Line data={chartData} options={stockChartOptions} />
      </div>
    </div>
  );
};

export default StockChart;
