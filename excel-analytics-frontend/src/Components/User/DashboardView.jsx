import DynamicChart from './DynamicChart';
import React, { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,
  FiLoader
} from "react-icons/fi";
import { BaseUrluser } from "../../endpoint/baseurl";

const cardVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  hover: { scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.04)" },
  tap: { scale: 0.98 },
};

const listItemVariants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -5 },
  hover: { backgroundColor: 'rgba(247, 247, 247, 0.6)' },
};

const buttonVariants = {
  hover: { scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  tap: { scale: 0.97 },
};

const colorSchemes = {
  light: {
    statCard: {
      indigo: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600'
      }
    },
    storageCard: {
      bg: 'bg-gradient-to-br from-purple-50 to-blue-50',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      progressBg: 'bg-gray-200',
      textSecondary: 'text-gray-500'
    },
    analysisCard: {
      bg: 'bg-white/70',
      border: 'border-white/20',
      text: 'text-gray-800',
      summaryBg: 'bg-gray-50/50',
      summaryBorder: 'border-gray-100',
      statBg: 'bg-white/80',
      statBorder: 'border-gray-100'
    },
    activityCard: {
      bg: 'bg-white/70',
      border: 'border-white/20',
      text: 'text-gray-800',
      itemBg: 'hover:bg-white/50',
      itemBorder: 'hover:border-gray-100',
      iconBg: 'bg-blue-100/80',
      iconColor: 'text-blue-500'
    }
  },
  dark: {
    statCard: {
      indigo: {
        bg: 'bg-indigo-900/30',
        text: 'text-indigo-300',
        iconBg: 'bg-indigo-800/50',
        iconColor: 'text-indigo-400'
      },
      green: {
        bg: 'bg-green-900/30',
        text: 'text-green-300',
        iconBg: 'bg-green-800/50',
        iconColor: 'text-green-400'
      }
    },
    storageCard: {
      bg: 'bg-gradient-to-br from-purple-900/30 to-blue-900/30',
      text: 'text-purple-300',
      iconBg: 'bg-purple-800/50',
      iconColor: 'text-purple-400',
      progressBg: 'bg-gray-700',
      textSecondary: 'text-gray-400'
    },
    analysisCard: {
      bg: 'bg-gray-800/70',
      border: 'border-gray-700/50',
      text: 'text-gray-100',
      summaryBg: 'bg-gray-700/50',
      summaryBorder: 'border-gray-600',
      statBg: 'bg-gray-700/80',
      statBorder: 'border-gray-600'
    },
    activityCard: {
      bg: 'bg-gray-800/70',
      border: 'border-gray-700/50',
      text: 'text-gray-100',
      itemBg: 'hover:bg-gray-700/50',
      itemBorder: 'hover:border-gray-600',
      iconBg: 'bg-blue-900/50',
      iconColor: 'text-blue-400'
    }
  }
};

const StatCard = ({ title, value, icon, color, darkMode }) => {
  const colors = darkMode ? colorSchemes.dark.statCard[color] : colorSchemes.light.statCard[color];
  
  return (
    <motion.div
      className={`rounded-xl p-5 flex items-start justify-between backdrop-blur-sm border shadow-sm ${colors.bg} ${darkMode ? 'border-gray-700/50' : 'border-white/20'}`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
    >
      <div>
        <p className={`text-sm font-medium ${colors.text}`}>{title}</p>
        <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{value}</p>
      </div>
      <motion.div 
        className={`p-3 rounded-lg ${colors.iconBg}`} 
        variants={buttonVariants} 
        whileHover="hover" 
        whileTap="tap"
      >
        <div className={colors.iconColor}>{icon}</div>
      </motion.div>
    </motion.div>
  );
};

const StorageCard = ({ used, limit, darkMode }) => {
  const percentage = ((used / limit) * 100).toFixed(2);
  const usedMB = (used / 1024 / 1024).toFixed(2);
  const limitMB = (limit / 1024 / 1024).toFixed(2);

  // Dynamic progress bar color based on percentage
  const getProgressColor = (percent) => {
    if (percent < 50) return darkMode ? 'from-green-500 to-emerald-600' : 'from-green-400 to-emerald-500';
    if (percent < 75) return darkMode ? 'from-yellow-500 to-amber-600' : 'from-yellow-400 to-amber-500';
    return darkMode ? 'from-red-500 to-rose-600' : 'from-red-400 to-rose-500';
  };

  const colors = darkMode ? colorSchemes.dark.storageCard : colorSchemes.light.storageCard;

  return (
    <motion.div
      className={`rounded-xl shadow-sm p-5 border backdrop-blur-sm ${colors.bg} ${darkMode ? 'border-gray-700/50' : 'border-white/20'}`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium ${colors.text}`}>Storage</p>
          <p className={`text-3xl font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{percentage}%</p>
        </div>
        <motion.div 
          className={`p-3 rounded-lg ${colors.iconBg}`} 
          variants={buttonVariants} 
          whileHover="hover" 
          whileTap="tap"
        >
          <FiUpload className={`${colors.iconColor} text-xl`} />
        </motion.div>
      </div>
      <div className="mt-4">
        <div className={`w-full rounded-full h-2.5 overflow-hidden ${colors.progressBg}`}>
          <motion.div
            className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(percentage)}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              minWidth: percentage > 0 && percentage < 2 ? "1%" : undefined,
            }}
          ></motion.div>
        </div>
        <p className={`text-xs mt-2 ${colors.textSecondary}`}>
          {usedMB} MB of {limitMB} MB used
        </p>
      </div>
    </motion.div>
  );
};


