import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiTrendingUp, FiBarChart2, FiPieChart, FiActivity,
  FiTarget, FiDatabase, FiFilter, FiDownload,
  FiSettings, FiPlay, FiPause, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { BaseUrluser } from '../../endpoint/baseurl';
import StatisticalAnalysis from './StatisticalAnalysis';
import CorrelationMatrix from './CorrelationMatrix';
import DynamicChart from './DynamicChart';

const AdvancedAnalytics = ({ fileId, darkMode, currentSheet, onClose }) => {
  // Main state management
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('descriptive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsConfig, setAnalyticsConfig] = useState({
    includeNullValues: false,
    confidenceLevel: 0.95,
    outlierThreshold: 2,
    trendPeriods: 12,
    forecastPeriods: 6
  });

  // Data preparation state
  const [cleanedData, setCleanedData] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dataQuality, setDataQuality] = useState(null);

  // Analysis types configuration
  const analysisTypes = [
    {
      id: 'descriptive',
      name: 'Descriptive Statistics',
      icon: FiBarChart2,
      description: 'Basic statistical measures and data distribution',
      color: 'blue'
    },
    {
      id: 'correlation',
      name: 'Correlation Analysis',
      icon: FiActivity,
      description: 'Relationships between variables',
      color: 'green'
    },
    {
      id: 'trend',
      name: 'Trend Analysis',
      icon: FiTrendingUp,
      description: 'Time series patterns and forecasting',
      color: 'purple'
    },
    {
      id: 'outlier',
      name: 'Outlier Detection',
      icon: FiTarget,
      description: 'Identify anomalies and unusual patterns',
      color: 'orange'
    },
    {
      id: 'regression',
      name: 'Regression Analysis',
      icon: FiDatabase,
      description: 'Predictive modeling and relationships',
      color: 'red'
    },
    {
      id: 'clustering',
      name: 'Cluster Analysis',
      icon: FiPieChart,
      description: 'Group similar data points',
      color: 'teal'
    }
  ];

  // Initialize analytics
  useEffect(() => {
    if (currentSheet?.previewData && currentSheet?.columns) {
      initializeAnalytics();
    }
  }, [currentSheet]);

  const initializeAnalytics = async () => {
    try {
      // Assess data quality
      const quality = await assessDataQuality();
      setDataQuality(quality);

      // Clean and prepare data
      const cleaned = await cleanData();
      setCleanedData(cleaned);

      // Set default column selection
      const numericColumns = currentSheet.columns.filter(col => 
        isNumericColumn(col)
      );
      setSelectedColumns(numericColumns.slice(0, 5)); // Default to first 5 numeric columns

    } catch (error) {
      console.error('Analytics initialization error:', error);
      toast.error('Failed to initialize analytics');
    }
  };

  const assessDataQuality = async () => {
    const data = currentSheet.previewData.slice(1); // Skip header
    const columns = currentSheet.columns;
    
    const quality = {
      totalRows: data.length,
      totalColumns: columns.length,
      completeness: {},
      dataTypes: {},
      uniqueness: {},
      outliers: {},
      recommendations: []
    };

    columns.forEach((col, index) => {
      const columnData = data.map(row => row[index]).filter(val => val !== null && val !== '');
      
      // Completeness
      quality.completeness[col] = (columnData.length / data.length * 100).toFixed(2);
      
      // Data type detection
      quality.dataTypes[col] = detectDataType(columnData);
      
      // Uniqueness
      const uniqueValues = new Set(columnData);
      quality.uniqueness[col] = (uniqueValues.size / columnData.length * 100).toFixed(2);
      
      // Basic outlier detection for numeric columns
      if (quality.dataTypes[col] === 'numeric') {
        const numericData = columnData.map(val => parseFloat(val)).filter(val => !isNaN(val));
        quality.outliers[col] = detectBasicOutliers(numericData);
      }
    });

    // Generate recommendations
    quality.recommendations = generateQualityRecommendations(quality);

    return quality;
  };

  const detectDataType = (data) => {
    if (data.length === 0) return 'empty';
    
    const sample = data.slice(0, Math.min(100, data.length));
    let numericCount = 0;
    let dateCount = 0;
    
    sample.forEach(val => {
      if (!isNaN(parseFloat(val)) && isFinite(val)) numericCount++;
      if (isValidDate(val)) dateCount++;
    });
    
    const numericRatio = numericCount / sample.length;
    const dateRatio = dateCount / sample.length;
    
    if (numericRatio > 0.8) return 'numeric';
    if (dateRatio > 0.8) return 'date';
    return 'text';
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const detectBasicOutliers = (data) => {
    if (data.length < 4) return { count: 0, percentage: 0 };
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outliers = data.filter(val => val < lowerBound || val > upperBound);
    
    return {
      count: outliers.length,
      percentage: (outliers.length / data.length * 100).toFixed(2)
    };
  };

  const generateQualityRecommendations = (quality) => {
    const recommendations = [];
    
    // Check for missing data
    Object.entries(quality.completeness).forEach(([col, completeness]) => {
      if (parseFloat(completeness) < 90) {
        recommendations.push({
          type: 'warning',
          message: `Column "${col}" has ${(100 - parseFloat(completeness)).toFixed(2)}% missing data`,
          action: 'Consider data imputation or column removal'
        });
      }
    });

    // Check for low uniqueness (potential duplicates)
    Object.entries(quality.uniqueness).forEach(([col, uniqueness]) => {
      if (parseFloat(uniqueness) < 50 && quality.dataTypes[col] !== 'text') {
        recommendations.push({
          type: 'info',
          message: `Column "${col}" has low uniqueness (${uniqueness}%)`,
          action: 'Check for duplicate values or consider categorization'
        });
      }
    });

    // Check for outliers
    Object.entries(quality.outliers).forEach(([col, outlierData]) => {
      if (outlierData.count > 0 && parseFloat(outlierData.percentage) > 5) {
        recommendations.push({
          type: 'alert',
          message: `Column "${col}" has ${outlierData.count} outliers (${outlierData.percentage}%)`,
          action: 'Consider outlier treatment or investigation'
        });
      }
    });

    return recommendations;
  };

  const cleanData = async () => {
    // Implement data cleaning logic
    const data = currentSheet.previewData.slice(1);
    const cleaned = data.map(row => {
      return row.map(cell => {
        if (cell === null || cell === '' || cell === undefined) {
          return analyticsConfig.includeNullValues ? null : 0;
        }
        return cell;
      });
    });

    return cleaned;
  };

  const isNumericColumn = (columnName) => {
    if (!dataQuality) return false;
    return dataQuality.dataTypes[columnName] === 'numeric';
  };

  const runAnalysis = async () => {
    if (!selectedColumns.length) {
      toast.error('Please select at least one column for analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${BaseUrluser}/excel/${fileId}/analyze/advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          analysisType: selectedAnalysisType,
          columns: selectedColumns,
          config: analyticsConfig,
          sheetName: currentSheet.name
        })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const results = await response.json();
      setAnalysisResults(results);
      toast.success('Analysis completed successfully');

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Running local analysis...');
      
      // Fallback to local analysis
      await runLocalAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runLocalAnalysis = async () => {
    // Local analysis implementation
    const results = {
      type: selectedAnalysisType,
      timestamp: new Date().toISOString(),
      config: analyticsConfig
    };

    switch (selectedAnalysisType) {
      case 'descriptive':
        results.data = await calculateDescriptiveStats();
        break;
      case 'correlation':
        results.data = await calculateCorrelation();
        break;
      case 'trend':
        results.data = await analyzeTrends();
        break;
      case 'outlier':
        results.data = await detectOutliers();
        break;
      default:
        results.data = await calculateDescriptiveStats();
    }

    setAnalysisResults(results);
  };

  const calculateDescriptiveStats = async () => {
    const stats = {};
    
    selectedColumns.forEach(col => {
      const colIndex = currentSheet.columns.indexOf(col);
      const data = cleanedData
        .map(row => parseFloat(row[colIndex]))
        .filter(val => !isNaN(val) && val !== null);

      if (data.length > 0) {
        const sorted = [...data].sort((a, b) => a - b);
        const n = data.length;
        
        stats[col] = {
          count: n,
          mean: data.reduce((sum, val) => sum + val, 0) / n,
          median: n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)],
          mode: calculateMode(data),
          min: Math.min(...data),
          max: Math.max(...data),
          range: Math.max(...data) - Math.min(...data),
          variance: calculateVariance(data),
          standardDeviation: Math.sqrt(calculateVariance(data)),
          skewness: calculateSkewness(data),
          kurtosis: calculateKurtosis(data),
          quartile1: sorted[Math.floor(n * 0.25)],
          quartile3: sorted[Math.floor(n * 0.75)]
        };
      }
    });

    return stats;
  };

  const calculateMode = (data) => {
    const frequency = {};
    data.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    let maxCount = 0;
    let mode = null;
    
    Object.entries(frequency).forEach(([val, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode = parseFloat(val);
      }
    });
    
    return mode;
  };

  const calculateVariance = (data) => {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  };

  const calculateSkewness = (data) => {
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance = calculateVariance(data);
    const stdDev = Math.sqrt(variance);
    
    const skewness = data.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 3), 0
    ) / n;
    
    return skewness;
  };

  const calculateKurtosis = (data) => {
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance = calculateVariance(data);
    const stdDev = Math.sqrt(variance);
    
    const kurtosis = data.reduce((sum, val) => 
      sum + Math.pow((val - mean) / stdDev, 4), 0
    ) / n - 3;
    
    return kurtosis;
  };

  const calculateCorrelation = async () => {
    const correlations = {};
    
    for (let i = 0; i < selectedColumns.length; i++) {
      for (let j = i + 1; j < selectedColumns.length; j++) {
        const col1 = selectedColumns[i];
        const col2 = selectedColumns[j];
        
        const col1Index = currentSheet.columns.indexOf(col1);
        const col2Index = currentSheet.columns.indexOf(col2);
        
        const data1 = cleanedData
          .map(row => parseFloat(row[col1Index]))
          .filter(val => !isNaN(val));
        const data2 = cleanedData
          .map(row => parseFloat(row[col2Index]))
          .filter(val => !isNaN(val));
        
        if (data1.length === data2.length && data1.length > 1) {
          const correlation = calculatePearsonCorrelation(data1, data2);
          correlations[`${col1}_${col2}`] = {
            column1: col1,
            column2: col2,
            correlation: correlation,
            strength: getCorrelationStrength(correlation),
            significance: calculateSignificance(correlation, data1.length)
          };
        }
      }
    }
    
    return correlations;
  };

  const calculatePearsonCorrelation = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getCorrelationStrength = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.3) return 'Moderate';
    if (abs >= 0.1) return 'Weak';
    return 'Very Weak';
  };

  const calculateSignificance = (correlation, n) => {
    const t = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    return Math.abs(t) > 2.0 ? 'Significant' : 'Not Significant';
  };

  const analyzeTrends = async () => {
    // Implementation for trend analysis
    return { message: 'Trend analysis implementation pending' };
  };

  const detectOutliers = async () => {
    // Implementation for outlier detection
    return { message: 'Outlier detection implementation pending' };
  };

  const exportResults = () => {
    if (!analysisResults) return;
    
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis_results_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const renderAnalysisTypeCard = (type) => (
    <motion.div
      key={type.id}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selectedAnalysisType === type.id
          ? `border-${type.color}-500 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
          : `border-gray-300 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`
      }`}
      onClick={() => setSelectedAnalysisType(type.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center mb-2">
        <type.icon className={`h-6 w-6 text-${type.color}-500 mr-3`} />
        <h3 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          {type.name}
        </h3>
      </div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {type.description}
      </p>
    </motion.div>
  );

  const renderDataQualityReport = () => {
    if (!dataQuality) return null;

    return (
      <div className={`rounded-lg border p-4 mb-6 ${
        darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          Data Quality Report
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {dataQuality.totalRows}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Rows
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
              {dataQuality.totalColumns}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Columns
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
              {Object.values(dataQuality.dataTypes).filter(type => type === 'numeric').length}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Numeric Columns
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
              {dataQuality.recommendations.length}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Recommendations
            </div>
          </div>
        </div>

        {dataQuality.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Recommendations:
            </h4>
            {dataQuality.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                {rec.type === 'warning' && <FiAlertCircle className="text-yellow-500 mt-0.5" />}
                {rec.type === 'info' && <FiInfo className="text-blue-500 mt-0.5" />}
                {rec.type === 'alert' && <FiAlertCircle className="text-red-500 mt-0.5" />}
                <div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {rec.message}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {rec.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
        className={`rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-auto border ${
          darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-white/20'
        } backdrop-blur-lg`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b p-6 ${
          darkMode ? 'border-gray-700 bg-gray-800/95' : 'border-gray-200 bg-white/95'
        } backdrop-blur-sm`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-2xl font-bold ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Advanced Analytics Dashboard
              </h2>
              <p className={`text-sm mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Professional data analysis and insights for {currentSheet.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-200 ${
                darkMode ? 'hover:bg-gray-600 text-gray-400' : 'text-gray-600'
              }`}
            >
              <FiRefreshCw className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Data Quality Report */}
          {renderDataQualityReport()}

          {/* Analysis Type Selection */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              Select Analysis Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisTypes.map(renderAnalysisTypeCard)}
            </div>
          </div>

          {/* Column Selection */}
          <div className="mb-6">
            <h3 className={`text-lg font-semibold mb-4 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              Select Columns for Analysis
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentSheet.columns
                .filter(col => isNumericColumn(col))
                .map(col => (
                  <button
                    key={col}
                    onClick={() => {
                      setSelectedColumns(prev =>
                        prev.includes(col)
                          ? prev.filter(c => c !== col)
                          : [...prev, col]
                      );
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedColumns.includes(col)
                        ? 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {col}
                  </button>
                ))}
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing || !selectedColumns.length}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  isAnalyzing || !selectedColumns.length
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <FiPause className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiPlay className="mr-2 h-4 w-4" />
                    Run Analysis
                  </>
                )}
              </button>

              {analysisResults && (
                <button
                  onClick={exportResults}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export Results
                </button>
              )}
            </div>

            <button
              className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FiSettings className="mr-2 h-4 w-4" />
              Settings
            </button>
          </div>

          {/* Results Display */}
          {analysisResults && (
            <div className={`rounded-lg border p-6 ${
              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-gray-100' : 'text-gray-800'
                }`}>
                  Analysis Results
                </h3>
                <div className="flex items-center text-green-500">
                  <FiCheckCircle className="mr-2 h-5 w-5" />
                  <span className="text-sm">Analysis Complete</span>
                </div>
              </div>

              {/* Render specific analysis components based on type */}
              {selectedAnalysisType === 'descriptive' && analysisResults.data && (
                <StatisticalAnalysis 
                  data={analysisResults.data} 
                  darkMode={darkMode} 
                />
              )}

              {selectedAnalysisType === 'correlation' && analysisResults.data && (
                <CorrelationMatrix 
                  data={analysisResults.data} 
                  darkMode={darkMode} 
                />
              )}

              {/* Add more analysis result components as needed */}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedAnalytics; 