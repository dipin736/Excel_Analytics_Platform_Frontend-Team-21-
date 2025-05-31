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
  FiCheck
} from 'react-icons/fi';
import DynamicChart from './DynamicChart';
import {
  getChartMetadata,
  getChartData,
  saveChartConfiguration,
  validateChartConfig,
  formatChartDataForChartJS
} from '../../services/chartApi';

const ChartBuilder = ({ excelId, dashboardId, onClose, darkMode }) => {
  // State management
  const [metadata, setMetadata] = useState(null);
  const [chartConfig, setChartConfig] = useState({
    title: '',
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    zAxis: '',
    sheetIndex: 0,
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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Chart type options
  const chartTypes = [
    { type: 'bar', label: 'Bar Chart', icon: FiBarChart2, color: 'bg-blue-500' },
    { type: 'line', label: 'Line Chart', icon: FiTrendingUp, color: 'bg-green-500' },
    { type: 'pie', label: 'Pie Chart', icon: FiPieChart, color: 'bg-purple-500' },
    { type: 'scatter', label: 'Scatter Plot', icon: FiCircle, color: 'bg-orange-500' },
    { type: 'area', label: 'Area Chart', icon: FiTrendingUp, color: 'bg-teal-500' },
    { type: 'doughnut', label: 'Doughnut', icon: FiPieChart, color: 'bg-pink-500' }
  ];

  // Load chart metadata on component mount
  useEffect(() => {
    loadChartMetadata();
  }, [excelId]);

  // Load chart data when configuration changes
  useEffect(() => {
    if (chartConfig.xAxis && chartConfig.yAxis && chartConfig.chartType) {
      loadChartData();
    }
  }, [chartConfig.xAxis, chartConfig.yAxis, chartConfig.zAxis, chartConfig.chartType, chartConfig.sheetIndex]);

  // Validate configuration when it changes
  useEffect(() => {
    const validation = validateChartConfig(chartConfig);
    setValidationErrors(validation.errors);
  }, [chartConfig]);

  const loadChartMetadata = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getChartMetadata(excelId);
      if (result.success) {
        setMetadata(result.data);
        // Auto-select first available columns if none selected
        if (result.data.fields && result.data.fields.length > 0) {
          setChartConfig(prev => ({
            ...prev,
            xAxis: prev.xAxis || result.data.fields[0].name,
            yAxis: prev.yAxis || (result.data.fields.find(f => f.type === 'numeric')?.name || result.data.fields[1]?.name)
          }));
        }
      } else {
        setError(result.error);
        toast.error('Failed to load chart metadata');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error loading chart metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async () => {
    if (!chartConfig.xAxis || !chartConfig.yAxis) return;

    setIsLoadingData(true);
    setError(null);

    try {
      const params = {
        chartType: chartConfig.chartType,
        xAxis: chartConfig.xAxis,
        yAxis: chartConfig.yAxis,
        zAxis: chartConfig.zAxis,
        sheetIndex: chartConfig.sheetIndex.toString()
      };

      const result = await getChartData(excelId, params);
      if (result.success) {
        const formattedData = formatChartDataForChartJS(result.data, chartConfig.chartType);
        setChartData(formattedData);
      } else {
        setError(result.error);
        toast.error('Failed to load chart data');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Error loading chart data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setChartConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (setting, value) => {
    setChartConfig(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleSaveChart = async () => {
    const validation = validateChartConfig(chartConfig);
    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    if (!chartData) {
      toast.error('No chart data available to save');
      return;
    }

    setIsLoading(true);

    try {
      const configToSave = {
        ...chartConfig,
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

  const handleRefreshData = () => {
    loadChartData();
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

  if (isLoading && !metadata) {
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
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Chart Title
                      </label>
                      <input
                        type="text"
                        value={chartConfig.title}
                        onChange={(e) => handleConfigChange('title', e.target.value)}
                        placeholder="Enter chart title"
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    {/* Chart Type Selection */}
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Chart Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {chartTypes.map(({ type, label, icon: Icon, color }) => (
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

                  {/* Axis Configuration */}
                  {metadata && metadata.fields && (
                    <div>
                      <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Axis Configuration
                      </h3>
                      
                      {/* Sheet Selection */}
                      {metadata.sheets && metadata.sheets.length > 1 && (
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
                            {metadata.sheets.map((sheet, index) => (
                              <option key={index} value={index}>
                                {sheet.name} ({sheet.rowCount} rows)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* X-Axis */}
                      <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          X-Axis (Categories)
                        </label>
                        <select
                          value={chartConfig.xAxis}
                          onChange={(e) => handleConfigChange('xAxis', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="">Select X-Axis</option>
                          {metadata.fields.map((field) => (
                            <option key={field.name} value={field.name}>
                              {field.name} ({field.type}) {field.type === 'numeric' ? '🔢' : '🔤'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Y-Axis */}
                      {chartConfig.chartType !== 'pie' && chartConfig.chartType !== 'doughnut' && (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Y-Axis (Values)
                          </label>
                          <select
                            value={chartConfig.yAxis}
                            onChange={(e) => handleConfigChange('yAxis', e.target.value)}
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Y-Axis</option>
                            {metadata.fields.filter(f => f.type === 'numeric').map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name} ({field.type}) 🔢
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Z-Axis for 3D charts */}
                      {chartConfig.chartType === '3d' && (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Z-Axis (Depth)
                          </label>
                          <select
                            value={chartConfig.zAxis}
                            onChange={(e) => handleConfigChange('zAxis', e.target.value)}
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                              darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select Z-Axis</option>
                            {metadata.fields.filter(f => f.type === 'numeric').map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name} ({field.type}) 🔢
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Chart Settings */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Chart Settings
                    </h3>
                    
                    <div className="space-y-3">
                      {Object.entries(chartConfig.settings).map(([key, value]) => (
                        <label key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleSettingsChange(key, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <FiAlertCircle className="text-red-500 mr-2" />
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Configuration Issues
                        </h4>
                      </div>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                {isLoadingData && (
                  <FiLoader className="animate-spin text-indigo-600" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefreshData}
                  disabled={isLoadingData}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Refresh Data"
                >
                  <FiRefreshCw className={isLoadingData ? 'animate-spin' : ''} />
                </button>
                
                <div className="relative group">
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                    title="Export Chart"
                  >
                    <FiDownload />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => handleExportChart('png')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={() => handleExportChart('json')}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                    >
                      Export Config
                    </button>
                  </div>
                </div>
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
                    data={chartData.datasets[0]?.data || []}
                    chartType={chartConfig.chartType}
                    xAxis={chartConfig.xAxis}
                    yAxis={chartConfig.yAxis}
                    darkMode={darkMode}
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