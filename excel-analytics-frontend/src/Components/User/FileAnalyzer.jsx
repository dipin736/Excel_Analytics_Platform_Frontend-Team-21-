import React, { useState, useEffect } from "react";
import {

  FiX,

} from "react-icons/fi";
import {  BaseUrluser } from "../../endpoint/baseurl";
import DynamicChart from "./DynamicChart";
import { toast } from "react-toastify"

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
      // Always use the original sheet columns as base
      if (!currentSheet.columns) return [];
  
      const baseColumns = currentSheet.columns
        .map((col, index) => ({
          name: col,
          index,
          key: `${index}_${col}`,
          // Add numeric flag from API analysis if available
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
      toast.success("Dashboard saved successfully!")
        onClose();
      } catch (err) {
        setError(err.message || "Failed to save dashboard");
        console.error("Save error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    const [layoutMode, setLayoutMode] = useState("split"); // 'split', 'chart', 'table'
    // Render the component
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Analyzing: {selectedFile?.originalName || "File"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <FiX size={24} />
            </button>
          </div>
  
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
  
          {/* Loading State */}
          {isLoading && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded">
              Loading...
            </div>
          )}
          {/* Layout Controls */}
          <div className="flex flex-wrap space-x-2 mb-4">
            <button
              onClick={() => setLayoutMode("split")}
              className={`px-3 py-1 rounded-md ${
                layoutMode === "split" ? "bg-blue-600 text-white" : "bg-gray-200"
              } mb-2 sm:mb-0`} // Added mb-2 for spacing when wrapped
            >
              Split View
            </button>
            <button
              onClick={() => setLayoutMode("summary")}
              className={`px-3 py-1 rounded-md ${
                layoutMode === "summary"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              } mb-2 sm:mb-0`} // Added mb-2 for spacing when wrapped
            >
              Analysis Summary Focus
            </button>
            <button
              onClick={() => setLayoutMode("chart")}
              className={`px-3 py-1 rounded-md ${
                layoutMode === "chart" ? "bg-blue-600 text-white" : "bg-gray-200"
              } mb-2 sm:mb-0`} // Added mb-2 for spacing when wrapped
            >
              Chart Focus
            </button>
            <button
              onClick={() => setLayoutMode("table")}
              className={`px-3 py-1 rounded-md ${
                layoutMode === "table" ? "bg-blue-600 text-white" : "bg-gray-200"
              } mb-2 sm:mb-0`} // Added mb-2 for spacing when wrapped
            >
              Table Focus
            </button>
          </div>
          {/* Sheet Selection */}
          {sheets.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Select Sheet
              </label>
              <select
                value={selectedSheetIndex}
                onChange={(e) => {
                  setSelectedSheetIndex(parseInt(e.target.value));
                  setXAxis("");
                  setYAxis("");
                }}
                className="w-full p-2 border rounded"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                X-Axis (Categories)
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isLoading || columns.length === 0}
              >
                <option value="">Select column</option>
                {columns.map((col) => (
                  <option key={`x-${col.key}`} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Y-Axis (Values)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isLoading || columns.length === 0}
              >
                <option value="">Select column</option>
                {columns.map((col) => (
                  <option key={`y-${col.key}`} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
  
          {/* Show analysis summary if available */}
          {apiAnalysisData?.analytics && layoutMode === "summary" && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Analysis Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(apiAnalysisData.analytics.summary).map(
                  ([col, stats]) => (
                    <div
                      key={col}
                      className="p-2 bg-white rounded border text-sm"
                    >
                      <div className="font-medium">{col}</div>
                      {stats.type === "numeric" && (
                        <div>
                          <div>Avg: {stats.avg?.toFixed(2)}</div>
                          <div>Min: {stats.min}</div>
                          <div>Max: {stats.max}</div>
                        </div>
                      )}
                      {stats.type === "categorical" && (
                        <div>{stats.uniqueCount} unique values</div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
  
          {/* Chart Type Selection */}
  
          {layoutMode === "chart" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <div className="flex space-x-2">
                {["bar", "pie", "line", "scatter"].map((type) => (
                  <button
                    key={`chart-type-${type}`}
                    onClick={() => setChartType(type)}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded-md ${
                      chartType === type
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Data Preview */}
          {dataRows.length > 0 &&
            (layoutMode === "split" || layoutMode === "table") && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
                <div className="overflow-auto max-h-64 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={`header-${col.key}`}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dataRows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          {columns.map((col) => (
                            <td
                              key={`cell-${rowIndex}-${col.key}`}
                              className="px-4 py-2 whitespace-nowrap text-sm"
                            >
                              {row[col.index]?.toString() || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
  
          {/* Chart Display */}
          {xAxis &&
            yAxis &&
            processedData.length > 0 &&
            (layoutMode === "split" || layoutMode === "chart") && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Chart Preview</h3>
                <div className="h-96 w-full bg-gray-50 rounded-lg">
                  <DynamicChart
                    data={processedData}
                    chartType={chartType}
                    xAxis={xAxis}
                    yAxis={yAxis}
                  />
                </div>
              </div>
            )}
  
          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !currentSheet}
              className={`px-4 py-2 rounded-lg ${
                isLoading || !currentSheet
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isLoading ? "Processing..." : "Analyze Data"}
            </button>
            <button
              onClick={handleSaveDashboard}
              disabled={
                isLoading || !xAxis || !yAxis || processedData.length === 0
              }
              className={`px-4 py-2 rounded-lg ${
                isLoading || !xAxis || !yAxis || processedData.length === 0
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              Save to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };
  

export default FileAnalyzer