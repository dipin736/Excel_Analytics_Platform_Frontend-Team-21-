import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FiTrendingUp, FiTrendingDown, FiMinus,
  FiBarChart2, FiPieChart, FiActivity,
  FiInfo, FiDownload
} from 'react-icons/fi';
import DynamicChart from './DynamicChart';

const StatisticalAnalysis = ({ data, darkMode }) => {
  const [selectedMetric, setSelectedMetric] = useState('mean');
  const [selectedColumn, setSelectedColumn] = useState(Object.keys(data)[0]);
  
  const columns = Object.keys(data);
  
  const metrics = [
    { key: 'mean', label: 'Mean', icon: FiMinus, description: 'Average value' },
    { key: 'median', label: 'Median', icon: FiActivity, description: 'Middle value' },
    { key: 'standardDeviation', label: 'Std Dev', icon: FiTrendingUp, description: 'Spread of data' },
    { key: 'variance', label: 'Variance', icon: FiBarChart2, description: 'Data variability' },
    { key: 'skewness', label: 'Skewness', icon: FiTrendingDown, description: 'Data asymmetry' },
    { key: 'kurtosis', label: 'Kurtosis', icon: FiPieChart, description: 'Tail behavior' }
  ];

  const getMetricColor = (value, metric) => {
    switch (metric) {
      case 'skewness':
        if (Math.abs(value) < 0.5) return 'text-green-500';
        if (Math.abs(value) < 1) return 'text-yellow-500';
        return 'text-red-500';
      case 'kurtosis':
        if (Math.abs(value) < 1) return 'text-green-500';
        if (Math.abs(value) < 2) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return darkMode ? 'text-gray-100' : 'text-gray-800';
    }
  };

  const getMetricInterpretation = (value, metric) => {
    switch (metric) {
      case 'skewness':
        if (Math.abs(value) < 0.5) return 'Approximately symmetric';
        if (value > 0.5) return 'Right-skewed (tail extends right)';
        return 'Left-skewed (tail extends left)';
      case 'kurtosis':
        if (Math.abs(value) < 1) return 'Normal tail behavior';
        if (value > 1) return 'Heavy-tailed distribution';
        return 'Light-tailed distribution';
      default:
        return '';
    }
  };

  const formatValue = (value, metric) => {
    if (typeof value !== 'number') return 'N/A';
    
    switch (metric) {
      case 'count':
        return Math.round(value).toLocaleString();
      case 'skewness':
      case 'kurtosis':
        return value.toFixed(3);
      default:
        return value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
    }
  };

  const chartData = useMemo(() => {
    return columns.map(col => ({
      column: col,
      [selectedMetric]: data[col][selectedMetric]
    }));
  }, [data, selectedMetric, columns]);

  const renderStatCard = (column, stats) => (
    <motion.div
      key={column}
      className={`p-6 rounded-lg border ${
        selectedColumn === column
          ? darkMode ? 'border-blue-500 bg-gray-700' : 'border-blue-500 bg-blue-50'
          : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
      } cursor-pointer transition-all hover:shadow-lg`}
      onClick={() => setSelectedColumn(column)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <h3 className={`text-lg font-semibold mb-4 ${
        darkMode ? 'text-gray-100' : 'text-gray-800'
      }`}>
        {column}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Count
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.count, 'count')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Mean
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.mean, 'mean')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Median
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.median, 'median')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Mode
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.mode, 'mode')}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Min
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.min, 'min')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Max
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.max, 'max')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Range
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.range, 'range')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Std Dev
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.standardDeviation, 'standardDeviation')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Advanced Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Skewness
            </span>
            <span className={`font-medium ${getMetricColor(stats.skewness, 'skewness')}`}>
              {formatValue(stats.skewness, 'skewness')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Kurtosis
            </span>
            <span className={`font-medium ${getMetricColor(stats.kurtosis, 'kurtosis')}`}>
              {formatValue(stats.kurtosis, 'kurtosis')}
            </span>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Q1 - Q3
            </span>
            <span className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {formatValue(stats.quartile1, 'quartile1')} - {formatValue(stats.quartile3, 'quartile3')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDetailedView = () => {
    if (!selectedColumn || !data[selectedColumn]) return null;
    
    const stats = data[selectedColumn];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-6 p-6 rounded-lg border ${
          darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-semibold ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Detailed Analysis: {selectedColumn}
          </h3>
          <button
            className={`flex items-center px-3 py-2 rounded-lg text-sm ${
              darkMode 
                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistical Summary */}
          <div>
            <h4 className={`text-lg font-medium mb-4 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Statistical Summary
            </h4>
            
            <div className="space-y-4">
              {/* Central Tendency */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <h5 className={`font-medium mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Central Tendency
                </h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {formatValue(stats.mean, 'mean')}
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Mean
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatValue(stats.median, 'median')}
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Median
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {formatValue(stats.mode, 'mode')}
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Mode
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Variability */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <h5 className={`font-medium mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Variability
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Standard Deviation:</span>
                    <span className="font-medium">
                      {formatValue(stats.standardDeviation, 'standardDeviation')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance:</span>
                    <span className="font-medium">
                      {formatValue(stats.variance, 'variance')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Range:</span>
                    <span className="font-medium">
                      {formatValue(stats.range, 'range')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IQR (Q3-Q1):</span>
                    <span className="font-medium">
                      {formatValue(stats.quartile3 - stats.quartile1, 'range')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Distribution Shape */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <h5 className={`font-medium mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Distribution Shape
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <span>Skewness:</span>
                      <span className={`font-medium ${getMetricColor(stats.skewness, 'skewness')}`}>
                        {formatValue(stats.skewness, 'skewness')}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {getMetricInterpretation(stats.skewness, 'skewness')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center">
                      <span>Kurtosis:</span>
                      <span className={`font-medium ${getMetricColor(stats.kurtosis, 'kurtosis')}`}>
                        {formatValue(stats.kurtosis, 'kurtosis')}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {getMetricInterpretation(stats.kurtosis, 'kurtosis')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualization */}
          <div>
            <h4 className={`text-lg font-medium mb-4 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Distribution Visualization
            </h4>
            
            {/* Metric Selector */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {metrics.map(metric => (
                  <button
                    key={metric.key}
                    onClick={() => setSelectedMetric(metric.key)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedMetric === metric.key
                        ? 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <metric.icon className="mr-2 h-4 w-4" />
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chart */}
            <div className={`h-96 rounded-lg border ${
              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
            } p-4`}>
              <DynamicChart
                data={chartData}
                chartType="bar"
                xAxis="column"
                yAxis={selectedMetric}
                darkMode={darkMode}
              />
            </div>
            
            {/* Interpretation */}
            <div className={`mt-4 p-3 rounded-lg ${
              darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
            } border`}>
              <div className="flex items-start">
                <FiInfo className={`mr-2 h-5 w-5 mt-0.5 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <div className={`font-medium ${
                    darkMode ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    {metrics.find(m => m.key === selectedMetric)?.label} Analysis
                  </div>
                  <div className={`text-sm mt-1 ${
                    darkMode ? 'text-blue-200' : 'text-blue-700'
                  }`}>
                    {metrics.find(m => m.key === selectedMetric)?.description}
                    {getMetricInterpretation(stats[selectedMetric], selectedMetric) && 
                      ` - ${getMetricInterpretation(stats[selectedMetric], selectedMetric)}`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(data).map(([column, stats]) => 
          renderStatCard(column, stats)
        )}
      </div>
      
      {/* Detailed View */}
      {renderDetailedView()}
    </div>
  );
};

export default StatisticalAnalysis; 