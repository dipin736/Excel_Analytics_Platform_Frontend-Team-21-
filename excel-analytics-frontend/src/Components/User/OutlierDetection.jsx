import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertTriangle, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiTarget, 
  FiBarChart2,
  FiInfo,
  FiZap,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const OutlierDetection = ({ data, xAxis, yAxis, darkMode, onOutliersUpdate }) => {
  const [outliers, setOutliers] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOutliers, setShowOutliers] = useState(true);
  const [detectionMethod, setDetectionMethod] = useState('iqr'); // iqr, zscore, isolation
  const [sensitivity, setSensitivity] = useState(1.5); // IQR multiplier

  // Auto-analyze when data changes
  useEffect(() => {
    if (data && data.length > 0 && xAxis && yAxis) {
      analyzeOutliers();
    }
  }, [data, xAxis, yAxis, detectionMethod, sensitivity]);

  const analyzeOutliers = async () => {
    setIsAnalyzing(true);
    try {
      const outlierAnalysis = await performOutlierAnalysis();
      setAnalysis(outlierAnalysis);
      setOutliers(outlierAnalysis.outliers);
      
      // Notify parent component about outliers
      if (onOutliersUpdate) {
        onOutliersUpdate(outlierAnalysis.outliers);
      }
    } catch (error) {
      console.error('Outlier analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performOutlierAnalysis = async () => {
    const analysis = {
      outliers: {},
      statistics: {},
      insights: [],
      recommendations: []
    };

    // Analyze Y-axis for outliers (typically numeric values)
    const yValues = data
      .map(row => parseFloat(row[yAxis]))
      .filter(val => !isNaN(val) && isFinite(val));

    if (yValues.length === 0) {
      return analysis;
    }

    // Calculate basic statistics
    const sorted = [...yValues].sort((a, b) => a - b);
    const mean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    const variance = yValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / yValues.length;
    const stdDev = Math.sqrt(variance);

    analysis.statistics = {
      count: yValues.length,
      mean: mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)]
    };

    // Detect outliers using selected method
    let detectedOutliers = [];
    
    switch (detectionMethod) {
      case 'iqr':
        detectedOutliers = detectOutliersIQR(yValues, sensitivity);
        break;
      case 'zscore':
        detectedOutliers = detectOutliersZScore(yValues, sensitivity);
        break;
      case 'isolation':
        detectedOutliers = detectOutliersIsolation(yValues);
        break;
      default:
        detectedOutliers = detectOutliersIQR(yValues, sensitivity);
    }

    // Map outliers back to original data
    const outlierIndices = detectedOutliers.map(outlier => {
      return data.findIndex(row => parseFloat(row[yAxis]) === outlier);
    }).filter(index => index !== -1);

    analysis.outliers = {
      indices: outlierIndices,
      values: detectedOutliers,
      count: detectedOutliers.length,
      percentage: (detectedOutliers.length / yValues.length) * 100
    };

    // Generate insights
    analysis.insights = generateOutlierInsights(analysis);
    analysis.recommendations = generateOutlierRecommendations(analysis);

    return analysis;
  };

  const detectOutliersIQR = (values, multiplier = 1.5) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    return values.filter(val => val < lowerBound || val > upperBound);
  };

  const detectOutliersZScore = (values, threshold = 2.0) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return values.filter(val => Math.abs((val - mean) / stdDev) > threshold);
  };

  const detectOutliersIsolation = (values) => {
    // Simplified isolation forest implementation
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Consider values far from the median as potential outliers
    const median = sorted[Math.floor(sorted.length / 2)];
    const threshold = iqr * 2;
    
    return values.filter(val => Math.abs(val - median) > threshold);
  };

  const generateOutlierInsights = (analysis) => {
    const insights = [];
    const { outliers, statistics } = analysis;

    if (outliers.count === 0) {
      insights.push({
        type: 'success',
        message: 'No outliers detected in your data - excellent data quality!',
        icon: FiTarget
      });
    } else {
      insights.push({
        type: 'warning',
        message: `${outliers.count} outliers found (${outliers.percentage.toFixed(1)}% of data)`,
        icon: FiAlertTriangle
      });

      if (outliers.percentage > 10) {
        insights.push({
          type: 'error',
          message: 'High outlier percentage - consider data validation',
          icon: FiAlertTriangle
        });
      }

      // Check for patterns
      const outlierValues = outliers.values;
      const highOutliers = outlierValues.filter(val => val > statistics.mean);
      const lowOutliers = outlierValues.filter(val => val < statistics.mean);

      if (highOutliers.length > lowOutliers.length) {
        insights.push({
          type: 'info',
          message: 'More high outliers detected - possible upward bias',
          icon: FiTrendingUp
        });
      } else if (lowOutliers.length > highOutliers.length) {
        insights.push({
          type: 'info',
          message: 'More low outliers detected - possible downward bias',
          icon: FiTrendingDown
        });
      }
    }

    return insights;
  };

  const generateOutlierRecommendations = (analysis) => {
    const recommendations = [];
    const { outliers, statistics } = analysis;

    if (outliers.count > 0) {
      recommendations.push({
        action: 'investigate',
        message: 'Review outlier data points for accuracy',
        priority: 'high'
      });

      if (outliers.percentage > 5) {
        recommendations.push({
          action: 'validate',
          message: 'Consider data validation rules',
          priority: 'medium'
        });
      }

      recommendations.push({
        action: 'analyze',
        message: 'Examine outlier patterns for insights',
        priority: 'low'
      });
    } else {
      recommendations.push({
        action: 'monitor',
        message: 'Continue monitoring data quality',
        priority: 'low'
      });
    }

    return recommendations;
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
            <FiTarget className={`h-7 w-7 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Outlier Detection
      </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Smart anomaly detection and data quality analysis
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOutliers(!showOutliers)}
            className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
              showOutliers
                ? (darkMode ? 'bg-orange-600 text-white' : 'bg-orange-500 text-white')
                : (darkMode ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-800/70' : 'bg-orange-50 text-orange-700 hover:bg-orange-100')
            }`}
          >
            {showOutliers ? <FiEyeOff className="h-4 w-4 mr-2" /> : <FiEye className="h-4 w-4 mr-2" />}
            {showOutliers ? 'Hide' : 'Show'} Outliers
          </button>
          
          {isAnalyzing && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin">
                <FiZap className={`h-5 w-5 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`} />
              </div>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analyzing...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`font-semibold mb-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          🔧 Detection Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Detection Method
            </label>
            <select
              value={detectionMethod}
              onChange={(e) => setDetectionMethod(e.target.value)}
              className={`w-full p-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-200' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value="iqr">IQR Method (Recommended)</option>
              <option value="zscore">Z-Score Method</option>
              <option value="isolation">Isolation Forest</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sensitivity
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {sensitivity} (Lower = More Sensitive)
            </div>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Status
            </label>
            <div className={`p-2 rounded-lg text-sm font-medium ${
              outliers.count > 0
                ? (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700')
                : (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700')
            }`}>
              {outliers.count > 0 ? `${outliers.count} Outliers Found` : 'No Outliers Detected'}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {analysis && analysis.statistics && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-semibold mb-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            📊 Data Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Count</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {analysis.statistics.count}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mean</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {analysis.statistics.mean.toFixed(2)}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Std Dev</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {analysis.statistics.stdDev.toFixed(2)}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Range</div>
              <div className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {analysis.statistics.max - analysis.statistics.min}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis && analysis.insights.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-semibold mb-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            💡 Outlier Insights
          </h4>
          <div className="space-y-3">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <insight.icon className={`h-5 w-5 mt-0.5 ${getInsightColor(insight.type)}`} />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {insight.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-semibold mb-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            🎯 Recommendations
          </h4>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(rec.priority).replace('text-', 'bg-')}`} />
                <div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {rec.action.charAt(0).toUpperCase() + rec.action.slice(1)}:
                  </span>
                  <span className={`text-sm ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {rec.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlierDetection; 