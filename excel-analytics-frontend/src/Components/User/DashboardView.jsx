import DynamicChart from './DynamicChart';
import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,
} from "react-icons/fi";
import {  BaseUrluser } from "../../endpoint/baseurl";
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
    </div>
  );
  
  const StorageCard = ({ used, limit }) => {
    const percentage = ((used / limit) * 100).toFixed(2);
    const usedMB = (used / 1024 / 1024).toFixed(2);
    const limitMB = (limit / 1024 / 1024).toFixed(2);
  
    return (
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">Storage</p>
            <p className="text-3xl font-bold mt-1">{percentage}%</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-lg">
            <FiUpload className="text-purple-500" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                style={{
                  width: `${percentage}%`,
                  minWidth: percentage > 0 && percentage < 2 ? "1%" : undefined, // 👈 add this
                }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {usedMB} MB of {limitMB} MB used
          </p>
        </div>
      </div>
    );
  };
const DashboardView = ({ stats }) => {
    const { user, stats: statData, latestActivity } = stats;
    const [firstFileData, setFirstFileData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [analysisSummary, setAnalysisSummary] = useState(null);
    const [xAxis, setXAxis] = useState("");
    const [yAxis, setYAxis] = useState("");
    const [chartType, setChartType] = useState("bar");
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [errorAnalysis, setErrorAnalysis] = useState(null);
  
    useEffect(() => {
      if (latestActivity && latestActivity.length > 0) {
        setFirstFileData(latestActivity[0]);
      }
    }, [latestActivity]);
  
    useEffect(() => {
      const analyzeFirstFile = async () => {
        if (firstFileData) {
          setLoadingAnalysis(true);
          setErrorAnalysis(null);
          try {
            const response = await fetch(
              `${BaseUrluser}/excel/${firstFileData._id}/analyze`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setAnalysisSummary(data?.analytics?.summary || null);
  
    
            if (!xAxis && data?.analytics?.columns?.length > 0) {
              setXAxis(data.analytics.columns[0]);
            }
            if (!yAxis && data?.analytics?.columns?.length > 1) {
              const numericCol = data.analytics.columns.find(
                (col) => data.analytics.summary[col]?.type === "numeric"
              );
              if (numericCol) setYAxis(numericCol);
            }
  
            // Process data for the chart immediately after analysis
            if (firstFileData?.sheets?.[0]?.previewData && xAxis && yAxis) {
              const headers = firstFileData.sheets[0].columns || [];
              const dataRows = firstFileData.sheets[0].previewData.slice(1);
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
              setChartData(formattedData);
            } else {
              setChartData(null);
            }
          } catch (err) {
            console.error("Error analyzing first file:", err);
            setErrorAnalysis(err.message || "Failed to analyze first file.");
            setAnalysisSummary(null);
            setChartData(null);
          } finally {
            setLoadingAnalysis(false);
          }
        }
      };
  
      analyzeFirstFile();
    }, [firstFileData]); 
  
  
    useEffect(() => {
      if (firstFileData?.sheets?.[0]?.previewData && xAxis && yAxis) {
        const headers = firstFileData.sheets[0].columns || [];
        const dataRows = firstFileData.sheets[0].previewData.slice(1);
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
        setChartData(formattedData);
      } else {
        setChartData(null);
      }
    }, [firstFileData, xAxis, yAxis]);
  
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Dashboards"
            value={statData.dashboards}
            icon={<FiPieChart className="text-indigo-500" />}
          />
          <StatCard
            title="Excel Files"
            value={statData.files}
            icon={<FiFileText className="text-green-500" />}
          />
          <StorageCard used={user.storageUsed} limit={user.storageLimit} />
        </div>
  
        {firstFileData && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              Analysis of First File: {firstFileData.originalName}
            </h3>
  
            {loadingAnalysis && <p>Analyzing first file...</p>}
            {errorAnalysis && <p className="text-red-500">{errorAnalysis}</p>}
  
            {analysisSummary && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analysisSummary).map(([col, stats]) => (
                    <div
                      key={col}
                      className="p-2 bg-white rounded border text-sm"
                    >
                      <div className="font-medium">{col}</div>
                      {stats?.type === "numeric" && (
                        <div>
                          <div>Avg: {stats.avg?.toFixed(2)}</div>
                          <div>Min: {stats.min}</div>
                          <div>Max: {stats.max}</div>
                        </div>
                      )}
                      {stats?.type === "categorical" && (
                        <div>{stats.uniqueCount} unique values</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {chartData && xAxis && yAxis && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Chart Preview</h4>
                <div className="h-96 w-full bg-gray-50 rounded-lg">
                  <DynamicChart
                    data={chartData}
                    chartType={chartType}
                    xAxis={xAxis}
                    yAxis={yAxis}
                  />
                </div>
              </div>
            )}
            {!loadingAnalysis && !errorAnalysis && !analysisSummary && (
              <p className="text-gray-500">
                No analysis available for the first file yet.
              </p>
            )}
          </div>
        )}
  
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {latestActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FiFileText className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{item.originalName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.uploadDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

export default DashboardView