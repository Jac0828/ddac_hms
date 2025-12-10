import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useLanguage } from '../../contexts/LanguageContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OccupancyChartProps {
  data?: Array<{ date: string; occupancy: number }>;
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({ data: chartData }) => {
  const { t } = useLanguage();

  // Default data if not provided
  const defaultData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: t('dashboard.occupancyRate'),
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#10B981',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Use provided data or default
  const data = chartData && chartData.length > 0 ? {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: 'Occupancy Rate',
        data: chartData.map(item => item.occupancy),
        backgroundColor: '#10B981',
        borderRadius: 8,
        borderSkipped: false,
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
        callbacks: {
          label: function(context: any) {
            return (t('dashboard.occupancy') || 'Occupancy') + ': ' + context.parsed.y + '%';
          },
        },
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
            return value + '%';
          },
        },
        max: 100,
      },
    },
  };

  return (
    <div className="chart-card card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="card-title mb-1 fw-bold">{t('dashboard.occupancyRate')}</h5>
            <p className="text-muted small mb-0">{t('dashboard.last7Days')}</p>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default OccupancyChart;

