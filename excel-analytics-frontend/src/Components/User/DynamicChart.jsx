import React, { useEffect, useRef, memo, useState } from 'react';
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
import { FiDownload, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { saveChartConfiguration, createDashboard } from '../../services/chartApi';
import AdvancedChartRenderer from './AdvancedChartRenderer';

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

// Color schemes for different chart types
const colorSchemes = {
  light: {
    bar: {
      background: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(168, 85, 247, 0.6)',
        'rgba(236, 72, 153, 0.6)',
        'rgba(14, 165, 233, 0.6)',
        'rgba(20, 184, 166, 0.6)',
      ],
      border: [
        'rgba(99, 102, 241, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(14, 165, 233, 1)',
        'rgba(20, 184, 166, 1)',
      ]
    },
    line: {
      background: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 1)'
    },
    pie: {
      background: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(20, 184, 166, 0.8)',
      ],
      border: '#ffffff'
    },
    scatter: {
      background: 'rgba(99, 102, 241, 0.6)',
      border: 'rgba(99, 102, 241, 1)'
    },
    area: {
      background: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 1)'
    },
    column: {
      background: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(168, 85, 247, 0.6)',
        'rgba(236, 72, 153, 0.6)',
        'rgba(14, 165, 233, 0.6)',
        'rgba(20, 184, 166, 0.6)',
      ],
      border: [
        'rgba(99, 102, 241, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(14, 165, 233, 1)',
        'rgba(20, 184, 166, 1)',
      ]
    },
    doughnut: {
      background: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(20, 184, 166, 0.8)',
      ],
      border: '#ffffff'
    }
  },
  dark: {
    bar: {
      background: [
        'rgba(129, 140, 248, 0.8)',
        'rgba(192, 132, 252, 0.8)',
        'rgba(244, 114, 182, 0.8)',
        'rgba(56, 189, 248, 0.8)',
        'rgba(45, 212, 191, 0.8)',
      ],
      border: [
        'rgba(129, 140, 248, 1)',
        'rgba(192, 132, 252, 1)',
        'rgba(244, 114, 182, 1)',
        'rgba(56, 189, 248, 1)',
        'rgba(45, 212, 191, 1)',
      ]
    },
    line: {
      background: 'rgba(129, 140, 248, 0.2)',
      border: 'rgba(129, 140, 248, 1)'
    },
    pie: {
      background: [
        'rgba(129, 140, 248, 0.9)',
        'rgba(192, 132, 252, 0.9)',
        'rgba(244, 114, 182, 0.9)',
        'rgba(56, 189, 248, 0.9)',
        'rgba(45, 212, 191, 0.9)',
      ],
      border: '#374151'
    },
    scatter: {
      background: 'rgba(129, 140, 248, 0.8)',
      border: 'rgba(129, 140, 248, 1)'
    },
    area: {
      background: 'rgba(129, 140, 248, 0.2)',
      border: 'rgba(129, 140, 248, 1)'
    },
    column: {
      background: [
        'rgba(129, 140, 248, 0.8)',
        'rgba(192, 132, 252, 0.8)',
        'rgba(244, 114, 182, 0.8)',
        'rgba(56, 189, 248, 0.8)',
        'rgba(45, 212, 191, 0.8)',
      ],
      border: [
        'rgba(129, 140, 248, 1)',
        'rgba(192, 132, 252, 1)',
        'rgba(244, 114, 182, 1)',
        'rgba(56, 189, 248, 1)',
        'rgba(45, 212, 191, 1)',
      ]
    },
    doughnut: {
      background: [
        'rgba(129, 140, 248, 0.9)',
        'rgba(192, 132, 252, 0.9)',
        'rgba(244, 114, 182, 0.9)',
        'rgba(56, 189, 248, 0.9)',
        'rgba(45, 212, 191, 0.9)',
      ],
      border: '#374151'
    }
  }
};

