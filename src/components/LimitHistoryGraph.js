import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './LimitHistoryGraph.css';

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

const LimitHistoryGraph = ({ limitHistory = [] }) => {
  const data = {
    labels: limitHistory.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Spending Limit',
        data: limitHistory.map(entry => entry.limit),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#22c55e',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        pointHitRadius: 10,
        pointHoverShadowBlur: 10,
        pointHoverShadowColor: 'rgba(34, 197, 94, 0.5)',
        pointHoverShadowOffsetX: 0,
        pointHoverShadowOffsetY: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `Limit: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e2e8f0',
          drawBorder: false
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          },
          color: '#64748b',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="limit-history-tracker">
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default LimitHistoryGraph; 