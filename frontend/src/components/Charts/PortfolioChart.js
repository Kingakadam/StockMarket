import { Pie, Bar } from 'react-chartjs-2';
import { portfolioChartOptions, marketOverviewOptions, generateColors } from './ChartConfig';

const PortfolioChart = ({ portfolio, type = 'pie', height = 400 }) => {
  if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-600">No portfolio data available</p>
        </div>
      </div>
    );
  }

  const holdings = portfolio.holdings;

  // Prepare data for pie chart (portfolio composition)
  const pieChartData = {
    labels: holdings.map(holding => holding.symbol),
    datasets: [
      {
        label: 'Portfolio Value',
        data: holdings.map(holding => holding.currentValue),
        backgroundColor: generateColors(holdings.length),
        borderColor: generateColors(holdings.length).map(color => color.replace('rgb', 'rgba').replace(')', ', 1)')),
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for bar chart (gain/loss analysis)
  const barChartData = {
    labels: holdings.map(holding => holding.symbol),
    datasets: [
      {
        label: 'Gain/Loss ($)',
        data: holdings.map(holding => holding.gainLoss),
        backgroundColor: holdings.map(holding => 
          holding.gainLoss >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: holdings.map(holding => 
          holding.gainLoss >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for performance percentage chart
  const performanceChartData = {
    labels: holdings.map(holding => holding.symbol),
    datasets: [
      {
        label: 'Performance (%)',
        data: holdings.map(holding => parseFloat(holding.gainLossPercent)),
        backgroundColor: holdings.map(holding => 
          holding.gainLoss >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: holdings.map(holding => 
          holding.gainLoss >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      },
    ],
  };

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return (
          <div style={{ height }}>
            <Pie data={pieChartData} options={portfolioChartOptions} />
          </div>
        );
      case 'gainloss':
        return (
          <div style={{ height }}>
            <Bar 
              data={barChartData} 
              options={{
                ...marketOverviewOptions,
                plugins: {
                  ...marketOverviewOptions.plugins,
                  title: {
                    display: true,
                    text: 'Portfolio Gain/Loss Analysis',
                  },
                },
                scales: {
                  ...marketOverviewOptions.scales,
                  y: {
                    ...marketOverviewOptions.scales.y,
                    title: {
                      display: true,
                      text: 'Gain/Loss ($)',
                    },
                  },
                },
              }} 
            />
          </div>
        );
      case 'performance':
        return (
          <div style={{ height }}>
            <Bar 
              data={performanceChartData} 
              options={{
                ...marketOverviewOptions,
                plugins: {
                  ...marketOverviewOptions.plugins,
                  title: {
                    display: true,
                    text: 'Portfolio Performance (%)',
                  },
                },
                scales: {
                  ...marketOverviewOptions.scales,
                  y: {
                    ...marketOverviewOptions.scales.y,
                    title: {
                      display: true,
                      text: 'Performance (%)',
                    },
                  },
                },
              }} 
            />
          </div>
        );
      default:
        return (
          <div style={{ height }}>
            <Pie data={pieChartData} options={portfolioChartOptions} />
          </div>
        );
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'pie':
        return 'Portfolio Composition';
      case 'gainloss':
        return 'Gain/Loss Analysis';
      case 'performance':
        return 'Performance Analysis';
      default:
        return 'Portfolio Chart';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getChartTitle()}
        </h3>
        <div className="text-sm text-gray-600">
          Total Value: ${portfolio.summary?.totalValue || '0.00'}
        </div>
      </div>
      
      {renderChart()}
      
      {/* Portfolio Summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Total Invested</p>
          <p className="font-semibold">${portfolio.summary?.totalInvested || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Current Value</p>
          <p className="font-semibold">${portfolio.summary?.totalValue || '0.00'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Gain/Loss</p>
          <p className={`font-semibold ${
            parseFloat(portfolio.summary?.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${portfolio.summary?.totalGainLoss || '0.00'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Performance</p>
          <p className={`font-semibold ${
            parseFloat(portfolio.summary?.totalGainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {portfolio.summary?.totalGainLossPercent || '0.00'}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
