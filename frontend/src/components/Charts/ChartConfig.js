import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Common chart options
export const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: false,
      },
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

// Stock price chart options
export const stockChartOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Stock Price Movement',
    },
  },
  scales: {
    ...commonOptions.scales,
    x: {
      ...commonOptions.scales.x,
      type: 'time',
      time: {
        unit: 'minute',
        displayFormats: {
          minute: 'HH:mm',
          hour: 'HH:mm',
        },
      },
    },
    y: {
      ...commonOptions.scales.y,
      title: {
        display: true,
        text: 'Price ($)',
      },
    },
  },
};

// Portfolio pie chart options
export const portfolioChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
    },
    title: {
      display: true,
      text: 'Portfolio Composition',
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: $${value.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
};

// Market overview bar chart options
export const marketOverviewOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    title: {
      display: true,
      text: 'Market Performance',
    },
  },
  scales: {
    ...commonOptions.scales,
    y: {
      ...commonOptions.scales.y,
      title: {
        display: true,
        text: 'Change (%)',
      },
    },
  },
};

// Color schemes
export const colors = {
  primary: 'rgb(99, 102, 241)',
  primaryLight: 'rgba(99, 102, 241, 0.2)',
  success: 'rgb(34, 197, 94)',
  successLight: 'rgba(34, 197, 94, 0.2)',
  danger: 'rgb(239, 68, 68)',
  dangerLight: 'rgba(239, 68, 68, 0.2)',
  warning: 'rgb(245, 158, 11)',
  warningLight: 'rgba(245, 158, 11, 0.2)',
  info: 'rgb(59, 130, 246)',
  infoLight: 'rgba(59, 130, 246, 0.2)',
  gray: 'rgb(107, 114, 128)',
  grayLight: 'rgba(107, 114, 128, 0.2)',
};

// Generate color palette for multiple datasets
export const generateColors = (count) => {
  const baseColors = [
    colors.primary,
    colors.success,
    colors.danger,
    colors.warning,
    colors.info,
    'rgb(168, 85, 247)', // purple
    'rgb(236, 72, 153)', // pink
    'rgb(14, 165, 233)',  // sky
    'rgb(34, 197, 94)',   // emerald
    'rgb(251, 146, 60)',  // orange
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length]);
  }
  return result;
};

export default ChartJS;
