import React, { useState, useEffect, useRef } from "react";
import { BaseUrluser } from "../../endpoint/baseurl";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import {
  FiX,
  FiBarChart2,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiTarget,
  FiTrendingUp,
  FiActivity,
  FiLayers,
  FiRefreshCw,
  FiEye,
  FiZap,
  FiCircle
} from "react-icons/fi";
// Removed THREE import - now using Professional3DChart component
import Professional3DChart from "./Professional3DChart";

const ThreeDVisualizer = ({ fileId, onClose, files, darkMode }) => {
  // Add custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: ${darkMode ? '#374151' : '#F3F4F6'};
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${darkMode ? '#4B5563' : '#9CA3AF'};
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${darkMode ? '#6B7280' : '#6B7280'};
      }
      .custom-scrollbar::-webkit-scrollbar-corner {
        background: ${darkMode ? '#374151' : '#F3F4F6'};
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [darkMode]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [zAxis, setZAxis] = useState("");
  const [chartType, setChartType] = useState("3d-bar");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiAnalysisData, setApiAnalysisData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [fullDataset, setFullDataset] = useState([]);
  const [chartRowLimit, setChartRowLimit] = useState(50);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [tableData, setTableData] = useState([]);
  // Removed threeContainerRef - now using Professional3DChart component

  const selectedFile = files?.find((file) => file._id === fileId) || {};
  const sheets = selectedFile?.sheets || [];
  const currentSheet = sheets[selectedSheetIndex] || {};

  // 3D Chart categories
  const chartCategories = {
    "3d": {
      title: "3D Charts",
      icon: FiTarget,
      color: "blue",
      charts: [
        { type: "3d-bar", name: "3D Bar Chart", icon: "📊", description: "Three-dimensional bar visualization" },
        { type: "3d-surface", name: "3D Surface Chart", icon: "🏔️", description: "3D surface mesh visualization" },
        { type: "3d-bubble", name: "3D Bubble Chart", icon: "🫧", description: "3D bubble size visualization" }
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
        toast.success(`Loaded ${data.data.length} rows for 3D analysis!`);
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

  // Process data for 3D chart
  useEffect(() => {
    if (!currentSheet?.previewData || !xAxis || !yAxis || !zAxis) {
      setProcessedData([]);
      return;
    }

    const dataSource = fullDataset.length > 0 ? fullDataset : currentSheet.previewData.slice(1);
    const headers = fullDataset.length > 0 ? Object.keys(fullDataset[0] || {}) : (currentSheet.columns || []);
    
    let formattedData;
    
    if (fullDataset.length > 0) {
      formattedData = dataSource.filter(
        (item) => 
          item[xAxis] !== undefined && 
          item[xAxis] !== null && 
          item[yAxis] !== undefined && 
          item[yAxis] !== null &&
          item[zAxis] !== undefined && 
          item[zAxis] !== null
      );
    } else {
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
          item[yAxis] !== null &&
          item[zAxis] !== undefined && 
          item[zAxis] !== null
      );
    }

    const limitedData = formattedData.slice(0, chartRowLimit);
    setProcessedData(limitedData);
  }, [currentSheet, xAxis, yAxis, zAxis, fullDataset, chartRowLimit]);

  // Load table data when sheet changes
  useEffect(() => {
    if (currentSheet.name) {
      loadTableData(currentPage, itemsPerPage);
    }
  }, [selectedSheetIndex, currentPage, itemsPerPage]);

  // Handle analyze button
  const handleAnalyze = async () => {
    if (!xAxis || !yAxis || !zAxis) {
      toast.error("Please select all three axes (X, Y, Z) for 3D visualization");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sheetName = currentSheet.name;
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/analyze?sheet=${encodeURIComponent(sheetName)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      if (data.success) {
        setApiAnalysisData(data);
        toast.success("3D data analysis completed successfully!");
      } else {
        throw new Error(data.message || "Analysis failed");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message);
      toast.error("Failed to analyze data for 3D visualization");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChartSelect = (chartType) => {
    setChartType(chartType);
    toast.info(`Selected ${chartType} for 3D visualization`);
  };

  const getCategoryColorClasses = (color, selected = false) => {
    const colorMap = {
      blue: selected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100",
      purple: selected ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-600 hover:bg-purple-100",
    };
    return colorMap[color] || colorMap.blue;
  };

  // Removed old Three.js useEffect - now using Professional3DChart component

  const render3DChart = () => {
    if (!processedData.length) {
      return (
        <div className={`flex items-center justify-center h-96 ${darkMode ? "bg-gray-800" : "bg-gray-50"} rounded-lg border-2 border-dashed ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
          <div className="text-center">
            <FiTarget className={`mx-auto h-12 w-12 ${darkMode ? "text-gray-600" : "text-gray-400"} mb-4`} />
            <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Select X, Y, and Z axes to generate 3D visualization
            </p>
          </div>
        </div>
      );
    }

    // Use Professional 3D Chart for all 3D chart types
    if (chartType === "3d-bar" || chartType === "3d-surface" || chartType === "3d-bubble") {
      return (
        <Professional3DChart 
          processedData={processedData}
          xAxis={xAxis}
          yAxis={yAxis}
          zAxis={zAxis}
          darkMode={darkMode}
          chartType={chartType}
        />
      );
    }

    // Fallback for unsupported chart types
    return (
      <div className="w-full flex justify-center items-center min-h-96">
        <div className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          <FiTarget className="mx-auto h-12 w-12 mb-4" />
          <p>Chart type not supported</p>
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? "hover:bg-gray-700" : ""}`}
          >
            <FiX className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiTarget className="h-6 w-6 text-blue-500" />
              3D Chart Analysis
            </h2>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {selectedFile.originalName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={loadFullDataset}
            disabled={isLoadingFullData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              isLoadingFullData 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                : `${darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`
            }`}
            whileHover={!isLoadingFullData ? { scale: 1.05 } : {}}
            whileTap={!isLoadingFullData ? { scale: 0.95 } : {}}
          >
            {isLoadingFullData ? (
              <FiLoader className="h-4 w-4 animate-spin" />
            ) : (
              <FiRefreshCw className="h-4 w-4" />
            )}
            {isLoadingFullData ? "Loading..." : "Load Full Data"}
          </motion.button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <div 
          className={`w-80 border-r ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} p-6 overflow-y-auto custom-scrollbar`} 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode ? '#4B5563 #374151' : '#9CA3AF #F3F4F6',
            maxHeight: 'calc(100vh - 120px)'
          }}>
          {/* Sheet Selection */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Select Sheet
            </h3>
            <div className="space-y-2">
              {sheets.map((sheet, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedSheetIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSheetIndex === index
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : `${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"} border border-gray-200`
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium">{sheet.name}</div>
                  <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {sheet.previewData?.length || 0} rows
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 3D Axis Selection */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              3D Axis Configuration
            </h3>
            
            {/* X-Axis */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                X-Axis
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select X-Axis</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.name}>
                    {col.name} {col.isNumeric ? "(Numeric)" : "(Text)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Y-Axis */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Y-Axis
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select Y-Axis</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.name}>
                    {col.name} {col.isNumeric ? "(Numeric)" : "(Text)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Z-Axis */}
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Z-Axis
              </label>
              <select
                value={zAxis}
                onChange={(e) => setZAxis(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 text-gray-200" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Select Z-Axis</option>
                {columns.map((col) => (
                  <option key={col.key} value={col.name}>
                    {col.name} {col.isNumeric ? "(Numeric)" : "(Text)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Analyze Button */}
            <motion.button
              onClick={handleAnalyze}
              disabled={isLoading || !xAxis || !yAxis || !zAxis}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isLoading || !xAxis || !yAxis || !zAxis
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              }`}
              whileHover={!isLoading && xAxis && yAxis && zAxis ? { scale: 1.02 } : {}}
              whileTap={!isLoading && xAxis && yAxis && zAxis ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <FiZap className="h-4 w-4" />
                  Analyze 3D Data
                </div>
              )}
            </motion.button>
          </div>

          {/* Chart Type Selection */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              3D Chart Types
            </h3>
            <div className="space-y-3">
              {Object.entries(chartCategories).map(([categoryKey, category]) => (
                <div key={categoryKey}>
                  <div className={`flex items-center gap-2 mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <category.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.title}</span>
                  </div>
                  <div className="space-y-2">
                    {category.charts.map((chart) => (
                      <motion.button
                        key={chart.type}
                        onClick={() => handleChartSelect(chart.type)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          chartType === chart.type
                            ? getCategoryColorClasses(category.color, true)
                            : `${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"} border border-gray-200`
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{chart.icon}</span>
                          <div>
                            <div className="font-medium">{chart.name}</div>
                            <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {chart.description}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Controls */}
          <div className="mb-6">
            <h3 className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Data Controls
            </h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Chart Row Limit: {chartRowLimit}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={chartRowLimit}
                  onChange={(e) => setChartRowLimit(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Data Summary */}
          {processedData.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-blue-800"}`}>
                Data Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Total Points:</span> {processedData.length}</p>
                <p><span className="font-medium">Chart Type:</span> {chartType}</p>
                <p><span className="font-medium">X-Axis:</span> {xAxis}</p>
                <p><span className="font-medium">Y-Axis:</span> {yAxis}</p>
                <p><span className="font-medium">Z-Axis:</span> {zAxis}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Chart and Data */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Area with Scroll */}
          <div 
            className="flex-1 p-6 overflow-y-auto custom-scrollbar" 
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 #374151' : '#9CA3AF #F3F4F6',
              maxHeight: 'calc(100vh - 200px)'
            }}>
            {error && (
              <div className={`mb-4 p-4 rounded-lg bg-red-50 border border-red-200 ${darkMode ? "bg-red-900/20 border-red-700" : ""}`}>
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-700 font-medium">Error: {error}</span>
                </div>
              </div>
            )}
            
            {render3DChart()}
          </div>

          {/* Data Table with Scroll */}
          <div 
            className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"} p-6 overflow-y-auto max-h-80 custom-scrollbar`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#4B5563 #374151' : '#9CA3AF #F3F4F6'
            }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                3D Data Preview
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Showing {tableData.length} of {currentSheet.previewData?.length || 0} rows
                </span>
              </div>
            </div>
            
            <div className={`overflow-x-auto rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    {currentSheet.columns?.map((column, index) => (
                      <th
                        key={index}
                        className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          darkMode ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDVisualizer; 