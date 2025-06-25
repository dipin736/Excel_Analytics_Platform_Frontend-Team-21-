import React, { useState, useEffect } from "react";
import { BaseUrluser } from "../../endpoint/baseurl";
import DynamicChart from "./DynamicChart";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import {
  FiX,
  FiBarChart2,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiPieChart,
  FiTrendingUp,
  FiActivity,
  FiTarget,
  FiLayers,
  FiRefreshCw,
  FiEye
} from "react-icons/fi";

const FileAnalyzer = ({ fileId, onClose, files, darkMode, onFilesUpdate }) => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiAnalysisData, setApiAnalysisData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState('basic');

  // New states for enhanced data handling
  const [fullDataset, setFullDataset] = useState([]);
  const [chartRowLimit, setChartRowLimit] = useState(50);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [tableData, setTableData] = useState([]);

  const selectedFile = files?.find((file) => file._id === fileId) || {};
  const sheets = selectedFile?.sheets || [];
  const currentSheet = sheets[selectedSheetIndex] || {};

  // Chart categories for visual display
  const chartCategories = {
    basic: {
      title: "Basic Charts",
      icon: FiBarChart2,
      color: "blue",
      charts: [
        { type: "bar", name: "Bar Chart", icon: "📊", description: "Compare categories" },
        { type: "column", name: "Column Chart", icon: "📈", description: "Vertical bar comparison" },
        { type: "line", name: "Line Chart", icon: "📉", description: "Show trends over time" },
        { type: "area", name: "Area Chart", icon: "🏔️", description: "Filled line chart" },
        { type: "scatter", name: "Scatter Plot", icon: "🔸", description: "Show correlations" }
      ]
    },
    pie: {
      title: "Pie Charts",
      icon: FiPieChart,
      color: "purple",
      charts: [
        { type: "pie", name: "2D Pie Chart", icon: "🥧", description: "Show proportions" },
        { type: "3d-pie", name: "3D Pie Chart", icon: "🎂", description: "Enhanced pie with depth" },
        { type: "doughnut", name: "Doughnut Chart", icon: "🍩", description: "Pie with center hole" }
      ]
    },
    "3d": {
      title: "3D Charts",
      icon: FiLayers,
      color: "green",
      charts: [
        { type: "3d-bar", name: "3D Bar Chart", icon: "🧱", description: "3D bar visualization" },
        { type: "3d-column", name: "3D Column Chart", icon: "🏗️", description: "3D vertical bars" },
        { type: "3d-scatter", name: "3D Scatter Plot", icon: "💎", description: "Three-dimensional data" }
      ]
    },
    professional: {
      title: "Professional Charts",
      icon: FiTarget,
      color: "indigo",
      charts: [
        { type: "waterfall", name: "Waterfall Chart", icon: "💧", description: "Show cumulative changes" },
        { type: "funnel", name: "Funnel Chart", icon: "🎪", description: "Conversion analysis" },
        { type: "gauge", name: "Gauge Chart", icon: "⏱️", description: "KPI dashboard dials" },
        { type: "radar", name: "Radar Chart", icon: "🎯", description: "Multi-dimensional comparison" },
        { type: "bubble", name: "Bubble Chart", icon: "🫧", description: "Three-variable analysis" }
      ]
    }
  };

  // Load full dataset when needed
  const loadFullDataset = async () => {
    if (isLoadingFullData) return;
    
    try {
      setIsLoadingFullData(true);
      const sheetName = currentSheet.name;
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/download-data?sheet=${encodeURIComponent(sheetName)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load full dataset");

      const data = await response.json();
      if (data.success && data.data) {
        setFullDataset(data.data);
        toast.success(`Loaded ${data.data.length} rows successfully!`);
      }
    } catch (err) {
      console.error("Error loading full dataset:", err);
      toast.error("Failed to load full dataset");
    } finally {
      setIsLoadingFullData(false);
    }
  };

  // Load table data with pagination
  const loadTableData = async (page = 1, limit = itemsPerPage) => {
    try {
      const sheetName = currentSheet.name;
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/table-data?sheet=${encodeURIComponent(sheetName)}&page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to load table data");

      const data = await response.json();
      if (data.success) {
        setTableData(data.data || []);
        return data;
      }
    } catch (err) {
      console.error("Error loading table data:", err);
      toast.error("Failed to load table data");
      return null;
    }
  };

  // Get column options
  const getColumns = () => {
    if (!currentSheet.columns) return [];
    return currentSheet.columns
      .map((col, index) => ({
        name: col,
        index,
        key: `${index}_${col}`,
        isNumeric: apiAnalysisData?.analytics?.summary[col]?.type === "numeric",
      }))
      .filter((col) => col.name);
  };

  const columns = getColumns();

  // Process data for chart (with enhanced logic)
  useEffect(() => {
    if (!currentSheet?.previewData || !xAxis || !yAxis) {
      setProcessedData([]);
      return;
    }

    // Use full dataset if available, otherwise use preview data
    const dataSource = fullDataset.length > 0 ? fullDataset : currentSheet.previewData.slice(1);
    const headers = fullDataset.length > 0 ? Object.keys(fullDataset[0] || {}) : (currentSheet.columns || []);
    
    let formattedData;
    
    if (fullDataset.length > 0) {
      // Full dataset is already in object format
      formattedData = dataSource.filter(
        (item) => 
          item[xAxis] !== undefined && 
          item[xAxis] !== null && 
          item[yAxis] !== undefined && 
          item[yAxis] !== null
      );
    } else {
      // Preview data is in array format
      formattedData = dataSource
      .map((row) => {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = row[index];
        });
        return item;
      })
      .filter(
        (item) => 
          item[xAxis] !== undefined && 
          item[xAxis] !== null && 
          item[yAxis] !== undefined && 
          item[yAxis] !== null
      );
    }

    // Apply chart row limit
    const limitedData = formattedData.slice(0, chartRowLimit);
    setProcessedData(limitedData);
  }, [currentSheet, xAxis, yAxis, fullDataset, chartRowLimit]);

  // Load table data when sheet changes
  useEffect(() => {
    if (currentSheet.name) {
      loadTableData(currentPage, itemsPerPage);
    }
  }, [selectedSheetIndex, currentPage, itemsPerPage]);

  // Handle analyze button
  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BaseUrluser}/excel/${fileId}/analyze`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setApiAnalysisData(data);

      if (data?.analytics?.columns?.length > 0) {
        if (!xAxis) {
          setXAxis(data.analytics.columns[0]);
        }
        if (!yAxis && data.analytics.columns.length > 1) {
          const numericCol = data.analytics.columns.find(
            (col) => data.analytics.summary[col]?.type === "numeric"
          );
          if (numericCol) setYAxis(numericCol);
        }
      }

      toast.success("Analysis completed successfully!");
    } catch (err) {
      setError("Error analyzing file: " + err.message);
      console.error("Analysis error:", err);
      toast.error("Failed to analyze file");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle chart selection
  const handleChartSelect = (chartType) => {
    setChartType(chartType);
    if (!xAxis || !yAxis) {
      toast.info("Please select X and Y axes first!");
      return;
    }
  };

  // Get color classes for categories
  const getCategoryColorClasses = (color, selected = false) => {
    const colors = {
      blue: selected 
        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
        : (darkMode ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'),
      purple: selected 
        ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
        : (darkMode ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/70' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'),
      green: selected 
        ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white')
        : (darkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/70' : 'bg-green-50 text-green-700 hover:bg-green-100'),
      indigo: selected 
        ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white')
        : (darkMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/70' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'),
    };
    return colors[color] || colors.blue;
  };

  // Calculate pagination for table data
  const totalDataRows = currentSheet?.rowCount || tableData.length;
  const totalPages = Math.ceil(totalDataRows / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <motion.div 
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${
        darkMode ? 'bg-black/70' : 'bg-black/30'
      } backdrop-blur-sm`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className={`w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto scrollbar-thin ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {selectedFile?.originalName || "File Analysis"}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {sheets[selectedSheetIndex]?.name} • {sheets[selectedSheetIndex]?.rowCount || 0} rows
              </p>
            </div>
            
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Error Display */}
          {error && (
            <div className={`p-3 rounded-lg mb-4 flex items-center ${
              darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-100'
            } border`}>
              <FiAlertCircle className={`mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sheet Selection */}
            {sheets.length > 1 && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Sheet
                </label>
                <select
                  value={selectedSheetIndex}
                  onChange={(e) => {
                    setSelectedSheetIndex(parseInt(e.target.value));
                    setXAxis("");
                    setYAxis("");
                    setFullDataset([]); // Clear full dataset when changing sheets
                  }}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  {sheets.map((sheet, index) => (
                    <option key={index} value={index}>
                      {sheet.name} ({sheet.rowCount} rows)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* X-Axis Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                X-Axis (Categories)
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="">Select X-Axis</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Y-Axis Selection */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Y-Axis (Values)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-200' 
                    : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="">Select Y-Axis</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Analyze Button */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Data Analysis
              </label>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : darkMode 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {isLoading ? (
                  <div className="flex items-center justify-center">
                    <FiLoader className="animate-spin h-5 w-5 mr-2" />
                    Analyzing...
                  </div>
                  ) : (
                  <div className="flex items-center justify-center">
                    <FiActivity className="h-5 w-5 mr-2" />
                    Analyze Data
                  </div>
                  )}
                </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-8">
            {/* Chart Categories Section */}
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                📊 Choose Your Chart Type
              </h3>
              
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
                {Object.entries(chartCategories).map(([categoryKey, category]) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === categoryKey;
                  
                  return (
                    <button
                      key={categoryKey}
                      onClick={() => setSelectedCategory(categoryKey)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        getCategoryColorClasses(category.color, isSelected)
                      }`}
                    >
                      <IconComponent className="h-4 w-4 mr-2" />
                      {category.title}
                    </button>
                  );
                })}
              </div>

              {/* Chart Cards with Scroll */}
              <div className="max-h-64 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pr-2">
                  {chartCategories[selectedCategory].charts.map((chart) => (
                    <motion.button
                      key={chart.type}
                      onClick={() => handleChartSelect(chart.type)}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left hover:scale-105 ${
                        chartType === chart.type
                          ? (darkMode 
                            ? 'border-indigo-500 bg-indigo-900/30 shadow-lg' 
                            : 'border-indigo-500 bg-indigo-50 shadow-lg')
                          : (darkMode 
                            ? 'border-gray-600 bg-gray-700/50 hover:border-gray-500' 
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300')
                      }`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{chart.icon}</div>
                      <h4 className={`font-medium mb-1 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {chart.name}
                      </h4>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {chart.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart Visualization Section */}
          <div className={`rounded-xl border p-6 ${
            darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-xl font-semibold ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
                    📈 Chart Preview
            </h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {chartType ? `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` : 'Select a chart type above'}
                  </p>
                </div>

                {/* Chart Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Row Limit Control */}
                  <div className="flex items-center gap-2">
                    <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Chart Rows:
                    </label>
                    <select
                      value={chartRowLimit}
                      onChange={(e) => setChartRowLimit(Number(e.target.value))}
                      className={`px-2 py-1 text-sm rounded border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-gray-700'
                      }`}
                    >
                      <option value={10}>10 rows</option>
                      <option value={25}>25 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                      <option value={500}>500 rows</option>
                      <option value={1000}>1000 rows</option>
                    </select>
                  </div>

                  {/* Load More Data Button */}
                  <button
                    onClick={loadFullDataset}
                    disabled={isLoadingFullData || fullDataset.length > 0}
                    className={`flex items-center px-3 py-1 text-sm rounded border transition-colors ${
                      fullDataset.length > 0
                        ? (darkMode ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-700')
                        : isLoadingFullData
                          ? 'opacity-50 cursor-not-allowed'
                          : (darkMode 
                            ? 'bg-blue-900/30 border-blue-700 text-blue-400 hover:bg-blue-800/50' 
                            : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100')
                    }`}
                  >
                    {isLoadingFullData ? (
                      <>
                        <FiLoader className="animate-spin h-3 w-3 mr-1" />
                        Loading...
                      </>
                    ) : fullDataset.length > 0 ? (
                      <>
                        <FiEye className="h-3 w-3 mr-1" />
                        {fullDataset.length} rows loaded
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="h-3 w-3 mr-1" />
                        Load Full Data
                      </>
                    )}
                  </button>
                </div>
              </div>


              {/* Row Preview Info */}
              {processedData.length > 0 && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  darkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'
                } border`}>
                  <div className="flex items-center justify-between">
                    <span>
                      📊 Showing {processedData.length} of {
                        fullDataset.length > 0 
                          ? fullDataset.filter(item => item[xAxis] && item[yAxis]).length 
                          : 'unknown'
                      } valid data points
                    </span>
                    {fullDataset.length === 0 && (
                      <span className="text-xs opacity-75">
                        (Limited to preview data - load full dataset for all rows)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="h-80">
              {!xAxis || !yAxis ? (
                <div className={`flex items-center justify-center h-full text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div>
                    <FiBarChart2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select X and Y axes to display chart</p>
                    <p className="text-sm mt-2">Choose your data columns from the controls above</p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FiLoader className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500" />
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Loading chart...
                    </p>
                  </div>
                </div>
              ) : !processedData || processedData.length === 0 ? (
                <div className={`flex items-center justify-center h-full ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div className="text-center">
                    <p className="text-lg">No valid data for selected axes</p>
                      <p className="text-sm mt-2">Try selecting different columns or loading full dataset</p>
                    </div>
                </div>
              ) : (
                <DynamicChart
                  data={processedData}
                  chartType={chartType}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  darkMode={darkMode}
                    title={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
                    chartControls={{
                      showLegend: true,
                      showGrid: true,
                      enableAnimation: true
                    }}
                    config={{
                      theme: 'default',
                      responsive: true
                    }}
                    fileId={fileId}
                    sheetName={currentSheet.name}
                />
              )}
            </div>
          </div>

          {/* Summary Section */}
            <div className={`mt-8 rounded-xl border p-6 ${
            darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
            <h3 className={`text-xl font-semibold mb-6 ${
              darkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              📈 Data Summary & Statistics
            </h3>
            
            <div className="min-h-[300px]">
              {!apiAnalysisData ? (
                <div className={`flex items-center justify-center h-full text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div>
                      <p className="text-lg">Click "Analyze Data" to generate summary statistics</p>
                    <p className="text-sm mt-2">Get detailed insights about your data columns</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(apiAnalysisData?.analytics?.summary || {}).map(([column, stats]) => (
                    <div
                      key={column}
                      className={`p-4 rounded-lg border ${
                        darkMode 
                            ? 'border-gray-600 bg-gray-700/30' 
                            : 'border-gray-200 bg-white/50'
                      }`}
                    >
                      <h4 className={`font-semibold mb-3 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {column}
                      </h4>
                        <div className="space-y-2">
                        <div className={`flex justify-between ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span>Type:</span>
                            <span className="font-medium capitalize">{stats.type}</span>
                        </div>
                        <div className={`flex justify-between ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span>Count:</span>
                          <span className="font-medium">{stats.count}</span>
                        </div>
                        {stats.type === 'numeric' && (
                          <>
                            <div className={`flex justify-between ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <span>Mean:</span>
                              <span className="font-medium">{stats.mean?.toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between ${
                              darkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              <span>Range:</span>
                              <span className="font-medium">{stats.min} - {stats.max}</span>
                            </div>
                          </>
                        )}
                        
                        {stats.uniqueValues && (
                          <div className={`flex justify-between ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            <span>Unique Values:</span>
                            <span className="font-medium">{stats.uniqueValues}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table Section */}
            <div className={`mt-8 rounded-xl border p-6 ${
            darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50/50'
          }`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
              <h3 className={`text-xl font-semibold ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                📋 Data Table
              </h3>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {tableData.length} total rows • Showing {tableData.length} of {tableData.length} rows per page
                    {tableData.length > 10 && (
                      <span className="ml-2 text-blue-500">📜 Scrollable table</span>
                    )}
                  </p>
                </div>
              
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Rows per page:
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                    className={`px-3 py-2 rounded border focus:ring-2 focus:ring-indigo-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                    <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
              </div>
            </div>
            
              <div className="space-y-4">
              {!tableData.length ? (
                  <div className={`flex items-center justify-center h-40 text-center ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div>
                    <p className="text-lg">No data available</p>
                    <p className="text-sm mt-2">Please select a sheet with data</p>
                  </div>
                </div>
              ) : (
                <>
                    <div className={`max-h-64 overflow-auto rounded-lg border ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                    } scrollbar-thin`}>
                    <table className="min-w-full">
                        <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <tr>
                            <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                              darkMode ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              #
                            </th>
                          {columns.map((col) => (
                            <th
                              key={col.key}
                                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                darkMode ? 'text-gray-300' : 'text-gray-500'
                              }`}
                            >
                              {col.name}
                                {col.isNumeric && (
                                  <span className="ml-1 text-blue-500">📊</span>
                                )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${
                        darkMode ? 'divide-gray-600 bg-gray-800' : 'divide-gray-200 bg-white'
                      }`}>
                          {tableData.map((row, rowIndex) => (
                          <tr 
                            key={rowIndex}
                              className={`transition-colors ${
                                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                              }`}
                          >
                              <td className={`px-4 py-3 text-sm font-medium ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {rowIndex + 1}
                              </td>
                            {columns.map((col) => (
                              <td
                                key={`${rowIndex}-${col.key}`}
                                  className={`px-4 py-3 text-sm ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}
                              >
                                  <div className="max-w-xs truncate" title={row[col.name]?.toString() || '—'}>
                                {row[col.name]?.toString() || '—'}
                                  </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                    {/* Pagination - Always visible */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        Showing {tableData.length} of {totalDataRows} total entries
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const newPage = Math.max(currentPage - 1, 1);
                            setCurrentPage(newPage);
                          }}
                          disabled={currentPage === 1}
                          className={`px-3 py-2 rounded border transition-colors ${
                            currentPage === 1
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                          } ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-300' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <FiChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <span className={`px-4 py-2 min-w-[100px] text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Page {currentPage} of {totalPages || 1}
                        </span>
                        
                        <button
                          onClick={() => {
                            const newPage = Math.min(currentPage + 1, totalPages);
                            setCurrentPage(newPage);
                          }}
                          disabled={currentPage === totalPages || totalPages <= 1}
                          className={`px-3 py-2 rounded border transition-colors ${
                            currentPage === totalPages || totalPages <= 1
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                          } ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-300' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <FiChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                </>
              )}
            </div>
          </div>


        </div>

      </motion.div>
    </motion.div>
  );
};

export default FileAnalyzer;