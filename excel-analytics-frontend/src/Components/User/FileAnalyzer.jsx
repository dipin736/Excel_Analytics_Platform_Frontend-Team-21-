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
const FileAnalyzer = ({ fileId, onClose, files }) => {
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

  // Render the component
  return (
    <motion.div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-auto border border-white/20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Analyzing: {selectedFile?.originalName || "File"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {sheets[selectedSheetIndex]?.name} • {sheets[selectedSheetIndex]?.rowCount} rows
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            disabled={isLoading}
          >
            <FiX size={20} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>
  
        {/* Status Indicators */}
        <div className="mb-6 space-y-3">
          {error && (
            <motion.div 
              className="p-3 bg-red-50/80 border border-red-100 rounded-lg flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-red-100 p-1.5 rounded-full mr-3">
                <FiX className="text-red-600" />
              </div>
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}
  
          {isLoading && (
            <motion.div 
              className="p-3 bg-blue-50/80 border border-blue-100 rounded-lg flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div 
                className="bg-blue-100 p-1.5 rounded-full mr-3"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <FiLoader className="text-blue-600" />
              </motion.div>
              <p className="text-blue-700">Processing your data...</p>
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
                  ? "bg-indigo-600 text-white shadow-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sheet
            </label>
            <select
              value={selectedSheetIndex}
              onChange={(e) => {
                setSelectedSheetIndex(parseInt(e.target.value));
                setXAxis("");
                setYAxis("");
              }}
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              X-Axis (Categories)
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Y-Axis (Values)
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    chartType === type ? "ring-2 ring-offset-2 ring-gray-400" : "opacity-90 hover:opacity-100"
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
            className="mb-6 p-4 bg-white/80 border border-gray-200/50 rounded-xl shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="font-medium text-lg text-gray-800 mb-3">Analysis Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(apiAnalysisData.analytics.summary).map(
                ([col, stats]) => (
                  <motion.div
                    key={col}
                    className="p-3 bg-white rounded-lg border border-gray-100 shadow-xs hover:shadow-sm transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="font-medium text-indigo-600 truncate mb-1">{col}</div>
                    {stats.type === "numeric" && (
                      <div className="space-y-1 text-sm text-gray-600">
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
                      <div className="text-sm text-gray-600">
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Preview</h3>
            <div className="overflow-auto rounded-xl border border-gray-200/50 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gray-50/80">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={`header-${col.key}`}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white/80 divide-y divide-gray-200/50">
                  {dataRows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="hover:bg-gray-50/50">
                      {columns.map((col) => (
                        <td
                          key={`cell-${rowIndex}-${col.key}`}
                          className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                        >
                          {row[col.index]?.toString() || <span className="text-gray-400">null</span>}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Chart Preview</h3>
            <div className="h-96 w-full bg-white/80 rounded-xl border border-gray-200/50 shadow-sm p-4">
              <DynamicChart
                data={processedData}
                chartType={chartType}
                xAxis={xAxis}
                yAxis={yAxis}
              />
            </div>
          </motion.div>
        )}
  
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200/50">
          <div className="flex flex-wrap gap-2 mr-auto">
            <button
              onClick={() => handleDownload("png")}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <FiDownload className="mr-1.5" /> PNG
            </button>
            <button
              onClick={() => handleDownload("csv")}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <FiDownload className="mr-1.5" /> CSV
            </button>
          </div>
  
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
  
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !currentSheet}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading || !currentSheet
                ? "bg-indigo-300 cursor-not-allowed text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
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
                ? "bg-green-300 cursor-not-allowed text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
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
