import React, { useState, useEffect } from "react";
import { BaseUrluser } from "../../endpoint/baseurl";
import DynamicChart from "./DynamicChart";
import { toast } from "react-toastify";
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,FiDownload,
  FiLoader
} from "react-icons/fi";
const FileAnalyzer = ({ fileId, onClose, files,darkMode }) => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiAnalysisData, setApiAnalysisData] = useState(null);

  const selectedFile = files?.find((file) => file._id === fileId) || {};
  const sheets = selectedFile?.sheets || [];
  const currentSheet = sheets[selectedSheetIndex] || {};

  useEffect(() => {
    const processData = () => {
      try {
        if (!currentSheet?.previewData || !xAxis || !yAxis) {
          setProcessedData([]);
          return;
        }

        const headers = currentSheet.columns || [];
        const dataRows = currentSheet.previewData.slice(1);

        const formattedData = dataRows
          .map((row) => {
            const item = {};
            headers.forEach((header, index) => {
              item[header] = row[index];
            });
            return item;
          })
          .filter(
            (item) => item[xAxis] !== undefined && item[yAxis] !== undefined
          );

        setProcessedData(formattedData);
      } catch (err) {
        setError("Error processing data: " + err.message);
        console.error("Processing error:", err);
      }
    };

    processData();
  }, [currentSheet, xAxis, yAxis]);

  // Get column options - MODIFIED VERSION
  const getColumns = () => {
    if (!currentSheet.columns) return [];

    const baseColumns = currentSheet.columns
      .map((col, index) => ({
        name: col,
        index,
        key: `${index}_${col}`,
        isNumeric: apiAnalysisData?.analytics?.summary[col]?.type === "numeric",
      }))
      .filter((col) => col.name);

    return baseColumns;
  };

  const columns = getColumns();
  const dataRows = currentSheet.previewData?.slice(1) || [];

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

      // Auto-select columns if none selected - BUT DON'T CHANGE COLUMN STRUCTURE
      if (!xAxis && data.analytics?.columns?.length > 0) {
        setXAxis(data.analytics.columns[0]);
      }
      if (!yAxis && data.analytics?.columns?.length > 1) {
        const numericCol = data.analytics.columns.find(
          (col) => data.analytics.summary[col]?.type === "numeric"
        );
        if (numericCol) setYAxis(numericCol);
      }
    } catch (err) {
      setError(err.message || "Failed to analyze data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setApiAnalysisData(null);
  }, [currentSheet]);

  const handleSaveDashboard = async () => {
    if (!xAxis || !yAxis || processedData.length === 0) {
      setError(`Please select both X and Y axes and ensure data is available`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const chartTitle = `${xAxis} vs ${yAxis} Chart`; // Generate a default chart title
      const chartDataForPayload = {
        labels: processedData.map((item) => item[xAxis]),
        datasets: [
          {
            label: yAxis,
            data: processedData.map((item) => parseFloat(item[yAxis]) || 0),
          },
        ],
      };

      const dashboardPayload = {
        title: `Dashboard from ${selectedFile?.originalName || "Excel File"}`,
        description: `Created from ${
          selectedFile?.originalName || "Excel File"
        }`,
        charts: [
          {
            title: chartTitle,
            chartType,
            data: chartDataForPayload,
            configuration: {
              xAxisLabel: xAxis,
              yAxisLabel: yAxis,
            },
          },
        ],
        // isPublic: false, // You can set this based on user preference if needed
      };

      const response = await fetch(`${BaseUrluser}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(dashboardPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save dashboard");
      }

      const result = await response.json();
      toast.success("Dashboard saved successfully!");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save dashboard");
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const [layoutMode, setLayoutMode] = useState("split"); 

  const handleDownload = (format) => {
    if (format === "png") {
      const canvas = document.querySelector("canvas");
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `analysis-${Date.now()}.png`;
      link.click();
    } else if (format === "csv") {
      const headers = [xAxis, yAxis].join(",");
      const csvContent = [
        headers,
        ...processedData.map((item) => [item[xAxis], item[yAxis]].join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analysis-${Date.now()}.csv`;
      link.click();
    }
  };


    return (
      <motion.div 
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${darkMode ? 'bg-black/70' : 'bg-black/30'} backdrop-blur-sm`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className={`rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto border ${darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-white/20'} backdrop-blur-lg`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/50">
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Analyzing: {selectedFile?.originalName || "File"}
              </h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {sheets[selectedSheetIndex]?.name} • {sheets[selectedSheetIndex]?.rowCount} rows
              </p>
            </div>
       
          </div>
    
          {/* Status Indicators */}
          <div className="mb-6 space-y-3">
            {error && (
              <motion.div 
                className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50/80 border-red-100'} border`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`p-1.5 rounded-full mr-3 ${darkMode ? 'bg-red-800/50' : 'bg-red-100'}`}>
                  <FiX className={darkMode ? 'text-red-400' : 'text-red-600'} />
                </div>
                <p className={darkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
              </motion.div>
            )}
    
            {isLoading && (
              <motion.div 
                className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50/80 border-blue-100'} border`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div 
                  className={`p-1.5 rounded-full mr-3 ${darkMode ? 'bg-blue-800/50' : 'bg-blue-100'}`}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <FiLoader className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                </motion.div>
                <p className={darkMode ? 'text-blue-300' : 'text-blue-700'}>Processing your data...</p>
              </motion.div>
            )}
          </div>
    
          {/* Layout Controls */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { mode: "split", label: "Split View", icon: <FiPieChart className="mr-1.5" /> },
              { mode: "summary", label: "Summary", icon: <FiFileText className="mr-1.5" /> },
              { mode: "chart", label: "Chart", icon: <FiBarChart2 className="mr-1.5" /> },
              { mode: "table", label: "Table", icon: <FiFileText className="mr-1.5" /> }
            ].map(({ mode, label, icon }) => (
              <motion.button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`px-3 py-1.5 rounded-lg flex items-center text-sm font-medium transition-colors ${
                  layoutMode === mode 
                    ? darkMode 
                      ? "bg-indigo-700 text-white shadow-md" 
                      : "bg-indigo-600 text-white shadow-md"
                    : darkMode 
                      ? "bg-gray-700/80 border border-gray-600 text-gray-200 hover:bg-gray-600" 
                      : "bg-white/80 border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </div>
    
          {/* Sheet Selection */}
          {sheets.length > 1 && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Sheet
              </label>
              <select
                value={selectedSheetIndex}
                onChange={(e) => {
                  setSelectedSheetIndex(parseInt(e.target.value));
                  setXAxis("");
                  setYAxis("");
                }}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  darkMode 
                    ? 'bg-gray-700/80 border-gray-600 text-gray-200' 
                    : 'bg-white/80 border-gray-200 text-gray-700'
                }`}
                disabled={isLoading}
              >
                {sheets.map((sheet, index) => (
                  <option key={`sheet-${index}`} value={index}>
                    {sheet.name} ({sheet.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>
          )}
    
          {/* Column Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                X-Axis (Categories)
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  darkMode 
                    ? 'bg-gray-700/80 border-gray-600 text-gray-200' 
                    : 'bg-white/80 border-gray-200 text-gray-700'
                }`}
                disabled={isLoading || columns.length === 0}
              >
                <option value="">Select column</option>
                {columns.map((col) => (
                  <option key={`x-${col.key}`} value={col.name}>
                    {col.name} {col.type === "numeric" ? "🔢" : "🔤"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Y-Axis (Values)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                  darkMode 
                    ? 'bg-gray-700/80 border-gray-600 text-gray-200' 
                    : 'bg-white/80 border-gray-200 text-gray-700'
                }`}
                disabled={isLoading || columns.length === 0}
              >
                <option value="">Select column</option>
                {columns.map((col) => (
                  <option key={`y-${col.key}`} value={col.name}>
                    {col.name} {col.type === "numeric" ? "🔢" : "🔤"}
                  </option>
                ))}
              </select>
            </div>
          </div>
    
          {/* Chart Type Selection */}
          {layoutMode === "chart" && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Chart Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: "bar", label: "Bar", color: "bg-blue-500" },
                  { type: "pie", label: "Pie", color: "bg-purple-500" },
                  { type: "line", label: "Line", color: "bg-green-500" },
                  { type: "scatter", label: "Scatter", color: "bg-orange-500" }
                ].map(({ type, label, color }) => (
                  <motion.button
                    key={`chart-type-${type}`}
                    onClick={() => setChartType(type)}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${color} ${
                      chartType === type 
                        ? darkMode 
                          ? 'ring-2 ring-offset-2 ring-gray-500' 
                          : 'ring-2 ring-offset-2 ring-gray-400' 
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
    
          {/* Analysis Summary */}
          {apiAnalysisData?.analytics && layoutMode === "summary" && (
            <motion.div 
              className={`mb-6 p-4 rounded-xl shadow-sm border ${
                darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200/50'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className={`font-medium text-lg mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Analysis Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(apiAnalysisData.analytics.summary).map(
                  ([col, stats]) => (
                    <motion.div
                      key={col}
                      className={`p-3 rounded-lg border shadow-xs hover:shadow-sm transition-shadow ${
                        darkMode ? 'bg-gray-600/80 border-gray-500' : 'bg-white border-gray-100'
                      }`}
                      whileHover={{ y: -2 }}
                    >
                      <div className={`font-medium truncate mb-1 ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`}>
                        {col}
                      </div>
                      {stats.type === "numeric" && (
                        <div className={`space-y-1 text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <div className="flex justify-between">
                            <span>Average:</span>
                            <span className="font-medium">{stats.avg?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Range:</span>
                            <span className="font-medium">{stats.min} - {stats.max}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Std Dev:</span>
                            <span className="font-medium">{stats.stdDev?.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      {stats.type === "categorical" && (
                        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="flex justify-between">
                            <span>Unique Values:</span>
                            <span className="font-medium">{stats.uniqueCount}</span>
                          </div>
                          {stats.topValue && (
                            <div className="flex justify-between">
                              <span>Most Common:</span>
                              <span className="font-medium truncate">{stats.topValue}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          )}
    
          {/* Data Preview */}
          {dataRows.length > 0 && (layoutMode === "split" || layoutMode === "table") && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Data Preview
              </h3>
              <div className={`overflow-auto rounded-xl shadow-sm border ${
                darkMode ? 'border-gray-600' : 'border-gray-200/50'
              }`}>
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50/80'}>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={`header-${col.key}`}
                          className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            darkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    darkMode ? 'divide-gray-600 bg-gray-700/50' : 'divide-gray-200/50 bg-white/80'
                  }`}>
                    {dataRows.slice(0, 5).map((row, rowIndex) => (
                      <tr 
                        key={`row-${rowIndex}`} 
                        className={darkMode ? 'hover:bg-gray-600/50' : 'hover:bg-gray-50/50'}
                      >
                        {columns.map((col) => (
                          <td
                            key={`cell-${rowIndex}-${col.key}`}
                            className={`px-4 py-3 whitespace-nowrap text-sm ${
                              darkMode ? 'text-gray-200' : 'text-gray-700'
                            }`}
                          >
                            {row[col.index]?.toString() || (
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
            </motion.div>
          )}
    
          {/* Chart Display */}
          {xAxis && yAxis && processedData.length > 0 && (layoutMode === "split" || layoutMode === "chart") && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className={`text-lg font-semibold mb-3 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Chart Preview
              </h3>
              <div className={`h-96 w-full rounded-xl border shadow-sm p-4 ${
                darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200/50'
              }`}>
                <DynamicChart
                  data={processedData}
                  chartType={chartType}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  darkMode={darkMode}
                />
              </div>
            </motion.div>
          )}
    
          {/* Action Buttons */}
          <div className={`flex flex-wrap justify-end gap-3 pt-4 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-200/50'
          }`}>
            <div className="flex flex-wrap gap-2 mr-auto">
              <button
                onClick={() => handleDownload("png")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                <FiDownload className="mr-1.5" /> PNG
              </button>
              <button
                onClick={() => handleDownload("csv")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  darkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                <FiDownload className="mr-1.5" /> CSV
              </button>
            </div>
    
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode 
                  ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={isLoading}
            >
              Cancel
            </button>
    
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !currentSheet}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading || !currentSheet
                  ? darkMode 
                    ? 'bg-indigo-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-300 text-white cursor-not-allowed'
                  : darkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <FiLoader className="animate-spin mr-2" /> Processing...
                </span>
              ) : (
                "Analyze Data"
              )}
            </button>
    
            <button
              onClick={handleSaveDashboard}
              disabled={isLoading || !xAxis || !yAxis || processedData.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading || !xAxis || !yAxis || processedData.length === 0
                  ? darkMode 
                    ? 'bg-green-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-300 text-white cursor-not-allowed'
                  : darkMode 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Save to Dashboard
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  export default FileAnalyzer;