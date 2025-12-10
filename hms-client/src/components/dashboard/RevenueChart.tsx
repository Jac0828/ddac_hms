import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLanguage } from '../../contexts/LanguageContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data?: Array<{ date: string; revenue: number }>;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data: chartData }) => {
  const { t } = useLanguage();

  // Default data if not provided
  const defaultData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: t('dashboard.revenue') || 'Revenue',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
      },
    ],
  };

  // Use provided data or default
  const data = chartData && chartData.length > 0 ? {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.map(item => item.revenue),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
      },
    ],
  } : defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600' as const,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6C757D',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMin: 0,
        grid: {
          color: '#F1F3F5',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#6C757D',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return '$' + value;
          },
        },
      },
    },
  };

  return (
    <div className="chart-card card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="card-title mb-1 fw-bold">{t('dashboard.revenueOverTime')}</h5>
            <p className="text-muted small mb-0">{t('dashboard.last7Days')}</p>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;

