import { Bar, Line } from 'react-chartjs-2';
import { marketOverviewOptions, commonOptions, colors } from './ChartConfig';

const MarketChart = ({ stocks, type = 'performance', height = 400 }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-600">No market data available</p>
        </div>
      </div>
    );
  }

  // Prepare data for performance chart
  const performanceData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [
      {
        label: 'Change (%)',
        data: stocks.map(stock => parseFloat(stock.changePercent?.replace('%', '') || 0)),
        backgroundColor: stocks.map(stock => 
          stock.isPositive ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: stocks.map(stock => 
          stock.isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for price comparison
  const priceData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [
      {
        label: 'Current Price ($)',
        data: stocks.map(stock => stock.price),
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for volume chart
  const volumeData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [
      {
        label: 'Volume',
        data: stocks.map(stock => stock.volume || 0),
        backgroundColor: colors.infoLight,
        borderColor: colors.info,
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for price range (high/low)
  const rangeData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [
      {
        label: 'High ($)',
        data: stocks.map(stock => stock.high || 0),
        backgroundColor: colors.successLight,
        borderColor: colors.success,
        borderWidth: 1,
      },
      {
        label: 'Low ($)',
        data: stocks.map(stock => stock.low || 0),
        backgroundColor: colors.dangerLight,
        borderColor: colors.danger,
        borderWidth: 1,
      },
    ],
  };

  const renderChart = () => {
    switch (type) {
      case 'performance':
        return (
          <Bar 
            data={performanceData} 
            options={{
              ...marketOverviewOptions,
              plugins: {
                ...marketOverviewOptions.plugins,
                title: {
                  display: true,
                  text: 'Market Performance Today',
                },
              },
            }} 
          />
        );
      case 'price':
        return (
          <Bar 
            data={priceData} 
            options={{
              ...marketOverviewOptions,
              plugins: {
                ...marketOverviewOptions.plugins,
                title: {
                  display: true,
                  text: 'Stock Price Comparison',
                },
              },
              scales: {
                ...marketOverviewOptions.scales,
                y: {
                  ...marketOverviewOptions.scales.y,
                  title: {
                    display: true,
                    text: 'Price ($)',
                  },
                },
              },
            }} 
          />
        );
      case 'volume':
        return (
          <Bar 
            data={volumeData} 
            options={{
              ...marketOverviewOptions,
              plugins: {
                ...marketOverviewOptions.plugins,
                title: {
                  display: true,
                  text: 'Trading Volume',
                },
              },
              scales: {
                ...marketOverviewOptions.scales,
                y: {
                  ...marketOverviewOptions.scales.y,
                  title: {
                    display: true,
                    text: 'Volume',
                  },
                  ticks: {
                    callback: function(value) {
                      if (value >= 1000000) {
                        return (value / 1000000).toFixed(1) + 'M';
                      } else if (value >= 1000) {
                        return (value / 1000).toFixed(1) + 'K';
                      }
                      return value;
                    },
                  },
                },
              },
            }} 
          />
        );
      case 'range':
        return (
          <Bar 
            data={rangeData} 
            options={{
              ...marketOverviewOptions,
              plugins: {
                ...marketOverviewOptions.plugins,
                title: {
                  display: true,
                  text: 'Daily Price Range (High/Low)',
                },
              },
              scales: {
                ...marketOverviewOptions.scales,
                y: {
                  ...marketOverviewOptions.scales.y,
                  title: {
                    display: true,
                    text: 'Price ($)',
                  },
                },
              },
            }} 
          />
        );
      default:
        return (
          <Bar data={performanceData} options={marketOverviewOptions} />
        );
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'performance':
        return 'Market Performance';
      case 'price':
        return 'Price Comparison';
      case 'volume':
        return 'Trading Volume';
      case 'range':
        return 'Price Range';
      default:
        return 'Market Overview';
    }
  };

  // Calculate market statistics
  const gainers = stocks.filter(stock => stock.isPositive).length;
  const losers = stocks.filter(stock => !stock.isPositive).length;
  const avgChange = stocks.reduce((sum, stock) => 
    sum + parseFloat(stock.changePercent?.replace('%', '') || 0), 0
  ) / stocks.length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getChartTitle()}
        </h3>
        <div className="text-sm text-gray-600">
          {stocks.length} stocks tracked
        </div>
      </div>
      
      <div style={{ height }}>
        {renderChart()}
      </div>
      
      {/* Market Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Gainers</p>
          <p className="font-semibold text-green-600">{gainers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Losers</p>
          <p className="font-semibold text-red-600">{losers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg Change</p>
          <p className={`font-semibold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {avgChange.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketChart;
