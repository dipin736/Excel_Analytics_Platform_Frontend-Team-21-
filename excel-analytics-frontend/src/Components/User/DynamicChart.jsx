import React from "react";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Pie, Line, Scatter } from "react-chartjs-2";


// Register ChartJS components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// Tailwind-inspired color palette
const COLORS = {
  blue: {
    500: '#3B82F6',
    400: '#60A5FA',
    300: '#93C5FD',
  },
  indigo: {
    500: '#6366F1',
    400: '#818CF8',
  },
  violet: {
    500: '#8B5CF6',
  },
  pink: {
    500: '#EC4899',
  },
  rose: {
    500: '#F43F5E',
  },
  amber: {
    500: '#F59E0B',
  },
  emerald: {
    500: '#10B981',
  },
  cyan: {
    500: '#06B6D4',
  },
};

const DynamicChart = ({ data, chartType, xAxis, yAxis }) => {
  // Generate gradient colors for bars/lines
  const generateGradient = (ctx, chartArea) => {
    if (!chartArea) return COLORS.blue[400];
    
    const gradient = ctx.createLinearGradient(
      0, chartArea.bottom, 0, chartArea.top
    );
    gradient.addColorStop(0, COLORS.blue[500]);
    gradient.addColorStop(0.7, COLORS.blue[300]);
    gradient.addColorStop(1, COLORS.blue[400]);
    return gradient;
  };

  // Pie chart colors
  const pieColors = [
    COLORS.rose[500],
    COLORS.indigo[500],
    COLORS.amber[500],
    COLORS.emerald[500],
    COLORS.violet[500],
    COLORS.cyan[500],
    COLORS.pink[500],
    COLORS.blue[500],
  ];

  const chartData = {
    labels: data.map((item) => item[xAxis]),
    datasets: [
      {
        label: yAxis,
        data: data.map((item) => parseFloat(item[yAxis]) || 0),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          
          if (chartType === "pie") {
            return pieColors;
          } else if (chartType === "bar") {
            return generateGradient(ctx, chartArea);
          } else {
            return COLORS.blue[400];
          }
        },
        borderColor: chartType === "pie" 
          ? pieColors.map(color => `${color}CC`)
          : COLORS.blue[500],
        borderWidth: chartType === "pie" ? 1 : 2,
        fill: chartType === "line" ? {
          target: 'origin',
          above: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            const gradient = ctx.createLinearGradient(
              0, chartArea.bottom, 0, chartArea.top
            );
            gradient.addColorStop(0, `${COLORS.blue[500]}33`);
            gradient.addColorStop(1, `${COLORS.blue[500]}10`);
            return gradient;
          }
        } : false,
        pointBackgroundColor: COLORS.blue[500],
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHitRadius: 10,
        tension: chartType === "line" ? 0.4 : 0,
        borderRadius: chartType === "bar" ? 6 : 0,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
      delay: (context) => {
        if (context.type === 'data' && context.mode === 'default') {
          return context.dataIndex * 100;
        }
        return 0;
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: '#374151',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: `${xAxis} vs ${yAxis}`,
        color: '#111827',
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: "600",
        },
        padding: { top: 20, bottom: 20 },
        align: "center",
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: '600',
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13,
        },
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.y ?? context.parsed;
            if (typeof value === 'number' && !isNaN(value)) {
              label += new Intl.NumberFormat(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(value);
            } else {
              label += value !== null && value !== undefined ? value : 'N/A';
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxis,
          color: '#374151',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: "500",
          },
          padding: { top: 10, bottom: 5 },
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          autoSkip: true,
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          drawBorder: false,
          color: '#E5E7EB',
        },
      },
      y: {
        title: {
          display: true,
          text: yAxis,
          color: '#374151',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: "500",
          },
          padding: { top: 5, bottom: 10 },
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 5,
          callback: (value) => {
            if (value >= 1000) {
              return `${value/1000}k`;
            }
            return value;
          }
        },
        grid: {
          drawBorder: false,
          color: '#E5E7EB',
        },
      },
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },
    },
    elements: {
      line: {
        borderWidth: 3,
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        backgroundColor: COLORS.blue[500],
        borderWidth: 2,
      },
    },
  };

  return (
    <div className="h-96 w-full animate-fade-in">
      {chartType === "bar" && <Bar data={chartData} options={options} />}
      {chartType === "pie" && <Pie data={chartData} options={options} />}
      {chartType === "line" && <Line data={chartData} options={options} />}
      {chartType === "scatter" && <Scatter data={chartData} options={options} />}
    </div>
  );
};

export default DynamicChart;