const DynamicChart = memo(({ data, chartType, xAxis, yAxis, zAxis, darkMode, chartControls, title, config, fileId, sheetName }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const prevConfigRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Advanced chart types that use the AdvancedChartRenderer
  const advancedChartTypes = [
    'pie', 'doughnut'
  ];

  useEffect(() => {
    if (!data || !chartType || !xAxis || !yAxis || !chartRef.current) return;

    try {
      // Destroy existing chart instance before creating a new one
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      // Create a config string to compare changes
      const currentConfig = JSON.stringify({ 
        data: data.map(d => ({ x: d[xAxis], y: d[yAxis] })), 
        chartType, 
        darkMode 
      });
      
      if (prevConfigRef.current === currentConfig) return;
      prevConfigRef.current = currentConfig;

      const ctx = chartRef.current.getContext('2d');
      
      // Create gradient for area and line charts
      let gradient = null;
      if (chartType === 'area' || chartType === 'line') {
        gradient = ctx.createLinearGradient(0, 0, 0, 400);
        if (darkMode) {
          gradient.addColorStop(0, 'rgba(129, 140, 248, 0.3)');
          gradient.addColorStop(1, 'rgba(129, 140, 248, 0.02)');
        } else {
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
        }
      }

      const colors = darkMode ? colorSchemes.dark : colorSchemes.light;
      const chartColors = colors[chartType] || colors.bar; // Fallback to bar colors if chart type not found

      // Validate and process data
      const validData = data.filter(d => 
        d[xAxis] !== undefined && 
        d[xAxis] !== null && 
        d[yAxis] !== undefined && 
        d[yAxis] !== null
      );

      if (validData.length === 0) {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
          chartInstanceRef.current = null;
        }
        return;
      }

      // Generate colors for pie/doughnut charts
      const generatePieColors = (dataLength) => {
        return validData.map((_, i) => {
          const hue = (i * 360) / dataLength;
          return `hsla(${hue}, 70%, ${darkMode ? '65%' : '60%'}, 0.8)`;
        });
      };

      const chartData = {
        labels: validData.map(d => d[xAxis]),
        datasets: [{
          label: yAxis,
          data: validData.map(d => d[yAxis]),
          backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
            ? generatePieColors(validData.length)
            : chartType === 'area' 
              ? gradient 
              : chartType === 'line' 
                ? 'transparent' 
                : chartColors?.background || chartColors?.background?.[0] || 'rgba(99, 102, 241, 0.6)',
          borderColor: chartType === 'pie' || chartType === 'doughnut'
            ? darkMode ? '#374151' : '#ffffff'
            : chartColors?.border || chartColors?.border?.[0] || 'rgba(99, 102, 241, 1)',
          borderWidth: chartType === 'line' ? 3 : chartType === 'pie' || chartType === 'doughnut' ? 2 : 2,
          tension: chartType === 'line' ? 0 : chartType === 'area' ? 0.4 : 0.4, // Sharp lines for line charts, smooth for area
          pointRadius: chartType === 'scatter' ? 6 : chartType === 'line' ? 4 : 3, // Slightly larger points for line charts
          pointHoverRadius: chartType === 'scatter' ? 8 : chartType === 'line' ? 6 : 5,
          pointBackgroundColor: chartColors?.border || chartColors?.border?.[0] || 'rgba(99, 102, 241, 1)', // Make points visible
          pointBorderColor: darkMode ? '#374151' : '#ffffff', // Border around points
          pointBorderWidth: chartType === 'line' ? 2 : 1,
          fill: chartType === 'area',
          hoverOffset: chartType === 'pie' || chartType === 'doughnut' ? 4 : 0, // Hover effect for pie charts
        }]
      };

      const chartConfig = {
        type: chartType === 'area' ? 'line' : chartType === 'column' ? 'bar' : chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: chartType === 'bar' ? 'y' : 'x', // Horizontal bars vs vertical columns
          animation: {
            duration: 750,
            easing: 'easeOutQuart',
            onComplete: function() {
              // Cache the chart image for potential exports
              if (this.canvas) {
                this.canvas.dataURL = this.canvas.toDataURL('image/png');
              }
            }
          },
          scales: chartType !== 'pie' ? {
            y: {
              beginAtZero: true,
              grid: {
                color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: darkMode ? '#9CA3AF' : '#4B5563',
                padding: 10,
                callback: function(value) {
                  // Format large numbers with K/M/B suffixes
                  if (Math.abs(value) >= 1000000000) {
                    return (value / 1000000000).toFixed(1) + 'B';
                  }
                  if (Math.abs(value) >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M';
                  }
                  if (Math.abs(value) >= 1000) {
                    return (value / 1000).toFixed(1) + 'K';
                  }
                  return value;
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: darkMode ? '#9CA3AF' : '#4B5563',
                padding: 10,
                maxRotation: 45,
                minRotation: 45,
                autoSkip: true,
                maxTicksLimit: 20
              }
            }
          } : undefined,
          plugins: {
            legend: {
              display: chartType === 'pie' || chartType === 'doughnut',
              position: 'bottom',
              labels: {
                color: darkMode ? '#9CA3AF' : '#4B5563',
                padding: 20,
                font: {
                  size: 12
                },
                generateLabels: function(chart) {
                  const labels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
                  const colors = darkMode ? colorSchemes.dark : colorSchemes.light;
                  const chartColors = colors[chartType] || colors.bar;
                  return labels.map(label => ({
                    ...label,
                    fillStyle: chartColors?.background || chartColors?.background?.[0] || 'rgba(99, 102, 241, 0.6)',
                    strokeStyle: chartColors?.border || chartColors?.border?.[0] || 'rgba(99, 102, 241, 1)'
                  }));
                }
              }
            },
            tooltip: {
              backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              titleColor: darkMode ? '#F3F4F6' : '#1F2937',
              bodyColor: darkMode ? '#D1D5DB' : '#4B5563',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              displayColors: true,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                  // Format large numbers
                  if (Math.abs(value) >= 1000000000) {
                    label += (value / 1000000000).toFixed(2) + 'B';
                  } else if (Math.abs(value) >= 1000000) {
                    label += (value / 1000000).toFixed(2) + 'M';
                  } else if (Math.abs(value) >= 1000) {
                    label += (value / 1000).toFixed(2) + 'K';
                  } else {
                    label += value;
                  }
                  return label;
                }
              }
            }
          }
        }
      };

      // Create new chart instance (previous one was destroyed above)
      chartInstanceRef.current = new ChartJS(ctx, chartConfig);
    } catch (error) {
      console.error('Error rendering chart:', error);
      // Clean up on error
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    }

  }, [data, chartType, xAxis, yAxis, darkMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Add resize handler with debounce
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.resize();
        }
      }, 250); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Download function for basic charts
  const downloadChart = () => {
    try {
      if (chartInstanceRef.current && chartInstanceRef.current.toBase64Image) {
        const link = document.createElement('a');
        link.download = `${chartType}-chart-${Date.now()}.png`;
        link.href = chartInstanceRef.current.toBase64Image();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Chart downloaded successfully!');
      } else {
        toast.error('Error: No chart available for download');
      }
    } catch (error) {
      toast.error('Error downloading chart: ' + error.message);
    }
  };

  // Save function for basic charts
  const saveToNewDashboard = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      
      // Create a new dashboard
      const dashboardData = {
        title: `Dashboard - ${title || chartType} Chart`,
        description: `Auto-created dashboard for ${chartType} chart`
      };

      const dashboardResult = await createDashboard(dashboardData);
      
      if (!dashboardResult.success) {
        throw new Error(dashboardResult.error || 'Failed to create dashboard');
      }

      // Map chart types for backend compatibility
      const backendChartType = chartType === 'column' ? 'bar' : chartType;

      // Save chart configuration
      const chartConfig = {
        title: title || `${chartType} Chart`,
        chartType: backendChartType,
        data: {
          labels: data?.map(d => d[xAxis]) || [],
          values: data?.map(d => parseFloat(d[yAxis]) || 0) || []
        },
        configuration: {
          fileId: fileId,
          sheetName: sheetName,
          xAxis: xAxis,
          yAxis: yAxis,
          zAxis: zAxis,
          interactiveSettings: {
            darkMode: darkMode,
            ...config
          },
          description: `${chartType} chart created from ${sheetName || 'data'}`
        }
      };

      // Debug log to see what's being sent
      console.log('Saving chart config:', chartConfig);

      const result = await saveChartConfiguration(dashboardResult.data.data._id, chartConfig);
      
      if (result.success) {
        toast.success(`Chart saved to dashboard "${dashboardResult.data.data.title}" successfully!`);
      } else {
        throw new Error(result.error || 'Failed to save chart');
      }
    } catch (error) {
      toast.error('Failed to save chart to dashboard');
    } finally {
      setSaving(false);
    }
  };

  // Use AdvancedChartRenderer for advanced chart types
  if (advancedChartTypes.includes(chartType)) {
    return (
      <AdvancedChartRenderer
        data={data}
        chartType={chartType}
        xAxis={xAxis}
        yAxis={yAxis}
        zAxis={zAxis}
        darkMode={darkMode}
        chartControls={chartControls}
        title={title}
        config={config}
        fileId={fileId}
        sheetName={sheetName}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Download and Save Controls for Basic Charts */}
      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={downloadChart}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} cursor-pointer`}
            title="Download as PNG"
            type="button"
          >
            <FiDownload size={16} />
            <span className="text-sm">Download</span>
          </button>
          <button
            onClick={saveToNewDashboard}
            disabled={saving}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : darkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                  : 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
            }`}
            title="Save to Dashboard"
            type="button"
          >
            <FiSave size={16} />
            <span className="text-sm">{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
});

DynamicChart.displayName = 'DynamicChart';

export default DynamicChart;
