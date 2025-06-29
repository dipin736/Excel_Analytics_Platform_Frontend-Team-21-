import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiCircle,
  FiSave,
  FiRefreshCw,
  FiSettings,
  FiEye,
  FiDownload,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiBox
} from 'react-icons/fi';
import DynamicChart from './DynamicChart';
import {
  saveChartConfiguration,
  validateChartConfig,
  formatChartDataForChartJS
} from '../../services/chartApi';

const ChartBuilder = ({ 
  excelId, 
  dashboardId, 
  onClose, 
  darkMode,
  sheets = [],
  currentSheet,
  selectedSheetIndex = 0,
  columns = [],
  processedData = [],
  apiAnalysisData = null
}) => {
  // State management
  const [chartConfig, setChartConfig] = useState({
    title: '',
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    zAxis: '',
    sheetIndex: selectedSheetIndex,
    description: '',
    settings: {
      showLegend: true,
      showGrid: true,
      animated: true,
      responsive: true
    }
  });
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Add new state variables for row control
  const [previewRowCount, setPreviewRowCount] = useState(5);
  const [maxAvailableRows, setMaxAvailableRows] = useState(processedData.length);
  const [displayData, setDisplayData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Add new state variables for chart controls
  const [chartControls, setChartControls] = useState({
    showLegend: true,
    showGrid: true,
    enableAnimation: true,
    stackedData: false,
    aspectRatio: 2,
    borderWidth: 1,
    tension: 0.4,
    pointRadius: 3,
  });

  // Enhanced chart types including professional Excel-style charts
  const chartTypes = [
    // Basic Charts
    { type: 'bar', label: 'Bar Chart', icon: FiBarChart2, color: 'bg-blue-500' },
    { type: 'column', label: 'Column Chart', icon: FiBarChart2, color: 'bg-blue-600' },
    { type: 'line', label: 'Line Chart', icon: FiTrendingUp, color: 'bg-green-500' },
    { type: 'area', label: 'Area Chart', icon: FiTrendingUp, color: 'bg-teal-500' },
    { type: 'scatter', label: 'Scatter Plot', icon: FiCircle, color: 'bg-orange-500' },
    
    // Pie Charts
    { type: 'pie', label: 'Pie Chart', icon: FiPieChart, color: 'bg-purple-500' },
    { type: 'doughnut', label: 'Doughnut', icon: FiPieChart, color: 'bg-pink-500' },
  ];

  // Add chart style presets
  const chartStylePresets = [
    { name: 'Default', theme: 'default' },
    { name: 'Neon', theme: 'neon' },
    { name: 'Pastel', theme: 'pastel' },
    { name: 'Monochrome', theme: 'monochrome' },
  ];

  // Process data when configuration changes
  useEffect(() => {
    if (chartConfig.xAxis && chartConfig.yAxis && processedData.length > 0) {
      processChartData();
    }
  }, [chartConfig.xAxis, chartConfig.yAxis, chartConfig.chartType, processedData]);

  // Validate configuration when it changes
  useEffect(() => {
    const validation = validateChartConfig(chartConfig);
    setValidationErrors(validation.errors);
  }, [chartConfig]);

  // Add useEffect for handling display data
  useEffect(() => {
    if (processedData.length > 0) {
      setMaxAvailableRows(processedData.length);
      setDisplayData(processedData.slice(0, previewRowCount));
    }
  }, [processedData, previewRowCount]);

  const processChartData = () => {
    try {
      if (!chartConfig.xAxis || !chartConfig.yAxis || processedData.length === 0) {
        setChartData(null);
        return;
      }

      const dataSlice = processedData.slice(0, previewRowCount);
      const colors = getThemeColors(chartConfig.theme || 'default', darkMode, dataSlice.length);

      let formattedData;
      
      if (chartConfig.chartType.startsWith('3d')) {
        // Handle 3D chart data
        formattedData = {
          labels: dataSlice.map(item => item[chartConfig.xAxis]),
          datasets: [{
            label: `${chartConfig.yAxis} vs ${chartConfig.zAxis || 'Z'}`,
            data: dataSlice.map(item => ({
              x: parseFloat(item[chartConfig.xAxis]) || 0,
              y: parseFloat(item[chartConfig.yAxis]) || 0,
              z: parseFloat(item[chartConfig.zAxis]) || 0
            })),
            backgroundColor: colors.background[0],
            borderColor: colors.border
          }]
        };
      } else {
        // Keep existing 2D chart data formatting
        formattedData = {
          labels: dataSlice.map(item => item[chartConfig.xAxis]),
          datasets: [{
            label: chartConfig.yAxis,
            data: dataSlice.map(item => item[chartConfig.yAxis]),
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: chartControls.borderWidth,
            tension: chartControls.tension,
            pointRadius: chartControls.pointRadius,
            fill: chartConfig.chartType === 'area'
          }]
        };
      }

      const options = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: chartControls.aspectRatio,
        animation: {
          duration: chartControls.enableAnimation ? 750 : 0
        },
        plugins: {
          legend: {
            display: chartControls.showLegend
          }
        },
        scales: {
          x: {
            grid: {
              display: chartControls.showGrid
            }
          },
          y: {
            grid: {
              display: chartControls.showGrid
            },
            stacked: chartControls.stackedData
          },
          ...(chartConfig.chartType.startsWith('3d') && {
            z: {
              grid: {
                display: chartControls.showGrid
              }
            }
          })
        }
      };

      setChartData({ ...formattedData, options });
      setError(null);
    } catch (err) {
      setError('Error processing chart data: ' + err.message);
      toast.error('Error processing chart data');
    }
  };

  // Add color theme function
  const getThemeColors = (theme, darkMode, count) => {
    const themes = {
      default: {
        background: darkMode ? [
          "rgba(99, 102, 241, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(14, 165, 233, 0.8)",
          "rgba(20, 184, 166, 0.8)",
        ] : [
          "rgba(99, 102, 241, 0.6)",
          "rgba(168, 85, 247, 0.6)",
          "rgba(236, 72, 153, 0.6)",
          "rgba(14, 165, 233, 0.6)",
          "rgba(20, 184, 166, 0.6)",
        ],
        border: "rgba(99, 102, 241, 1)"
      },
      neon: {
        background: [
          "rgba(0, 255, 255, 0.7)",
          "rgba(255, 0, 255, 0.7)",
          "rgba(255, 255, 0, 0.7)",
          "rgba(0, 255, 0, 0.7)",
          "rgba(255, 128, 0, 0.7)"
        ],
        border: "rgba(255, 255, 255, 1)"
      },
      pastel: {
        background: [
          "rgba(255, 182, 193, 0.7)",
          "rgba(173, 216, 230, 0.7)",
          "rgba(255, 218, 185, 0.7)",
          "rgba(176, 224, 230, 0.7)",
          "rgba(221, 160, 221, 0.7)"
        ],
        border: "rgba(169, 169, 169, 1)"
      },
      monochrome: {
        background: Array(count).fill().map((_, i) => 
          `rgba(128, 128, 128, ${0.3 + (i * 0.1)})`
        ),
        border: "rgba(128, 128, 128, 1)"
      }
    };

    return themes[theme] || themes.default;
  };

  // Add style preset handler
  const handleStylePresetChange = (theme) => {
    setChartConfig(prev => ({
      ...prev,
      theme
    }));
  };

  // Modified validation to include Z-axis for 3D charts
  const validateConfiguration = () => {
    const errors = [];
    
    if (!chartConfig.title?.trim()) {
      errors.push("Chart title is required");
    }
    
    if (!chartConfig.xAxis) {
      errors.push("X-axis selection is required");
    }
    
    if (!chartConfig.yAxis) {
      errors.push("Y-axis selection is required");
    }

    if (chartConfig.chartType.startsWith('3d') && !chartConfig.zAxis) {
      errors.push("Z-axis selection is required for 3D charts");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Update handleConfigChange to include validation
  const handleConfigChange = (field, value) => {
    const newConfig = {
      ...chartConfig,
      [field]: value
    };
    setChartConfig(newConfig);
    
    // Validate after a short delay to avoid too frequent validation
    setTimeout(() => validateConfiguration(), 300);
  };

  // Add validation check before save
  const handleSaveChart = async () => {
    if (!validateConfiguration()) {
      toast.error("Please fix configuration errors before saving");
      return;
    }

    if (!chartData) {
      toast.error('No chart data available to save');
      return;
    }

    setIsLoading(true);

    try {
      // Map chart types for backend compatibility
      const backendChartType = chartConfig.chartType === 'column' ? 'bar' : chartConfig.chartType;
      
      const configToSave = {
        ...chartConfig,
        chartType: backendChartType,
        data: chartData,
        excelId: excelId,
        createdAt: new Date().toISOString()
      };

      const result = await saveChartConfiguration(dashboardId, configToSave);
      if (result.success) {
        toast.success('Chart saved successfully!');
        onClose();
      } else {
        toast.error(result.error || 'Failed to save chart');
      }
    } catch (err) {
      toast.error('Error saving chart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportChart = (format) => {
    if (format === 'png') {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chartConfig.title || 'chart'}-${Date.now()}.png`;
        link.click();
      }
    } else if (format === 'json') {
      const dataStr = JSON.stringify({ config: chartConfig, data: chartData }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chartConfig.title || 'chart'}-config.json`;
      link.click();
    }
  };

  // Add row count handler
  const handlePreviewRowCountChange = (newCount) => {
    const count = parseInt(newCount);
    setPreviewRowCount(count);
    setDisplayData(processedData.slice(0, count));
  };

  // Add chart control handler
  const handleChartControlChange = (control, value) => {
    setChartControls(prev => ({
      ...prev,
      [control]: value
    }));
  };

  if (isLoading && !chartData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 mx-auto mb-4 text-indigo-600" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading chart builder...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        darkMode ? 'bg-black/70' : 'bg-black/30'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={`w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Chart Builder
            </h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Create and customize your data visualization
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                previewMode
                  ? 'bg-indigo-600 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FiEye size={16} />
              <span>Preview</span>
            </button>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Add Validation Errors Display */}
        {validationErrors.length > 0 && (
          <motion.div 
            className={`mx-6 mb-4 p-4 rounded-lg border ${
              darkMode 
                ? 'bg-red-900/30 border-red-800/50 text-red-200' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center mb-2">
              <FiAlertCircle className="mr-2" />
              <h4 className="font-medium">Configuration Issues</h4>
            </div>
            <ul className="space-y-1 text-sm ml-6 list-disc">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </motion.div>
        )}

        <div className="flex h-[calc(95vh-120px)]">
          {/* Configuration Panel */}
          <AnimatePresence>
            {!previewMode && (
              <motion.div
                className={`w-1/3 border-r overflow-y-auto ${
                  darkMode ? 'border-gray-700 bg-gray-900/30' : 'border-gray-200 bg-gray-50/30'
                }`}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
              >
                <div className="p-6 space-y-6">
                  {/* Basic Configuration */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Basic Configuration
                    </h3>
                    
                    {/* Chart Title */}
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Chart Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={chartConfig.title || ''}
                        onChange={(e) => handleConfigChange('title', e.target.value)}
                        placeholder="Enter chart title"
                        className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                          !chartConfig.title && validationErrors.includes("Chart title is required")
                            ? 'border-red-500 bg-red-50/10'
                            : darkMode
                              ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                              : 'bg-white/80 border-gray-200 text-gray-700'
                        }`}
                      />
                      {!chartConfig.title && validationErrors.includes("Chart title is required") && (
                        <p className="mt-1 text-sm text-red-500">Please enter a chart title</p>
                      )}
                    </div>

                    {/* Chart Type Selection */}
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Chart Type
                      </label>
                      
                      {/* 2D Charts Section */}
                      <div className="mb-3">
                        <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          2D Charts
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {chartTypes.filter(chart => !chart.type.startsWith('3d')).map(({ type, label, icon: Icon }) => (
                            <motion.button
                              key={type}
                              onClick={() => handleConfigChange('chartType', type)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                chartConfig.chartType === type
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                  : darkMode
                                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Icon className={`h-5 w-5 mx-auto mb-1 ${
                                chartConfig.chartType === type ? 'text-indigo-600' : darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`} />
                              <span className={`text-xs font-medium ${
                                chartConfig.chartType === type ? 'text-indigo-600' : darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* 3D Charts Section */}
                      <div>
                        <h4 className={`text-sm font-medium mb-2 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          3D Charts
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                            New
                          </span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {chartTypes.filter(chart => chart.type.startsWith('3d')).map(({ type, label, icon: Icon }) => (
                            <motion.button
                              key={type}
                              onClick={() => handleConfigChange('chartType', type)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                chartConfig.chartType === type
                                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                  : darkMode
                                  ? 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Icon className={`h-5 w-5 mx-auto mb-1 ${
                                chartConfig.chartType === type ? 'text-indigo-600' : darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`} />
                              <span className={`text-xs font-medium ${
                                chartConfig.chartType === type ? 'text-indigo-600' : darkMode ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                {label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Axis Configuration */}
                  {sheets && sheets.length > 1 && (
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Axis Configuration
                      </h3>
                      
                      {/* Sheet Selection */}
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sheet
                        </label>
                        <select
                          value={chartConfig.sheetIndex}
                          onChange={(e) => handleConfigChange('sheetIndex', parseInt(e.target.value))}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          {sheets.map((sheet, index) => (
                            <option key={index} value={index}>
                              {sheet.name} ({sheet.rowCount} rows)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* X-Axis */}
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          X-Axis <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={chartConfig.xAxis || ''}
                          onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                          className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                            !chartConfig.xAxis && validationErrors.includes("X-axis selection is required")
                              ? 'border-red-500 bg-red-50/10'
                              : darkMode
                                ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                                : 'bg-white/80 border-gray-200 text-gray-700'
                          }`}
                        >
                          <option value="">Select X-Axis</option>
                          {columns.map((field) => (
                            <option key={`x-${field.name}`} value={field.name}>
                              {field.name} ({field.type}) {field.type === 'numeric' ? '🔢' : '🔤'}
                            </option>
                          ))}
                        </select>
                        {!chartConfig.xAxis && validationErrors.includes("X-axis selection is required") && (
                          <p className="mt-1 text-sm text-red-500">Please select an X-axis</p>
                        )}
                      </div>

                      {/* Y-Axis */}
                      {chartConfig.chartType !== 'pie' && chartConfig.chartType !== 'doughnut' && (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Y-Axis <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={chartConfig.yAxis || ''}
                            onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                            className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              !chartConfig.yAxis && validationErrors.includes("Y-axis selection is required")
                                ? 'border-red-500 bg-red-50/10'
                                : darkMode
                                  ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                                  : 'bg-white/80 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="">Select Y-Axis</option>
                            {columns.filter(f => f.type === 'numeric').map((field) => (
                              <option key={`y-${field.name}`} value={field.name}>
                                {field.name} ({field.type}) 🔢
                              </option>
                            ))}
                          </select>
                          {!chartConfig.yAxis && validationErrors.includes("Y-axis selection is required") && (
                            <p className="mt-1 text-sm text-red-500">Please select a Y-axis</p>
                          )}
                        </div>
                      )}

                      {/* Z-Axis for 3D charts */}
                      {chartConfig.chartType.startsWith('3d') && (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Z-Axis <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={chartConfig.zAxis || ''}
                            onChange={(e) => handleConfigChange('zAxis', e.target.value)}
                            className={`w-full p-2.5 border rounded-lg ${
                              !chartConfig.zAxis && validationErrors.includes("Z-axis selection is required for 3D charts")
                                ? 'border-red-500 bg-red-50/10'
                                : darkMode
                                  ? 'bg-gray-700/80 border-gray-600 text-gray-200'
                                  : 'bg-white/80 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="">Select Z-Axis</option>
                            {columns.filter(col => col.type === 'numeric').map(col => (
                              <option key={`z-${col.name}`} value={col.name}>
                                {col.name} ({col.type}) 🔢
                              </option>
                            ))}
                          </select>
                          {!chartConfig.zAxis && validationErrors.includes("Z-axis selection is required for 3D charts") && (
                            <p className="mt-1 text-sm text-red-500">Please select a Z-axis</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chart Controls Section */}
                  <div className="mb-6">
                    <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                      darkMode ? 'text-gray-200' : 'text-gray-800'
                    }`}>
                      {chartConfig.chartType.startsWith('3d') ? (
                        <>
                          3D Visualization Controls
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
                            New
                          </span>
                        </>
                      ) : 'Chart Controls'}
                    </h3>

                    {chartConfig.chartType.startsWith('3d') ? (
                      <>
                        {/* 3D Rotation Controls */}
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            3D Rotation
                          </label>
                          <div className="grid grid-cols-3 gap-4">
                            {['x', 'y', 'z'].map(axis => (
                              <div key={axis} className="space-y-1">
                                <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {axis.toUpperCase()}-axis rotation
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  value={chartConfig[`rotation${axis.toUpperCase()}`] || 0}
                                  onChange={(e) => handleConfigChange(`rotation${axis.toUpperCase()}`, parseInt(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-xs text-center text-gray-500">
                                  {chartConfig[`rotation${axis.toUpperCase()}`] || 0}°
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3D Depth Control */}
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Depth Intensity
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={chartConfig.depthIntensity || 50}
                            onChange={(e) => handleConfigChange('depthIntensity', parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="text-xs text-center text-gray-500 mt-1">
                            {chartConfig.depthIntensity || 50}%
                          </div>
                        </div>

                        {/* 3D View Settings */}
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={chartConfig.autoRotate || false}
                              onChange={(e) => handleConfigChange('autoRotate', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Auto Rotate
                            </span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={chartConfig.showAxes || true}
                              onChange={(e) => handleConfigChange('showAxes', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Show 3D Axes
                            </span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={chartConfig.showGrid || true}
                              onChange={(e) => handleConfigChange('showGrid', e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Show 3D Grid
                            </span>
                          </label>
                        </div>
                      </>
                    ) : (
                      // Original chart controls for 2D charts
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={chartControls.showLegend}
                            onChange={(e) => handleChartControlChange('showLegend', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Show Legend
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={chartControls.showGrid}
                            onChange={(e) => handleChartControlChange('showGrid', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Show Grid
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={chartControls.enableAnimation}
                            onChange={(e) => handleChartControlChange('enableAnimation', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Enable Animation
                          </span>
                        </label>

                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={chartControls.stackedData}
                            onChange={(e) => handleChartControlChange('stackedData', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Stack Data (Bar/Area)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Add Row Control Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-lg font-semibold ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Data Preview Settings
                      </h3>
                      <select
                        value={previewRowCount}
                        onChange={(e) => handlePreviewRowCountChange(e.target.value)}
                        className={`text-sm px-2 py-1 border rounded ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        <option value={5}>5 rows</option>
                        <option value={10}>10 rows</option>
                        <option value={25}>25 rows</option>
                        <option value={50}>50 rows</option>
                        <option value={100}>100 rows</option>
                      </select>
                    </div>

                    {/* Data Preview Table */}
                    {displayData.length > 0 && (
                      <div className={`overflow-auto rounded-xl shadow-sm border ${
                        darkMode ? 'border-gray-600' : 'border-gray-200/50'
                      }`}>
                        <table className="min-w-full divide-y divide-gray-200/50">
                          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50/80'}>
                            <tr>
                              {columns.map((col) => (
                                <th
                                  key={`header-${col}`}
                                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                    darkMode ? 'text-gray-300' : 'text-gray-500'
                                  }`}
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${
                            darkMode ? 'divide-gray-600 bg-gray-700/50' : 'divide-gray-200/50 bg-white/80'
                          }`}>
                            {displayData.map((row, rowIndex) => (
                              <tr 
                                key={`row-${rowIndex}`} 
                                className={darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-50/50'}
                              >
                                {columns.map((col) => (
                                  <td
                                    key={`cell-${rowIndex}-${col}`}
                                    className={`px-4 py-3 whitespace-nowrap text-sm ${
                                      darkMode ? 'text-gray-200' : 'text-gray-700'
                                    }`}
                                  >
                                    {row[col]?.toString() || (
                                      <span className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
                                        null
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {processedData.length > previewRowCount && (
                      <div className={`mt-2 text-center text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {processedData.length - previewRowCount} more rows available
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chart Preview */}
          <div className={`${previewMode ? 'w-full' : 'w-2/3'} flex flex-col`}>
            {/* Preview Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div className="flex items-center space-x-3">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {chartConfig.title || 'Chart Preview'}
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportChart}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Export Chart"
                >
                  <FiDownload />
                </button>
              </div>
            </div>

            {/* Chart Display */}
            <div className="flex-1 p-6">
              {error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 dark:text-red-400 mb-2">Error loading chart</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
                  </div>
                </div>
              ) : chartData ? (
                <div className="h-full">
                  <DynamicChart
                    data={displayData}
                    chartType={chartConfig.chartType}
                    xAxis={chartConfig.xAxis}
                    yAxis={chartConfig.yAxis}
                    zAxis={chartConfig.zAxis}
                    darkMode={darkMode}
                    chartControls={chartControls}
                    title={chartConfig.title}
                    config={{
                      theme: chartConfig.theme,
                      ...chartConfig.settings
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiBarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">Configure your chart</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Select axes and chart type to see preview
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${
          darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center space-x-2">
            {validationErrors.length === 0 && chartData && (
              <div className="flex items-center text-green-600 dark:text-green-400">
                <FiCheck className="mr-1" />
                <span className="text-sm">Ready to save</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveChart}
              disabled={isLoading || validationErrors.length > 0 || !chartData}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isLoading || validationErrors.length > 0 || !chartData
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave />
                  <span>Save Chart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChartBuilder; 