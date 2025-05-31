import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCopy,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiCircle,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiSave
} from 'react-icons/fi';
import DynamicChart from './DynamicChart';
import {
  updateChartConfiguration,
  deleteChart,
  getChartData,
  validateChartConfig
} from '../../services/chartApi';

const ChartManager = ({ dashboardId, charts, onChartsUpdate, darkMode }) => {
  const [editingChart, setEditingChart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewChart, setPreviewChart] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Chart type icons mapping
  const chartTypeIcons = {
    bar: FiBarChart2,
    line: FiTrendingUp,
    pie: FiPieChart,
    scatter: FiCircle,
    area: FiTrendingUp,
    doughnut: FiPieChart
  };

  // Validate chart configuration when editing
  useEffect(() => {
    if (editingChart) {
      const validation = validateChartConfig(editingChart);
      setValidationErrors(validation.errors);
    }
  }, [editingChart]);

  const handleEditChart = (chart) => {
    setEditingChart({ ...chart });
  };

  const handleUpdateChart = async () => {
    if (!editingChart) return;

    const validation = validateChartConfig(editingChart);
    if (!validation.isValid) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateChartConfiguration(
        dashboardId,
        editingChart.id || editingChart._id,
        editingChart
      );

      if (result.success) {
        toast.success('Chart updated successfully!');
        setEditingChart(null);
        onChartsUpdate(); // Refresh charts list
      } else {
        toast.error(result.error || 'Failed to update chart');
      }
    } catch (err) {
      toast.error('Error updating chart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChart = async (chartId) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await deleteChart(dashboardId, chartId);

      if (result.success) {
        toast.success('Chart deleted successfully!');
        onChartsUpdate(); // Refresh charts list
      } else {
        toast.error(result.error || 'Failed to delete chart');
      }
    } catch (err) {
      toast.error('Error deleting chart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateChart = (chart) => {
    const duplicatedChart = {
      ...chart,
      title: `${chart.title} (Copy)`,
      id: undefined,
      _id: undefined,
      createdAt: new Date().toISOString()
    };
    setEditingChart(duplicatedChart);
  };

  const handleExportChart = (chart, format) => {
    if (format === 'png') {
      // This would need to be implemented with a canvas reference
      toast.info('PNG export functionality needs canvas reference');
    } else if (format === 'json') {
      const dataStr = JSON.stringify(chart, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${chart.title || 'chart'}-config.json`;
      link.click();
    }
  };

  const handleConfigChange = (field, value) => {
    setEditingChart(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (setting, value) => {
    setEditingChart(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  if (!charts || charts.length === 0) {
    return (
      <div className="text-center py-12">
        <FiBarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          No charts available
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Create your first chart to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {charts.map((chart, index) => {
          const IconComponent = chartTypeIcons[chart.chartType] || FiBarChart2;
          
          return (
            <motion.div
              key={chart.id || chart._id || index}
              className={`rounded-xl border shadow-sm overflow-hidden ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              {/* Chart Preview */}
              <div className={`h-48 p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'}`}>
                {chart.data ? (
                  <DynamicChart
                    data={chart.data.datasets?.[0]?.data || []}
                    chartType={chart.chartType}
                    xAxis={chart.xAxis}
                    yAxis={chart.yAxis}
                    darkMode={darkMode}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <IconComponent className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Chart Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold truncate ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {chart.title || 'Untitled Chart'}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {chart.chartType}
                  </span>
                </div>

                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {chart.xAxis} vs {chart.yAxis}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewChart(chart)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Preview"
                    >
                      <FiEye size={16} />
                    </button>

                    <button
                      onClick={() => handleEditChart(chart)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDuplicateChart(chart)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Duplicate"
                    >
                      <FiCopy size={16} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative group">
                      <button
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-700 text-gray-400'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                        title="Export"
                      >
                        <FiDownload size={16} />
                      </button>
                      <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleExportChart(chart, 'json')}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          Export JSON
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteChart(chart.id || chart._id)}
                      disabled={isLoading}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-red-900/50 text-red-400'
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Chart Modal */}
      <AnimatePresence>
        {editingChart && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
              darkMode ? 'bg-black/70' : 'bg-black/30'
            } backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Edit Chart
                </h2>
                <button
                  onClick={() => setEditingChart(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {/* Chart Title */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Chart Title
                    </label>
                    <input
                      type="text"
                      value={editingChart.title || ''}
                      onChange={(e) => handleConfigChange('title', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter chart title"
                    />
                  </div>

                  {/* Chart Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Chart Type
                    </label>
                    <select
                      value={editingChart.chartType || 'bar'}
                      onChange={(e) => handleConfigChange('chartType', e.target.value)}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="scatter">Scatter Plot</option>
                      <option value="area">Area Chart</option>
                      <option value="doughnut">Doughnut Chart</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Description
                    </label>
                    <textarea
                      value={editingChart.description || ''}
                      onChange={(e) => handleConfigChange('description', e.target.value)}
                      rows={3}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-gray-200'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter chart description"
                    />
                  </div>

                  {/* Chart Settings */}
                  {editingChart.settings && (
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Chart Settings
                      </label>
                      <div className="space-y-2">
                        {Object.entries(editingChart.settings).map(([key, value]) => (
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
                  )}

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
              </div>

              {/* Modal Footer */}
              <div className={`flex items-center justify-between p-6 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {validationErrors.length === 0 && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <FiCheck className="mr-1" />
                      <span className="text-sm">Ready to save</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setEditingChart(null)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdateChart}
                    disabled={isLoading || validationErrors.length > 0}
                    className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      isLoading || validationErrors.length > 0
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
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Chart Modal */}
      <AnimatePresence>
        {previewChart && (
          <motion.div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
              darkMode ? 'bg-black/70' : 'bg-black/30'
            } backdrop-blur-sm`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Preview Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {previewChart.title || 'Chart Preview'}
                </h2>
                <button
                  onClick={() => setPreviewChart(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <div className="h-96">
                  {previewChart.data ? (
                    <DynamicChart
                      data={previewChart.data.datasets?.[0]?.data || []}
                      chartType={previewChart.chartType}
                      xAxis={previewChart.xAxis}
                      yAxis={previewChart.yAxis}
                      darkMode={darkMode}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        No chart data available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChartManager; 