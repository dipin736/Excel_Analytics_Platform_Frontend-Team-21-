import React, { useState, useEffect } from "react";
import { BaseUrluser } from "../../endpoint/baseurl";
import DynamicChart from "./DynamicChart";
import ChartBuilder from "./ChartBuilder";
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
  FiLoader,
  FiPlus
} from "react-icons/fi";
const FileAnalyzer = ({ fileId, onClose, files, darkMode, onFilesUpdate }) => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [processedData, setProcessedData] = useState([]);
  const [fullProcessedData, setFullProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);
  const [error, setError] = useState(null);
  const [apiAnalysisData, setApiAnalysisData] = useState(null);
  const [showChartBuilder, setShowChartBuilder] = useState(false);
  const [previewRowCount, setPreviewRowCount] = useState(5);
  const [maxAvailableRows, setMaxAvailableRows] = useState(15);
  const [displayData, setDisplayData] = useState([]);

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
        const dataRows = currentSheet.previewData.slice(1, parseInt(previewRowCount) + 1);

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
        setMaxAvailableRows(currentSheet.previewData.length - 1); // Subtract header row
      } catch (err) {
        setError("Error processing data: " + err.message);
        console.error("Processing error:", err);
      }
    };

    processData();
  }, [currentSheet, xAxis, yAxis, previewRowCount]);

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

  // Function to fetch full data from backend
  const fetchFullData = async () => {
    try {
      setIsLoadingFullData(true);
      setError(null);

      // Only fetch full data if explicitly analyzing, otherwise use preview count
      const useFullData = apiAnalysisData !== null;
      const endpoint = useFullData 
        ? `${BaseUrluser}/excel/${fileId}/analyze?fullData=true&sheetIndex=${selectedSheetIndex}`
        : `${BaseUrluser}/excel/${fileId}/preview?limit=${previewRowCount}&sheet=${encodeURIComponent(currentSheet.name)}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      
      if (data.success) {
        const fullData = useFullData ? (data.data.fullData || data.data.rows || data.data) : data.previewData;
        const headers = data.analytics?.columns || currentSheet.columns || [];

        if (Array.isArray(fullData) && fullData.length > 0) {
          const formattedFullData = fullData
            .slice(1, useFullData ? undefined : previewRowCount + 1) // Limit rows if not analyzing
            .map((row) => {
              const item = {};
              if (Array.isArray(row)) {
                headers.forEach((header, index) => {
                  item[header] = row[index];
                });
              } else if (typeof row === 'object') {
                return row;
              }
              return item;
            })
            .filter(
              (item) => item[xAxis] !== undefined && item[yAxis] !== undefined
            );

          setFullProcessedData(formattedFullData);
          return formattedFullData;
        }
      }
      throw new Error("Invalid data format received");
    } catch (err) {
      setError("Error fetching data: " + err.message);
      console.error("Data fetch error:", err);
      return [];
    } finally {
      setIsLoadingFullData(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First fetch the analysis metadata
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/analyze`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setApiAnalysisData(data);

      // Auto-select columns if none selected
      if (!xAxis && data.analytics?.columns?.length > 0) {
        setXAxis(data.analytics.columns[0]);
      }
      if (!yAxis && data.analytics?.columns?.length > 1) {
        const numericCol = data.analytics.columns.find(
          (col) => data.analytics.summary[col]?.type === "numeric"
        );
        if (numericCol) setYAxis(numericCol);
      }

      // Fetch full data for analysis if axes are selected
      if (xAxis && yAxis) {
        await fetchFullData();
      }
    } catch (err) {
      setError(err.message || "Failed to analyze data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setApiAnalysisData(null);
    setFullProcessedData([]);
  }, [currentSheet]);

  // Auto-fetch full data when both axes are selected
  useEffect(() => {
    if (xAxis && yAxis && apiAnalysisData && fullProcessedData.length === 0) {
      fetchFullData();
    }
  }, [xAxis, yAxis, apiAnalysisData]);

  const handleSaveDashboard = async () => {
    if (!xAxis || !yAxis) {
      setError(`Please select both X and Y axes`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the current data for the chart
      let dataToUse = processedData;
      
      if (dataToUse.length === 0) {
        setError("No data available for the selected axes");
        return;
      }

      const chartTitle = `${xAxis} vs ${yAxis} Chart`;
      const chartDataForPayload = {
        labels: dataToUse.map((item) => item[xAxis]),
        datasets: [
          {
            label: yAxis,
            data: dataToUse.map((item) => parseFloat(item[yAxis]) || 0),
            backgroundColor: darkMode ? [
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
            borderColor: "rgba(99, 102, 241, 1)",
            borderWidth: 1,
          },
        ],
      };

      const dashboardPayload = {
        title: `Dashboard from ${selectedFile?.originalName || "Excel File"}`,
        description: `Analysis of ${xAxis} vs ${yAxis} from ${selectedFile?.originalName || "Excel File"}`,
        charts: [
          {
            title: chartTitle,
            chartType,
            data: chartDataForPayload,
            configuration: {
              xAxisLabel: xAxis,
              yAxisLabel: yAxis,
              fileId: fileId,
              sheetName: currentSheet.name,
              darkMode: darkMode,
            },
          },
        ],
        isPublic: false,
      };

      const response = await fetch(`${BaseUrluser}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(dashboardPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to save dashboard");
      }

      if (result.success) {
        toast.success("Dashboard saved successfully! You can view it in the Dashboards section.");
        onClose();
      } else {
        throw new Error(result.error || "Failed to save dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to save dashboard");
      toast.error(err.message || "Failed to save dashboard");
    } finally {
      setIsLoading(false);
    }
  };
  const [layoutMode, setLayoutMode] = useState("split"); 

  const handleDownload = async (format) => {
    if (format === "png") {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `analysis-${Date.now()}.png`;
        link.click();
      } else {
        setError("No chart available to download");
      }
    } else if (format === "csv") {
      if (!xAxis || !yAxis) {
        setError("Please select both X and Y axes before downloading");
        return;
      }

      try {
        setIsLoadingFullData(true);
        
        // Fetch full data if not already available
        let dataToUse = fullProcessedData;
        if (dataToUse.length === 0) {
          dataToUse = await fetchFullData();
        }

        if (dataToUse.length === 0) {
          setError("No data available for download");
          return;
        }

        const headers = [xAxis, yAxis].join(",");
        const csvContent = [
          headers,
          ...dataToUse.map((item) => [item[xAxis], item[yAxis]].join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analysis-${Date.now()}.csv`;
        link.click();
        
        toast.success(`Downloaded ${dataToUse.length} rows of data`);
      } catch (err) {
        setError("Failed to download data: " + err.message);
      } finally {
        setIsLoadingFullData(false);
      }
    }
  };

  // New dynamic preview data fetching function
  const fetchPreviewData = async (fileId, limit, sheetName) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/preview?limit=${limit}&sheet=${encodeURIComponent(sheetName)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preview data");
      }

      const data = await response.json();
      
      if (data.success && data.previewData) {
        // Update the current sheet's preview data with fresh data
        const updatedSheets = sheets.map((sheet, index) => {
          if (index === selectedSheetIndex) {
            return {
              ...sheet,
              previewData: data.previewData,
              rowCount: data.totalRows || sheet.rowCount
            };
          }
          return sheet;
        });

        // Update the selectedFile with new sheet data
        const updatedFile = {
          ...selectedFile,
          sheets: updatedSheets
        };

        // Update files array
        const updatedFiles = files.map(file => 
          file._id === fileId ? updatedFile : file
        );

        // Update parent component's files state if callback provided
        if (onFilesUpdate) {
          onFilesUpdate(updatedFiles);
        }

        // This would need to be passed from parent component
        // For now, we'll just update local state
        setMaxAvailableRows(data.previewData.length - 1); // Subtract header row
        
        return data.previewData;
      }
    } catch (err) {
      console.error("Error fetching preview data:", err);
      toast.error("Failed to fetch preview data");
    } finally {
      setIsLoading(false);
    }
  };

  // Update display data whenever preview count or current sheet changes
  useEffect(() => {
    if (currentSheet?.previewData) {
      const newDisplayData = currentSheet.previewData.slice(1, parseInt(previewRowCount) + 1);
      setDisplayData(newDisplayData);

      // Also update the processed data for the chart
      if (xAxis && yAxis) {
        const headers = currentSheet.columns || [];
        const formattedData = newDisplayData
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
      }
    }
  }, [currentSheet, previewRowCount, xAxis, yAxis]);

  // Enhanced preview row count handler
  const handlePreviewRowCountChange = async (newCount) => {
    const parsedCount = parseInt(newCount);
    setPreviewRowCount(parsedCount);
    
    try {
      setIsLoading(true);
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/preview?limit=${parsedCount}&sheet=${encodeURIComponent(currentSheet.name)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preview data");
      }

      const data = await response.json();
      
      if (data.success && data.previewData) {
        // Update sheets with new data
        const updatedSheets = sheets.map((sheet, index) => {
          if (index === selectedSheetIndex) {
            return {
              ...sheet,
              previewData: data.previewData,
              rowCount: data.totalRows || sheet.rowCount
            };
          }
          return sheet;
        });

        // Update files
        const updatedFile = {
          ...selectedFile,
          sheets: updatedSheets
        };

        const updatedFiles = files.map(file => 
          file._id === fileId ? updatedFile : file
        );

        if (onFilesUpdate) {
          onFilesUpdate(updatedFiles);
        }

        // Get the preview data slice
        const newPreviewData = data.previewData.slice(1, parsedCount + 1);
        
        // Update display data for table
        setDisplayData(newPreviewData);
        
        // Update processed data for chart
        if (xAxis && yAxis) {
          const headers = currentSheet.columns || [];
          const formattedData = newPreviewData
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
        }
        
        setMaxAvailableRows(data.previewData.length - 1);
      }
    } catch (err) {
      console.error("Error updating preview data:", err);
      toast.error("Failed to update preview data");
    } finally {
      setIsLoading(false);
    }
  };

  // Update maxAvailableRows when dataRows changes
  useEffect(() => {
    setMaxAvailableRows(dataRows.length);
  }, [dataRows.length]);

  // Auto-fetch fresh preview data when sheet changes or component mounts
  useEffect(() => {
    if (currentSheet.name && fileId && previewRowCount) {
      fetchPreviewData(fileId, previewRowCount, currentSheet.name);
    }
  }, [selectedSheetIndex, fileId]);

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
                onChange={(e) => {
                  setXAxis(e.target.value);
                  setPreviewRowCount(5);
                  handlePreviewRowCountChange(5);
                }}
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
                onChange={(e) => {
                  setYAxis(e.target.value);
                  setPreviewRowCount(5);
                  handlePreviewRowCountChange(5);
                }}
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
    
          {/* Split View Layout */}
          {layoutMode === "split" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {/* Data Preview - Left Side */}
              {dataRows.length > 0 && (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      Data Preview
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Showing {Math.min(previewRowCount, dataRows.length)} of {currentSheet.rowCount || dataRows.length} rows
                      </span>
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
                        <option value={15}>15 rows</option>
                        <option value={20}>20 rows</option>
                      </select>
                    </div>
                  </div>
                  <div className={`overflow-auto rounded-xl shadow-sm border h-96 ${
                    darkMode ? 'border-gray-600' : 'border-gray-200/50'
                  }`}>
                    <table className="min-w-full divide-y divide-gray-200/50">
                      <thead className={`sticky top-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-50/80'}`}>
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
                        {displayData.map((row, rowIndex) => (
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
                  {dataRows.length > previewRowCount && (
                    <div className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {dataRows.length - previewRowCount} more rows available. Use "Analyze Data" to process all rows.
                    </div>
                  )}
                </motion.div>
              )}

              {/* Chart Preview - Right Side */}
              {xAxis && yAxis && processedData.length > 0 && (
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${
                      darkMode ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      Chart Preview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                      }`}>
                        Showing {Math.min(previewRowCount, processedData.length)} rows
                      </span>
                    </div>
                  </div>
                  <div className={`h-96 w-full rounded-xl border shadow-sm p-4 ${
                    darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200/50'
                  }`}>
                    <DynamicChart
                      data={processedData.slice(0, previewRowCount)}
                      chartType={chartType}
                      xAxis={xAxis}
                      yAxis={yAxis}
                      darkMode={darkMode}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Table Only View */}
          {dataRows.length > 0 && layoutMode === "table" && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Data Preview
                </h3>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Showing {Math.min(previewRowCount, dataRows.length)} of {currentSheet.rowCount || dataRows.length} rows
                  </span>
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
                  </select>
                </div>
              </div>
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
                    {displayData.map((row, rowIndex) => (
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
              {dataRows.length > previewRowCount && (
                <div className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {dataRows.length - previewRowCount} more rows available. Use "Analyze Data" to process all rows.
                </div>
              )}
            </motion.div>
          )}

          {/* Chart Only View */}
          {xAxis && yAxis && (processedData.length > 0 || fullProcessedData.length > 0) && layoutMode === "chart" && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Chart Preview
                </h3>
                <div className="flex items-center space-x-2">
                  {fullProcessedData.length > 0 && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                    }`}>
                      Full Data: {fullProcessedData.length} rows
                    </span>
                  )}
                  {processedData.length > 0 && fullProcessedData.length === 0 && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      Preview: {processedData.length} rows
                    </span>
                  )}
                  {isLoadingFullData && (
                    <span className={`text-sm px-2 py-1 rounded-full flex items-center ${
                      darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <FiLoader className="animate-spin mr-1" size={12} />
                      Loading full data...
                    </span>
                  )}
                </div>
              </div>
              <div className={`h-96 w-full rounded-xl border shadow-sm p-4 ${
                darkMode ? 'bg-gray-700/80 border-gray-600' : 'bg-white/80 border-gray-200/50'
              }`}>
                <DynamicChart
                  data={fullProcessedData.length > 0 ? fullProcessedData : processedData}
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
              disabled={isLoadingFullData || !xAxis || !yAxis}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
                isLoadingFullData || !xAxis || !yAxis
                  ? 'bg-gray-400 cursor-not-allowed'
                  : darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <FiDownload className="mr-1.5" /> PNG
            </button>
            <button
              onClick={() => handleDownload("csv")}
              disabled={isLoadingFullData || !xAxis || !yAxis}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${
                isLoadingFullData || !xAxis || !yAxis
                  ? 'bg-gray-400 cursor-not-allowed'
                  : darkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {isLoadingFullData ? (
                <>
                  <FiLoader className="animate-spin mr-1.5" /> Loading...
                </>
              ) : (
                <>
                  <FiDownload className="mr-1.5" /> CSV
                </>
              )}
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
              disabled={isLoading || isLoadingFullData || !xAxis || !yAxis}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLoading || isLoadingFullData || !xAxis || !yAxis
                  ? darkMode 
                    ? 'bg-green-800 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-300 text-white cursor-not-allowed'
                  : darkMode 
                    ? 'bg-green-600 hover:bg-green-500 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading || isLoadingFullData ? (
                <span className="flex items-center">
                  <FiLoader className="animate-spin mr-2" /> 
                  {isLoadingFullData ? 'Loading Data...' : 'Saving...'}
                </span>
              ) : (
                'Save to Dashboard'
              )}
            </button>

            <button
              onClick={() => setShowChartBuilder(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                darkMode 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <FiPlus />
              <span>Advanced Chart Builder</span>
            </button>
          </div>

          {/* Chart Builder Modal */}
          {showChartBuilder && (
            <ChartBuilder
              excelId={fileId}
              dashboardId="temp-dashboard" // This should be passed from parent or fetched
              onClose={() => setShowChartBuilder(false)}
              darkMode={darkMode}
            />
          )}
        </motion.div>
      </motion.div>
    );
  };
  
  export default FileAnalyzer;