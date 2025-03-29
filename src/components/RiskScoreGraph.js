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
  Legend
} from 'chart.js';
import './RiskScoreGraph.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RiskScoreGraph = ({ riskHistory }) => {
  const data = {
    labels: riskHistory.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Risk Score',
        data: riskHistory.map(entry => entry.score),
        borderColor: '#635bff',
        backgroundColor: 'rgba(99, 91, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Risk Score History',
        color: '#0a2540',
        font: {
          size: 16,
          weight: 600
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#e2e8f0'
        },
        ticks: {
          color: '#4a5568'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#4a5568'
        }
      }
    }
  };

  return (
    <div className="risk-score-graph">
      <Line data={data} options={options} />
    </div>
  );
};

export default RiskScoreGraph; 