const DashboardView = ({ stats,darkMode }) => {
  const { user, stats: statData, latestActivity = [] } = stats || {};
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
      if (firstFileData && firstFileData._id) {
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
        } catch (err) {
          console.error("Error analyzing first file:", err);
          setErrorAnalysis(err.message || "Failed to analyze first file.");
          setAnalysisSummary(null);
        } finally {
          setLoadingAnalysis(false);
        }
      }
    };

    analyzeFirstFile();
  }, [firstFileData, BaseUrluser]);

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

  const colors = darkMode ? colorSchemes.dark : colorSchemes.light;
  return (
    <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Dark mode toggle button */}
      <div className="flex justify-end mb-4">
  
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          animate: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <StatCard
          title="Dashboards"
          value={statData?.dashboards || 0}
          icon={<FiPieChart className="text-xl" />}
          color="indigo"
          darkMode={darkMode}
        />
        <StatCard
          title="Excel Files"
          value={statData?.files || 0}
          icon={<FiFileText className="text-xl" />}
          color="green"
          darkMode={darkMode}
        />
        <StorageCard 
          used={user?.storageUsed || 0} 
          limit={user?.storageLimit || 1024 * 1024 * 1024}
          darkMode={darkMode}
        />
      </motion.div>

      {firstFileData && (
        <motion.div
          className={`mb-8 rounded-xl shadow-sm p-6 border backdrop-blur-sm ${colors.analysisCard.bg} ${colors.analysisCard.border}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={cardVariants}
        >
          <h3 className={`text-lg font-semibold mb-4 ${colors.analysisCard.text}`}>
            Analysis of First File: {firstFileData.originalName}
          </h3>

          {loadingAnalysis && (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className={darkMode ? 'text-indigo-400' : 'text-indigo-500'}
              >
                <FiLoader className="text-2xl" />
              </motion.div>
              <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Analyzing file...</span>
            </div>
          )}
          
          {errorAnalysis && (
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-100'}`}>
              <p className={darkMode ? 'text-red-300' : 'text-red-600'}>{errorAnalysis}</p>
            </div>
          )}

          {analysisSummary && (
            <div className={`mb-6 p-4 rounded-lg border ${colors.analysisCard.summaryBg} ${colors.analysisCard.summaryBorder}`}>
              <h4 className={`font-medium mb-3 ${colors.analysisCard.text}`}>Analysis Summary</h4>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={{
                  animate: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {Object.entries(analysisSummary).map(([col, stats]) => (
                  <motion.div
                    key={col}
                    className={`p-3 rounded-lg border shadow-xs text-sm ${colors.analysisCard.statBg} ${colors.analysisCard.statBorder}`}
                    variants={cardVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <div className={`font-medium mb-1 truncate ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{col}</div>
                    {stats?.type === "numeric" && (
                      <div className={`space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex justify-between">
                          <span>Avg:</span>
                          <span className="font-medium">{stats.avg?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min:</span>
                          <span className="font-medium">{stats.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max:</span>
                          <span className="font-medium">{stats.max}</span>
                        </div>
                      </div>
                    )}
                    {stats?.type === "categorical" && (
                      <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        <div className="flex justify-between">
                          <span>Unique:</span>
                          <span className="font-medium">{stats.uniqueCount}</span>
                        </div>
                        {stats.topValue && (
                          <div className="flex justify-between">
                            <span>Top:</span>
                            <span className="font-medium truncate max-w-[100px]">{stats.topValue}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {chartData && xAxis && yAxis && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className={`text-lg font-semibold ${colors.analysisCard.text}`}>Chart Preview</h4>
                <div className="flex space-x-2">
                  <select 
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className={`text-sm border rounded px-2 py-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}
                  >
                    {firstFileData?.sheets?.[0]?.columns?.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <select 
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className={`text-sm border rounded px-2 py-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}
                  >
                    {firstFileData?.sheets?.[0]?.columns?.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <select 
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className={`text-sm border rounded px-2 py-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}
                  >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="scatter">Scatter</option>
                  </select>
                </div>
              </div>
              <motion.div 
                className={`h-96 w-full rounded-lg shadow-inner border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white/80 border-gray-100'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <DynamicChart
                  data={chartData}
                  chartType={chartType}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  darkMode={darkMode}
                />
              </motion.div>
            </div>
          )}
          {!loadingAnalysis && !errorAnalysis && !analysisSummary && (
            <div className={`p-4 rounded-lg border ${colors.analysisCard.summaryBg} ${colors.analysisCard.summaryBorder}`}>
              <p className={`italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No analysis available for the first file yet.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {latestActivity && latestActivity.length > 0 && (
        <motion.div 
          className={`rounded-xl shadow-sm p-6 border backdrop-blur-sm ${colors.activityCard.bg} ${colors.activityCard.border}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${colors.activityCard.text}`}>Recent Activity</h3>
          <motion.div layout className="space-y-2">
            {latestActivity.map((item, i) => (
              <motion.div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border border-transparent ${colors.activityCard.itemBg} ${colors.activityCard.itemBorder}`}
                variants={listItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${colors.activityCard.iconBg}`}>
                    <FiFileText className={`${colors.activityCard.iconColor} text-xl`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${colors.activityCard.text}`}>{item.originalName}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.uploadDate).toLocaleString()}
                    </p>
                  </div>
                </div>
                <motion.button
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${darkMode ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  View
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
export default DashboardView;