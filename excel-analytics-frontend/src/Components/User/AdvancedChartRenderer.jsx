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
  const canvasRef = useRef(null);
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

  // Helper: Minimum slice angle for visibility
  const MIN_SLICE_ANGLE = 0.04; // ~2.3 degrees

  // Helper: Debounce for controls
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Helper: Color contrast (WCAG)
  function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#1f2937' : '#f9fafb';
  }

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
    let values = data.map(d => parseFloat(d[yAxis]) || 0);
    let total = values.reduce((sum, val) => sum + val, 0);
    let rawPercentages = values.map(val => val / total);
    // Enforce minimum slice angle for visibility
    let percentages = [...rawPercentages];
    let minAngle = MIN_SLICE_ANGLE;
    let deficit = 0;
    percentages = percentages.map(p => {
      if (p * 2 * Math.PI < minAngle) {
        deficit += minAngle - p * 2 * Math.PI;
        return minAngle / (2 * Math.PI);
      }
      return p;
    });
    // Adjust largest slice to compensate
    if (deficit > 0) {
      let maxIdx = percentages.indexOf(Math.max(...percentages));
      percentages[maxIdx] -= deficit / (2 * Math.PI);
    }

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
        
        ctx.save();
        ctx.fillStyle = getContrastYIQ(colors[slice].startsWith('hsl') ? '#ffffff' : colors[slice]);
        ctx.font = `bold ${Math.max(9, Math.min(12, 140 / data.length))}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = darkMode ? '#000000' : '#ffffff';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(`${percentage}%`, labelX, labelY);
        ctx.restore();
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

  // Debounced controls for smoother UX
  const debouncedSetRotation = debounce(setRotation, 50);
  const debouncedSetZoom = debounce(setZoom, 50);
  const debouncedSetTilt = debounce(setTiltAngle, 50);

  // Use effect for keyboard accessibility
  useEffect(() => {
    if (chartType !== '3d-pie') return;
    const handleKey = (e) => {
      if (document.activeElement !== document.body) return;
      if (e.key === 'ArrowLeft') debouncedSetRotation(r => r - Math.PI / 18);
      if (e.key === 'ArrowRight') debouncedSetRotation(r => r + Math.PI / 18);
      if (e.key === '+') debouncedSetZoom(z => Math.min(2, z + 0.1));
      if (e.key === '-') debouncedSetZoom(z => Math.max(0.5, z - 0.1));
      if (e.key.toLowerCase() === 't') debouncedSetTilt(t => Math.max(0.2, Math.min(1, t + 0.1)));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [chartType]);

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
      // Get chart image (for custom canvas charts)
      let previewImage = null;
      if (canvasRef && canvasRef.current) {
        previewImage = canvasRef.current.toDataURL('image/png');
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
        },
        previewImage // Add preview image for dashboard
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

    if (chartType === '3d-pie') {
      return render3DPieChart();
    }
    if (chartType === 'pie' || chartType === 'doughnut') {
      return renderEnhancedPieChart();
    }
    // ... existing code ...
  };

  return <div className="w-full h-full">{renderChart()}</div>;
});

AdvancedChartRenderer.displayName = 'AdvancedChartRenderer';

export default AdvancedChartRenderer; 