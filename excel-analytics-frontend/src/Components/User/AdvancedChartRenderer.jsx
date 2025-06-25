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
  RadialLinearScale,
} from "chart.js";
import { Bar, Pie, Line, Scatter, Radar, Doughnut } from "react-chartjs-2";
import { FiDownload, FiSave, FiRotateCw, FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { saveChartConfiguration, createDashboard } from '../../services/chartApi';
import { BaseUrluser } from '../../endpoint/baseurl';

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
  Filler,
  RadialLinearScale
);

const AdvancedChartRenderer = memo(({
  chartType,
  data,
  xAxis,
  yAxis,
  zAxis,
  darkMode,
  chartControls = {},
  title = '',
  config = {},
  fileId,
  sheetName
}) => {
  const chartRef = useRef(null);
  const d3ContainerRef = useRef(null);

  // Interactive states for 3D pie chart
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tiltAngle, setTiltAngle] = useState(0.6);
  const [saving, setSaving] = useState(false);
  
  // Interactive states for enhanced 2D pie/doughnut charts
  const [pieZoom, setPieZoom] = useState(1);
  const [pieRotation, setPieRotation] = useState(0);
  const [showLegend, setShowLegend] = useState(true);
  const [legendScrollTop, setLegendScrollTop] = useState(0);
  
  // Chart instance refs for different chart types
  const pieChartInstanceRef = useRef(null);

  // 3D pie chart rendering effect - moved to top level to fix hooks rule
  useEffect(() => {
    if (chartType !== '3d-pie' || !chartRef.current || !data || data.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get container dimensions - improved sizing
    const container = canvas.parentElement;
    const containerWidth = container?.offsetWidth || 500;
    const containerHeight = container?.offsetHeight || 400;
    
    // Responsive canvas sizing - increased size
    const width = canvas.width = Math.min(containerWidth * 0.95, 700);
    const height = canvas.height = Math.min(containerHeight * 0.85, 500);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate data totals and percentages
    const values = data.map(d => parseFloat(d[yAxis]) || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const percentages = values.map(val => val / total);

    // 3D pie chart parameters with interactive controls
    const scale = Math.min(width, height) / 450;
    const centerX = width / 2;
    const centerY = height / 2 - 30; // Move up more for legend space
    const radiusX = Math.min(130 * scale * zoom, width * 0.35);
    const radiusY = Math.min(85 * scale * zoom, height * 0.3);
    const depth = Math.min(30 * scale * zoom, 35);
    const tilt = tiltAngle;

    // Enhanced color palette
    const colors = data.map((_, i) => {
      const hue = (i * 360) / data.length;
      const saturation = 75 - (i % 3) * 5;
      const lightness = 65 + (i % 2) * 8;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });

    const shadowColors = data.map((_, i) => {
      const hue = (i * 360) / data.length;
      const saturation = 75 - (i % 3) * 5;
      return `hsl(${hue}, ${saturation}%, 40%)`;
    });

    let currentAngle = -Math.PI / 2 + rotation;

    // Draw 3D sides
    for (let slice = 0; slice < data.length; slice++) {
      const sliceAngle = percentages[slice] * 2 * Math.PI;
      
      if (sliceAngle > 0.005) {
        ctx.fillStyle = shadowColors[slice];
        
        // Side face
        ctx.beginPath();
        ctx.moveTo(
          centerX + radiusX * Math.cos(currentAngle),
          centerY + radiusY * Math.sin(currentAngle) * tilt
        );
        ctx.lineTo(
          centerX + radiusX * Math.cos(currentAngle + sliceAngle),
          centerY + radiusY * Math.sin(currentAngle + sliceAngle) * tilt
        );
        ctx.lineTo(
          centerX + radiusX * Math.cos(currentAngle + sliceAngle),
          centerY + radiusY * Math.sin(currentAngle + sliceAngle) * tilt + depth
        );
        ctx.lineTo(
          centerX + radiusX * Math.cos(currentAngle),
          centerY + radiusY * Math.sin(currentAngle) * tilt + depth
        );
        ctx.closePath();
        ctx.fill();

        // Curved edge
        ctx.beginPath();
        ctx.moveTo(
          centerX + radiusX * Math.cos(currentAngle),
          centerY + radiusY * Math.sin(currentAngle) * tilt
        );
        
        const steps = Math.max(8, Math.min(15, Math.floor(sliceAngle * 25)));
        for (let i = 0; i <= steps; i++) {
          const angle = currentAngle + (sliceAngle * i / steps);
          const x = centerX + radiusX * Math.cos(angle);
          const y1 = centerY + radiusY * Math.sin(angle) * tilt;
          
          if (i === 0) {
            ctx.moveTo(x, y1);
          } else {
            ctx.lineTo(x, y1);
          }
        }
        
        for (let i = steps; i >= 0; i--) {
          const angle = currentAngle + (sliceAngle * i / steps);
          const x = centerX + radiusX * Math.cos(angle);
          const y2 = centerY + radiusY * Math.sin(angle) * tilt + depth;
          ctx.lineTo(x, y2);
        }
        
        ctx.closePath();
        ctx.fill();
      }
      
      currentAngle += sliceAngle;
    }

    // Draw top surface
    currentAngle = -Math.PI / 2 + rotation;
    
    for (let slice = 0; slice < data.length; slice++) {
      const sliceAngle = percentages[slice] * 2 * Math.PI;
      
      if (sliceAngle > 0.005) {
        ctx.fillStyle = colors[slice];
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        
        const steps = Math.max(8, Math.min(20, Math.floor(sliceAngle / (Math.PI / 30))));
        for (let i = 0; i <= steps; i++) {
          const angle = currentAngle + (sliceAngle * i / steps);
          const x = centerX + radiusX * Math.cos(angle);
          const y = centerY + radiusY * Math.sin(angle) * tilt;
          ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Border
        ctx.strokeStyle = darkMode ? '#4b5563' : '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      
      currentAngle += sliceAngle;
    }

    // Smart label rendering
    currentAngle = -Math.PI / 2 + rotation;
    const minLabelThreshold = data.length > 15 ? 0.08 : data.length > 10 ? 0.06 : 0.04;
    
    for (let slice = 0; slice < data.length; slice++) {
      const sliceAngle = percentages[slice] * 2 * Math.PI;
      const midAngle = currentAngle + sliceAngle / 2;
      const percentage = (percentages[slice] * 100).toFixed(1);
      
      if (sliceAngle > minLabelThreshold) {
        const labelDistance = radiusX * 0.75;
        const labelX = centerX + labelDistance * Math.cos(midAngle);
        const labelY = centerY + (radiusY * 0.75) * Math.sin(midAngle) * tilt;
        
        ctx.fillStyle = darkMode ? '#f9fafb' : '#1f2937';
        ctx.font = `bold ${Math.max(9, Math.min(12, 140 / data.length))}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.shadowColor = darkMode ? '#000000' : '#ffffff';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(`${percentage}%`, labelX, labelY);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      currentAngle += sliceAngle;
    }

    // Title
    if (title) {
      ctx.font = `bold ${Math.max(14, Math.min(18, width / 30))}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
      ctx.fillText(title, centerX, Math.max(25, height * 0.06));
    }

  }, [chartType, data, xAxis, yAxis, darkMode, title, rotation, zoom, tiltAngle]); // Make sure all interactive states are in dependencies

  // Color schemes for different themes
  const getColorScheme = (theme = 'default') => {
    const schemes = {
      default: {
        primary: darkMode ? 'rgba(129, 140, 248, 1)' : 'rgba(99, 102, 241, 1)',
        secondary: darkMode ? 'rgba(192, 132, 252, 1)' : 'rgba(168, 85, 247, 1)',
        tertiary: darkMode ? 'rgba(244, 114, 182, 1)' : 'rgba(236, 72, 153, 1)',
        background: darkMode ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.1)',
        text: darkMode ? '#F3F4F6' : '#1F2937'
      }
    };
    return schemes[theme] || schemes.default;
  };

  // Universal download function for all chart types
  const downloadChart = (canvasRef, chartInstance = null) => {
    try {
      if (chartType === '3d-pie' && canvasRef?.current) {
        // For 3D pie charts, create composite image with legend
        const originalCanvas = canvasRef.current;
        const compositeCanvas = document.createElement('canvas');
        const ctx = compositeCanvas.getContext('2d');
        
        // Recalculate legend data within function scope
        const values = data?.map(d => parseFloat(d[yAxis]) || 0) || [];
        const total = values.reduce((sum, val) => sum + val, 0);
        const legendData = data?.map((item, index) => ({
          label: item[xAxis],
          value: values[index],
          percentage: total > 0 ? ((values[index] / total) * 100).toFixed(1) : '0',
          color: `hsl(${(index * 360) / data.length}, ${75 - (index % 3) * 5}%, ${65 + (index % 2) * 8}%)`
        })) || [];
        
        // Calculate dimensions
        const chartWidth = originalCanvas.width;
        const chartHeight = originalCanvas.height;
        const legendHeight = Math.max(200, Math.ceil(legendData.length / 4) * 30 + 80); // Dynamic height based on items
        
        compositeCanvas.width = chartWidth;
        compositeCanvas.height = chartHeight + legendHeight;
        
        // Set background
        ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        
        // Draw the chart
        ctx.drawImage(originalCanvas, 0, 0);
        
        // Draw legend
        const legendY = chartHeight + 20;
        const itemsPerRow = Math.min(4, Math.max(2, Math.floor(chartWidth / 200)));
        const itemWidth = (chartWidth - 40) / itemsPerRow;
        const itemHeight = 25;
        
        // Legend title
        ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Legend (${legendData.length} items)`, 20, legendY);
        
        // Legend items
        legendData.forEach((item, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = 20 + col * itemWidth;
          const y = legendY + 30 + row * itemHeight;
          
          // Color box
          ctx.fillStyle = item.color;
          ctx.fillRect(x, y, 12, 12);
          ctx.strokeStyle = darkMode ? '#4b5563' : '#d1d5db';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, 12, 12);
          
          // Text
          ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
          ctx.font = '11px Arial';
          ctx.textAlign = 'left';
          const text = `${item.label}: ${item.percentage}%`;
          const maxWidth = itemWidth - 20;
          
          // Truncate text if too long
          let displayText = text;
          if (ctx.measureText(text).width > maxWidth) {
            let truncated = text;
            while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
              truncated = truncated.slice(0, -1);
            }
            displayText = truncated + '...';
          }
          
          ctx.fillText(displayText, x + 18, y + 9);
        });
        
        // Add summary if many items
        if (legendData.length > 8) {
          const summaryY = legendY + 40 + Math.ceil(legendData.length / itemsPerRow) * itemHeight;
          ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `${legendData.length} categories • Total: ${total.toLocaleString()}`,
            chartWidth / 2,
            summaryY
          );
        }
        
        // Download composite image
        const link = document.createElement('a');
        link.download = `3d-pie-chart-with-legend-${Date.now()}.png`;
        link.href = compositeCanvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Chart downloaded successfully!');
      } else if (chartInstance && chartInstance.toBase64Image) {
        // For enhanced pie/doughnut charts with legend
        if (chartType === 'pie' || chartType === 'doughnut') {
          // Create composite image with chart and legend for pie/doughnut charts
          const chartCanvas = chartInstance.canvas;
          
          const compositeCanvas = document.createElement('canvas');
          const ctx = compositeCanvas.getContext('2d');
          
          // Calculate legend data
          const values = data?.map(d => parseFloat(d[yAxis]) || 0) || [];
          const total = values.reduce((sum, val) => sum + val, 0);
          const legendData = data?.map((item, index) => ({
            label: item[xAxis],
            value: values[index],
            percentage: total > 0 ? ((values[index] / total) * 100).toFixed(1) : '0',
            color: `hsl(${(index * 360) / data.length}, ${75 - (index % 3) * 5}%, ${65 + (index % 2) * 8}%)`
          })) || [];
          
          // Calculate dimensions
          const chartWidth = chartCanvas.width;
          const chartHeight = chartCanvas.height;
          const legendHeight = Math.max(250, Math.ceil(legendData.length / 4) * 35 + 100);
          
          compositeCanvas.width = chartWidth;
          compositeCanvas.height = chartHeight + legendHeight;
          
          // Set background
          ctx.fillStyle = darkMode ? '#1f2937' : '#ffffff';
          ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
          
          // Draw the chart
          ctx.drawImage(chartCanvas, 0, 0);
          
          // Draw legend
          const legendY = chartHeight + 30;
          const itemsPerRow = Math.min(4, Math.max(2, Math.floor(chartWidth / 180)));
          const itemWidth = (chartWidth - 40) / itemsPerRow;
          const itemHeight = 30;
          
          // Legend title
          ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(`Legend (${legendData.length} items)`, 20, legendY);
          
          // Legend items
          legendData.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = 20 + col * itemWidth;
            const y = legendY + 40 + row * itemHeight;
            
            // Color box
            ctx.fillStyle = item.color;
            ctx.fillRect(x, y, 14, 14);
            ctx.strokeStyle = darkMode ? '#4b5563' : '#d1d5db';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, 14, 14);
            
            // Text
            ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const text = `${item.label}: ${item.percentage}%`;
            const maxWidth = itemWidth - 25;
            
            // Truncate text if too long
            let displayText = text;
            if (ctx.measureText(text).width > maxWidth) {
              let truncated = text;
              while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
              }
              displayText = truncated + '...';
            }
            
            ctx.fillText(displayText, x + 20, y + 10);
          });
          
          // Add summary if many items
          if (legendData.length > 8) {
            const summaryY = legendY + 50 + Math.ceil(legendData.length / itemsPerRow) * itemHeight;
            ctx.fillStyle = darkMode ? '#9ca3af' : '#6b7280';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(
              `${legendData.length} categories • Total: ${total.toLocaleString()}`,
              chartWidth / 2,
              summaryY
            );
          }
          
          // Download composite image
          const link = document.createElement('a');
          link.download = `${chartType}-chart-with-legend-${Date.now()}.png`;
          link.href = compositeCanvas.toDataURL();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('Chart with legend downloaded successfully!');
        } else {
          // For regular Chart.js charts without custom legend
          const link = document.createElement('a');
          link.download = `${chartType}-chart-${Date.now()}.png`;
          link.href = chartInstance.toBase64Image();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success('Chart downloaded successfully!');
        }
      } else {
        // Try to get chart from canvas if available
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const link = document.createElement('a');
          link.download = `${chartType}-chart-${Date.now()}.png`;
          link.href = canvas.toDataURL();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Chart downloaded successfully!');
        } else {
          toast.error('Error: No chart available for download');
        }
      }
    } catch (error) {
      toast.error('Error downloading chart: ' + error.message);
    }
  };

  // Universal save function for all chart types
  const saveToNewDashboard = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      
      // Create a new dashboard - try simpler structure
      const dashboardData = {
        title: `Dashboard - ${title || chartType} Chart`,
        description: `Auto-created dashboard for ${chartType} chart`
      };

      const dashboardResult = await createDashboard(dashboardData);
      
      if (!dashboardResult.success) {
        throw new Error(dashboardResult.error || 'Failed to create dashboard');
      }

      // Save chart configuration
      const chartConfig = {
        title: title || `${chartType} Chart`,
        chartType: chartType,
        data: {
          // Include the current data for reference
          labels: data?.map(d => d[xAxis]) || [],
          values: data?.map(d => parseFloat(d[yAxis]) || 0) || []
        },
        configuration: {
          fileId: fileId,
          sheetName: sheetName,
          xAxis: xAxis,
          yAxis: yAxis,
          zAxis: zAxis,
          // Store interactive settings in configuration
          interactiveSettings: {
            darkMode: darkMode,
            rotation: rotation,
            zoom: zoom,
            tiltAngle: tiltAngle,
            ...config
          },
          description: `${chartType} chart created from ${sheetName || 'data'}`
        }
      };

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

  // 3D Pie Chart Implementation with improved legend layout
  const render3DPieChart = () => {
    // Legend data calculation
    const values = data?.map(d => parseFloat(d[yAxis]) || 0) || [];
    const total = values.reduce((sum, val) => sum + val, 0);
    const legendData = data?.map((item, index) => ({
      label: item[xAxis],
      value: values[index],
      percentage: total > 0 ? ((values[index] / total) * 100).toFixed(1) : '0',
      color: `hsl(${(index * 360) / data.length}, ${75 - (index % 3) * 5}%, ${65 + (index % 2) * 8}%)`
    })) || [];

    // Improved legend grid calculation for better overflow handling
    const getGridCols = () => {
      if (legendData.length <= 4) return 'grid-cols-1 md:grid-cols-2';
      if (legendData.length <= 8) return 'grid-cols-2 md:grid-cols-3';
      if (legendData.length <= 12) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      if (legendData.length <= 20) return 'grid-cols-3 md:grid-cols-4';
      return 'grid-cols-3 md:grid-cols-4';
    };

    return (
      <div className="w-full h-full flex flex-col">
        {/* Interactive Controls - Direct Implementation */}
        <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Rotation Controls */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Rotate:
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRotation(prev => prev - Math.PI / 6);
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Rotate Left"
                type="button"
              >
                <FiRotateCw className="transform rotate-180" size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRotation(prev => prev + Math.PI / 6);
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Rotate Right"
                type="button"
              >
                <FiRotateCw size={16} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Zoom:
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoom(prev => Math.max(0.5, prev - 0.1));
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Zoom Out"
                type="button"
              >
                <FiZoomOut size={16} />
              </button>
              <span className={`text-xs px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoom(prev => Math.min(2, prev + 0.1));
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Zoom In"
                type="button"
              >
                <FiZoomIn size={16} />
              </button>
            </div>

            {/* Tilt Controls */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tilt:
              </span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.1"
                value={tiltAngle}
                onChange={(e) => {
                  setTiltAngle(parseFloat(e.target.value));
                }}
                className="w-20 cursor-pointer"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setRotation(0);
                setZoom(1);
                setTiltAngle(0.6);
              }}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
              title="Reset View"
              type="button"
            >
              <FiRefreshCw size={16} />
            </button>

            {/* Download and Save Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadChart(chartRef);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} cursor-pointer`}
                title="Download as PNG"
                type="button"
              >
                <FiDownload size={16} />
                <span className="text-sm">Download</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveToNewDashboard();
                }}
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
        </div>

        {/* Chart and Legend Container - Scrollable Preview */}
        <div className="flex-1 flex flex-col min-h-0 max-h-full">
          {/* Scrollable Chart Preview Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '600px' }}>
            <div className="flex flex-col">
              {/* Chart Canvas */}
              <div className="flex items-center justify-center py-4" style={{ minHeight: '400px' }}>
                <canvas 
                  ref={chartRef} 
                  className="max-w-full"
                  style={{ 
                    width: 'auto', 
                    height: 'auto',
                    maxHeight: '400px'
                  }} 
                />
              </div>
              
              {/* Legend - No height restrictions */}
              <div className="px-4 pb-4">
                <div className="w-full">
                  <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Legend ({legendData.length} items)
                  </h4>
                  <div 
                    className={`border rounded-lg p-3 ${
                      darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {legendData.length === 0 ? (
                      <div className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No legend data available
                      </div>
                    ) : (
                      <div className={`grid gap-2 text-xs ${getGridCols()}`}>
                        {legendData.map((item, index) => (
                          <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}>
                            <div 
                              className="w-3 h-3 rounded-sm flex-shrink-0 border"
                              style={{ 
                                backgroundColor: item.color,
                                borderColor: darkMode ? '#4b5563' : '#d1d5db'
                              }}
                            />
                            <span 
                              className={`text-xs leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                              style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                fontSize: '11px'
                              }}
                              title={`${item.label}: ${item.percentage}% (${item.value})`}
                            >
                              {item.label}: {item.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Summary for many items */}
                    {legendData.length > 8 && (
                      <div className={`text-xs mt-3 pt-2 text-center border-t ${
                        darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-300'
                      }`} style={{ fontSize: '10px' }}>
                        {legendData.length} categories • Total: {total.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Pie and Doughnut Chart Renderer with 3D-like features
  const renderEnhancedPieChart = () => {
    // Calculate legend data (same as 3D pie chart)
    const values = data?.map(d => parseFloat(d[yAxis]) || 0) || [];
    const total = values.reduce((sum, val) => sum + val, 0);
    const legendData = data?.map((item, index) => ({
      label: item[xAxis],
      value: values[index],
      percentage: total > 0 ? ((values[index] / total) * 100).toFixed(1) : '0',
      color: `hsl(${(index * 360) / data.length}, ${75 - (index % 3) * 5}%, ${65 + (index % 2) * 8}%)`
    })) || [];

    // Enhanced grid calculation for better overflow handling
    const getGridCols = () => {
      if (legendData.length <= 4) return 'grid-cols-1 md:grid-cols-2';
      if (legendData.length <= 8) return 'grid-cols-2 md:grid-cols-3';
      if (legendData.length <= 12) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      if (legendData.length <= 20) return 'grid-cols-3 md:grid-cols-4';
      return 'grid-cols-3 md:grid-cols-4';
    };

    const chartData = {
      labels: data?.map(d => d[xAxis]) || [],
      datasets: [{
        data: values,
        backgroundColor: legendData.map(item => item.color),
        borderColor: darkMode ? '#4b5563' : '#ffffff',
        borderWidth: 2,
        hoverOffset: chartType === 'pie' ? 10 : 8
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: getColorScheme().text,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: false, // We'll use custom legend with scroll
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: getColorScheme().text,
          bodyColor: getColorScheme().text,
          borderColor: getColorScheme().primary,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        duration: chartControls.enableAnimation !== false ? 750 : 0,
        onComplete: function() {
          pieChartInstanceRef.current = this;
        }
      }
    };

    const ChartComponent = chartType === 'doughnut' ? Doughnut : Pie;

    return (
      <div className="w-full h-full flex flex-col">
        {/* Enhanced Controls with Zoom */}
        <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Zoom Controls for Pie/Doughnut */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Zoom:
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPieZoom(prev => Math.max(0.5, prev - 0.1));
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Zoom Out"
                type="button"
              >
                <FiZoomOut size={16} />
              </button>
              <span className={`text-xs px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Math.round(pieZoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPieZoom(prev => Math.min(1.5, prev + 0.1));
                }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
                title="Zoom In"
                type="button"
              >
                <FiZoomIn size={16} />
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPieZoom(1);
              }}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'} border cursor-pointer`}
              title="Reset Zoom"
              type="button"
            >
              <FiRefreshCw size={16} />
            </button>

            {/* Download and Save Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadChart(null, pieChartInstanceRef.current);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} cursor-pointer`}
                title="Download as PNG"
                type="button"
              >
                <FiDownload size={16} />
                <span className="text-sm">Download</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveToNewDashboard();
                }}
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
        </div>

        {/* Chart and Legend Container - Scrollable like 3D pie */}
        <div className="flex-1 flex flex-col min-h-0 max-h-full">
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '600px' }}>
            <div className="flex flex-col">
              {/* Chart Area with proper zoom handling */}
              <div className="flex items-center justify-center py-4" style={{ 
                minHeight: `${400 * pieZoom}px`, 
                overflow: 'hidden',
                padding: `${20 * pieZoom}px`
              }}>
                <div style={{ 
                  width: `${500 * pieZoom}px`, 
                  height: `${400 * pieZoom}px`, 
                  maxWidth: 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <ChartComponent 
                    data={chartData} 
                    options={chartOptions}
                    ref={(chart) => { 
                      if (chart) {
                        pieChartInstanceRef.current = chart;
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Enhanced Legend with Scroll - Same as 3D pie chart */}
              <div className="px-4 pb-4">
                <div className="w-full">
                  <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Legend ({legendData.length} items)
                  </h4>
                  <div 
                    className={`border rounded-lg p-3 ${
                      darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {legendData.length === 0 ? (
                      <div className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No legend data available
                      </div>
                    ) : (
                      <div className={`grid gap-2 text-xs ${getGridCols()}`}>
                        {legendData.map((item, index) => (
                          <div key={index} className={`flex items-center space-x-2 p-2 rounded ${
                            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}>
                            <div 
                              className="w-3 h-3 rounded-sm flex-shrink-0 border"
                              style={{ 
                                backgroundColor: item.color,
                                borderColor: darkMode ? '#4b5563' : '#d1d5db'
                              }}
                            />
                            <span 
                              className={`text-xs leading-tight ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                              style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                fontSize: '11px'
                              }}
                              title={`${item.label}: ${item.percentage}% (${item.value})`}
                            >
                              {item.label}: {item.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Summary for many items */}
                    {legendData.length > 8 && (
                      <div className={`text-xs mt-3 pt-2 text-center border-t ${
                        darkMode ? 'text-gray-400 border-gray-600' : 'text-gray-500 border-gray-300'
                      }`} style={{ fontSize: '10px' }}>
                        {legendData.length} categories • Total: {total.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3D Column Chart Renderer with static 3D view
  const render3DColumnChart = () => {
    const canvasRef = useRef(null);

    // 3D column chart rendering effect
    useEffect(() => {
      if (chartType !== '3d-column' || !canvasRef.current || !data || data.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Get container dimensions
      const container = canvas.parentElement;
      const containerWidth = container?.offsetWidth || 600;
      const containerHeight = container?.offsetHeight || 400;
      
      // Responsive canvas sizing
      const width = canvas.width = Math.min(containerWidth * 0.95, 800);
      const height = canvas.height = Math.min(containerHeight * 0.85, 500);

      // Margins for axis and labels
      const marginLeft = 60;
      const marginRight = 40;
      const marginTop = 40;
      const marginBottom = 60;

      // Calculate data
      const values = data.map(d => {
        const val = parseFloat(d[yAxis]);
        return isNaN(val) ? 0 : val;
      });
      const labels = data.map(d => d[xAxis] || 'Unknown');
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);

      // 3D column parameters
      const chartWidth = width - marginLeft - marginRight;
      const chartHeight = height - marginTop - marginBottom;
      const baseY = height - marginBottom; // Flat X-axis at bottom
      // Dynamically calculate column width/spacing
      const minColWidth = 6;
      const maxColWidth = 30;
      let columnWidth = Math.max(minColWidth, Math.min(maxColWidth, chartWidth / (data.length * 1.3)));
      let spacing = columnWidth * 1.3;
      // If still doesn't fit, squeeze more
      if (spacing * (data.length - 1) + columnWidth > chartWidth) {
        spacing = (chartWidth - columnWidth) / (data.length - 1);
      }
      const columnDepth = Math.max(8, Math.min(18, columnWidth * 0.6)); // Depth proportional to width
      const maxHeight = chartHeight * 0.7;
      const startX = marginLeft + (chartWidth - (data.length - 1) * spacing - columnWidth) / 2;

      // Color palettes
      const colors = data.map((_, i) => {
        const hue = (i * 360) / data.length;
        const saturation = 75 - (i % 3) * 5;
        const lightness = 65 + (i % 2) * 8;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      });
      const shadowColors = data.map((_, i) => {
        const hue = (i * 360) / data.length;
        const saturation = 75 - (i % 3) * 5;
        return `hsl(${hue}, ${saturation}%, 40%)`;
      });
      const highlightColors = data.map((_, i) => {
        const hue = (i * 360) / data.length;
        const saturation = 75 - (i % 3) * 5;
        return `hsl(${hue}, ${saturation}%, 75%)`;
      });

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw X-axis (horizontal line)
      ctx.strokeStyle = darkMode ? '#f3f4f6' : '#1f2937';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marginLeft, baseY);
      ctx.lineTo(width - marginRight, baseY);
      ctx.stroke();

      // Draw 3D columns
      data.forEach((item, index) => {
        const value = values[index];
        const normalizedHeight = maxValue > 0 ? (value - minValue) / (maxValue - minValue) : 0.5;
        const colHeight = normalizedHeight * maxHeight;
        const x = startX + index * spacing;
        const y = baseY;

        // 3D corners (isometric)
        const corners = [
          { x: x, y: y },
          { x: x + columnWidth, y: y },
          { x: x + columnWidth + columnDepth, y: y - columnDepth },
          { x: x + columnDepth, y: y - columnDepth },
          { x: x, y: y - colHeight },
          { x: x + columnWidth, y: y - colHeight },
          { x: x + columnWidth + columnDepth, y: y - colHeight - columnDepth },
          { x: x + columnDepth, y: y - colHeight - columnDepth }
        ];

        // Draw right face (shadow)
        ctx.fillStyle = shadowColors[index];
        ctx.beginPath();
        ctx.moveTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[6].x, corners[6].y);
        ctx.lineTo(corners[5].x, corners[5].y);
        ctx.closePath();
        ctx.fill();

        // Draw left face (highlight)
        ctx.fillStyle = highlightColors[index];
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.lineTo(corners[7].x, corners[7].y);
        ctx.lineTo(corners[4].x, corners[4].y);
        ctx.closePath();
        ctx.fill();

        // Draw top face (lightest)
        ctx.fillStyle = colors[index];
        ctx.beginPath();
        ctx.moveTo(corners[4].x, corners[4].y);
        ctx.lineTo(corners[5].x, corners[5].y);
        ctx.lineTo(corners[6].x, corners[6].y);
        ctx.lineTo(corners[7].x, corners[7].y);
        ctx.closePath();
        ctx.fill();

        // Draw front face if column is thin (to avoid hollow look)
        if (columnWidth < 12) {
          ctx.fillStyle = colors[index];
          ctx.beginPath();
          ctx.moveTo(corners[0].x, corners[0].y);
          ctx.lineTo(corners[1].x, corners[1].y);
          ctx.lineTo(corners[5].x, corners[5].y);
          ctx.lineTo(corners[4].x, corners[4].y);
          ctx.closePath();
          ctx.globalAlpha = 0.7;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Draw borders for definition
        ctx.strokeStyle = darkMode ? '#4b5563' : '#ffffff';
        ctx.lineWidth = 1;
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        edges.forEach(([start, end]) => {
          ctx.beginPath();
          ctx.moveTo(corners[start].x, corners[start].y);
          ctx.lineTo(corners[end].x, corners[end].y);
          ctx.stroke();
        });

        // Draw value label on top
        if (colHeight > 30 && columnWidth > 10) {
          ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const centerTopX = (corners[4].x + corners[5].x + corners[6].x + corners[7].x) / 4;
          const centerTopY = (corners[4].y + corners[5].y + corners[6].y + corners[7].y) / 4;
          const displayValue = isNaN(value) ? 'N/A' : value.toLocaleString();
          ctx.fillText(displayValue, centerTopX, centerTopY - 5);
        }
      });

      // Draw X-axis labels (smaller font for many columns)
      ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = data.length > 25 ? '10px Arial' : '13px Arial';
      ctx.textAlign = 'center';
      data.forEach((item, index) => {
        const x = startX + index * spacing + columnWidth / 2;
        const labelText = String(labels[index] || `Item ${index + 1}`);
        let displayText = labelText.length > 10 ? labelText.substring(0, 10) + '...' : labelText;
        if (data.length > 25 && displayText.length > 6) displayText = displayText.substring(0, 6) + '...';
        ctx.fillText(displayText, x, baseY + 22);
      });

      // Draw Y-axis label
      ctx.save();
      ctx.translate(30, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '14px Arial';
      ctx.fillStyle = darkMode ? '#f3f4f6' : '#1f2937';
      ctx.textAlign = 'center';
      ctx.fillText(yAxis, 0, 0);
      ctx.restore();
    }, [data, xAxis, yAxis, darkMode]);

    return (
      <div className="w-full h-full flex flex-col">
        {/* Simple Controls - Only Download and Save */}
        <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                downloadChart(canvasRef, null);
              }}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} cursor-pointer`}
              title="Download as PNG"
              type="button"
            >
              <FiDownload size={16} />
              <span className="text-sm">Download</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveToNewDashboard();
              }}
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

        {/* 3D Column Chart Canvas */}
        <div className="flex-1 flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            className={`border rounded-lg ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
      </div>
    );
  };

  // Standard Chart.js charts with universal controls (for non-pie charts)
  const renderStandardChart = () => {
    let chartInstance = null;

    const chartData = {
      labels: data?.map(d => d[xAxis]) || [],
      datasets: [{
        label: yAxis,
        data: data?.map(d => parseFloat(d[yAxis]) || 0) || [],
        backgroundColor: getColorScheme().primary,
        borderColor: getColorScheme().primary,
        borderWidth: 2,
        ...(chartType === 'radar' && {
          fill: true,
          pointBackgroundColor: getColorScheme().primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: getColorScheme().primary
        })
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: getColorScheme().text,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: chartType === 'radar',
          position: 'bottom',
          labels: { 
            color: getColorScheme().text,
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: getColorScheme().text,
          bodyColor: getColorScheme().text,
          borderColor: getColorScheme().primary,
          borderWidth: 1
        }
      },
      ...(chartType === 'radar' && {
        scales: {
          r: {
            beginAtZero: true,
            grid: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            angleLines: { color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            ticks: { color: getColorScheme().text }
          }
        }
      }),
      animation: {
        duration: chartControls.enableAnimation !== false ? 750 : 0,
        onComplete: function() {
          chartInstance = this;
        }
      }
    };

    const ChartComponent = {
      'waterfall': Bar,
      'funnel': Bar,
      'gauge': Bar,
      'bubble': Scatter,
      'radar': Radar
    }[chartType] || Bar;

    return (
      <div className="w-full h-full flex flex-col">
        {/* Controls */}
        <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Download and Save Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  downloadChart(null, chartInstance);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} cursor-pointer`}
                title="Download as PNG"
                type="button"
              >
                <FiDownload size={16} />
                <span className="text-sm">Download</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveToNewDashboard();
                }}
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
        </div>

        {/* Chart */}
        <div className="flex-1">
          <ChartComponent 
            data={chartData} 
            options={chartOptions}
            ref={(chart) => { if (chart) chartInstance = chart; }}
          />
        </div>
      </div>
    );
  };

  // Main render function that determines which chart to show
  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>No data available for chart</p>
          </div>
        </div>
      );
    }

    // Enhanced 2D Pie and Doughnut charts with 3D-like features
    if (chartType === 'pie' || chartType === 'doughnut') {
      return renderEnhancedPieChart();
    }

    // 3D Pie Chart
    if (chartType === '3d-pie') {
      return render3DPieChart();
    }

    // 3D Column Chart
    if (chartType === '3d-column') {
      return render3DColumnChart();
    }

    // Standard Chart.js charts
    return renderStandardChart();
  };

  return <div className="w-full h-full">{renderChart()}</div>;
});

AdvancedChartRenderer.displayName = 'AdvancedChartRenderer';

export default AdvancedChartRenderer; 