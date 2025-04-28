import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,
} from "react-icons/fi";
import { BaseUrluser } from "../../endpoint/baseurl";
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
} from "chart.js";
import { Bar, Pie, Line, Scatter } from "react-chartjs-2";
import ExcelFileList from "./ExcelFileList";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement
);

const DynamicChart = ({ data, chartType, xAxis, yAxis }) => {
  const chartData = {
    labels: data.map((item) => item[xAxis]),
    datasets: [
      {
        label: yAxis,
        data: data.map((item) => parseFloat(item[yAxis]) || 0),

        backgroundColor:
          chartType === "pie"
            ? [
                "rgba(255, 99, 132, 0.7)", // Red
                "rgba(54, 162, 235, 0.7)", // Blue
                "rgba(255, 206, 86, 0.7)", // Yellow
                "rgba(75, 192, 192, 0.7)", // Green
                "rgba(153, 102, 255, 0.7)", // Purple
                "rgba(255, 159, 64, 0.7)", // Orange
                "rgba(120, 120, 120, 0.7)", // Grey
                "rgba(200, 50, 100, 0.7)", // Pink
              ]
            : "rgba(102, 166, 255, 0.8)", // Light Blue for bars/lines
        borderColor:
          chartType === "pie"
            ? [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
                "rgba(100, 100, 100, 1)",
                "rgba(180, 30, 80, 1)",
              ]
            : "rgba(102, 166, 255, 1)",
        borderWidth: 1,

        pointBackgroundColor: "rgba(26, 117, 255, 1)",
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          },
          color: "#444",
        },
      },
      title: {
        display: true,
        text: `${xAxis} vs ${yAxis}`,
        color: "#222",
        font: {
          size: 18,
          family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          weight: "bold",
        },
        padding: { top: 15, bottom: 15 },
        align: "center",
      },

      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#333",
        bodyColor: "#555",
        borderColor: "#ccc",
        borderWidth: 0.5,
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            const value = context.parsed.y;
            if (typeof value === 'number' && !isNaN(value) && value !== null) {
              try {
                label += new Intl.NumberFormat(undefined, {
                  style: "numeric",
                }).format(value);
              } catch (error) {
                console.error("Error formatting tooltip value:", error, value);
                label += value; // Fallback to the raw value if formatting fails
              }
            } else {
              label += value !== null && value !== undefined ? value : 'N/A'; // Display the value if it's not null/undefined or show 'N/A'
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
          color: "#333",
          font: {
            size: 14,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            weight: "bold",
          },
          padding: { top: 10, bottom: 5 },
        },
        ticks: {
          color: "#555",
          font: {
            size: 11,
          },
          autoSkip: true,
          maxTicksLimit: 10, // Adjust as needed
        },
        grid: {
          borderColor: "#ddd",
          borderDash: [2, 2],
          color: "#f3f3f3",
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: yAxis,
          color: "#333",
          font: {
            size: 14,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            weight: "bold",
          },
          padding: { top: 5, bottom: 10 },
        },
        ticks: {
          color: "#555",
          font: {
            size: 11,
          },
          autoSkip: true,
          maxTicksLimit: 10, // Adjust as needed
        },
        grid: {
          borderColor: "#ddd",
          borderDash: [2, 2],
          color: "#f3f3f3",
          drawBorder: false,
        },
      },
    },

    layout: {
      padding: {
        left: 15,
        right: 15,
        top: 15,
        bottom: 15,
      },
    },
    // ✅ Add the animations option here, but ONLY for Line charts
    animations: chartType === 'line' ? {
      tension: {
        duration: 1000,
        easing: 'linear',
        from: 1,
        to: 0,
        loop: true
      }
    } : undefined, // Set to undefined for other chart types
  };

  return (
    <div className="h-96 w-full">
      {chartType === "bar" && <Bar data={chartData} options={options} />}
      {chartType === "pie" && <Pie data={chartData} options={options} />}
      {chartType === "line" && <Line data={chartData} options={options} />}
      {chartType === "scatter" && (
        <Scatter data={chartData} options={options} />
      )}
    </div>
  );
};

export default DynamicChart;