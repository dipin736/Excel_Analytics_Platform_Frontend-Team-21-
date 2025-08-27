import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  FiZap, FiBarChart2, FiTrendingUp, FiPieChart, 
  FiTarget, FiCheckCircle, FiInfo,
  FiActivity
} from 'react-icons/fi';

const AIChartRecommender = ({ data, columns, darkMode, onChartSelect }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // Chart type definitions with icons and descriptions
  const chartTypes = {
    bar: {
      name: 'Bar Chart',
      icon: FiBarChart2,
      description: 'Compare categories or show rankings',
      bestFor: ['categorical data', 'comparisons', 'rankings'],
      color: 'blue'
    },
    line: {
      name: 'Line Chart',
      icon: FiTrendingUp,
      description: 'Show trends over time or continuous data',
      bestFor: ['time series', 'trends', 'continuous data'],
      color: 'green'
    },
    pie: {
      name: 'Pie Chart',
      icon: FiPieChart,
      description: 'Show proportions of a whole',
      bestFor: ['proportions', 'percentages', 'parts of whole'],
      color: 'purple'
    },
    doughnut: {
      name: 'Doughnut Chart',
      icon: FiPieChart,
      description: 'Show proportions with center space',
      bestFor: ['proportions', 'percentages', 'modern look'],
      color: 'pink'
    },
    '3d-pie': {
      name: '3D Pie Chart',
      icon: FiPieChart,
      description: 'Interactive 3D proportions visualization',
      bestFor: ['proportions', 'interactive', 'modern presentations'],
      color: 'indigo'
    },
    area: {
      name: 'Area Chart',
      icon: FiBarChart2,
      description: 'Show volume and trends over time',
      bestFor: ['time series', 'volume data', 'cumulative values'],
      color: 'teal'
    },
    scatter: {
      name: 'Scatter Plot',
      icon: FiActivity,
      description: 'Show relationships between two variables',
      bestFor: ['correlations', 'relationships', 'two variables'],
      color: 'orange'
    }
  };

  // Auto-analyze when data or axes change
  useEffect(() => {
    if (data && data.length > 0 && columns && columns.length > 0) {
      analyzeDataAndRecommend();
    }
  }, [data, columns]); // This will trigger when axes change too

  const analyzeDataAndRecommend = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await performDataAnalysis();
      setAnalysis(analysis);
      
      const recommendations = generateRecommendations(analysis);
      
      // Always use smart recommendations if available, otherwise use basic
      if (recommendations.length > 0) {
        setRecommendations(recommendations);
      } else {
        const basicRecommendations = generateBasicRecommendations();
        setRecommendations(basicRecommendations);
      }
      
    } catch (error) {
      console.error('AI analysis error:', error);
      const basicRecommendations = generateBasicRecommendations();
      setRecommendations(basicRecommendations);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performDataAnalysis = async () => {
    const analysis = {
      dataTypes: {},
      patterns: {},
      insights: [],
      recommendations: []
    };

    // Analyze only the selected columns (axes)
    const columnsToAnalyze = columns.slice(0, 2); // Only analyze first 2 columns (X and Y axes)

    columnsToAnalyze.forEach((column, colIndex) => {
      const columnData = data.map(row => row[column]).filter(val => val !== null && val !== '');
      analysis.dataTypes[column] = detectDataType(columnData);
      analysis.patterns[column] = analyzePatterns(columnData, column);
    });

    // Generate insights
    analysis.insights = generateInsights(analysis);
    
    return analysis;
  };

  const detectDataType = (data) => {
    if (data.length === 0) return 'empty';
    
    const sample = data.slice(0, Math.min(100, data.length));
    let numericCount = 0;
    let dateCount = 0;
    let uniqueCount = new Set(sample).size;
    let totalCount = sample.length;
    
    sample.forEach(val => {
      const strVal = String(val).trim();
      
      // Check for numeric (including decimals, negative numbers, percentages)
      if (!isNaN(parseFloat(strVal)) && isFinite(strVal) && strVal !== '') {
        // Additional check: if it's a number and not just a single digit that might be categorical
        const numVal = parseFloat(strVal);
        if (numVal >= 0 && numVal <= 100) { // Common range for scores/grades
          numericCount++;
        } else if (numVal > 100 || numVal < 0) { // Other numeric values
          numericCount++;
        }
      }
      
      // Check for date (more comprehensive date detection)
      if (isValidDate(strVal)) {
        dateCount++;
      }
    });
    
    const numericRatio = numericCount / totalCount;
    const dateRatio = dateCount / totalCount;
    const uniquenessRatio = uniqueCount / totalCount;
    
    // Priority order: Date > Numeric > Categorical > Text
    if (dateRatio > 0.7) return 'date';
    if (numericRatio > 0.6) return 'numeric'; // Lowered threshold for numeric detection
    if (uniquenessRatio < 0.5 && totalCount > 5) return 'categorical';
    return 'text';
  };

  const isValidDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const str = dateString.trim();
    if (str === '') return false;
    
    // Try multiple date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or M/D/YYYY
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/M/D
      /^\d{1,2}-\d{1,2}-\d{2,4}$/, // M-D-YY or M-D-YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-M-D
    ];
    
    // Check if string matches any date format
    const matchesFormat = dateFormats.some(format => format.test(str));
    if (!matchesFormat) return false;
    
    // Try to parse the date
    const date = new Date(str);
    return date instanceof Date && !isNaN(date) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
  };

  const analyzePatterns = (data, columnName) => {
    const patterns = {
      hasTrend: false,
      hasSeasonality: false,
      distribution: 'unknown',
      outliers: 0,
      uniqueValues: new Set(data).size,
      totalValues: data.length
    };

    if (patterns.uniqueValues < 10) {
      patterns.distribution = 'categorical';
    } else if (patterns.uniqueValues / patterns.totalValues > 0.8) {
      patterns.distribution = 'continuous';
    } else {
      patterns.distribution = 'mixed';
    }

    // Detect trends in numeric data
    if (detectDataType(data) === 'numeric') {
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      if (numericData.length > 5) {
        patterns.hasTrend = detectTrend(numericData);
        patterns.outliers = detectOutliers(numericData).length;
      }
    }

    return patterns;
  };

  const detectTrend = (data) => {
    if (data.length < 3) return false;
    
    // Simple trend detection using linear regression
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.abs(slope) > 0.1; // Threshold for trend detection
  };

  const detectOutliers = (data) => {
    if (data.length < 4) return [];
    
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return data.filter(val => val < lowerBound || val > upperBound);
  };

  const generateInsights = (analysis) => {
    const insights = [];
    
    // Data type insights
    const dataTypes = Object.values(analysis.dataTypes);
    const hasNumeric = dataTypes.includes('numeric');
    const hasDate = dataTypes.includes('date');
    const hasCategorical = dataTypes.includes('categorical');
    
    if (hasNumeric && hasCategorical) {
      insights.push({
        type: 'info',
        message: 'Perfect! You have both numeric and categorical data - great for comparisons.',
        icon: FiCheckCircle
      });
    }
    
    if (hasDate) {
      insights.push({
        type: 'trend',
        message: 'Time-based data detected - perfect for trend analysis!',
        icon: FiTrendingUp
      });
    }
    
    // Pattern insights
    Object.entries(analysis.patterns).forEach(([column, pattern]) => {
      if (pattern.hasTrend) {
        insights.push({
          type: 'trend',
          message: `Trend detected in "${column}" - consider time series charts.`,
          icon: FiTrendingUp
        });
      }
      
      if (pattern.outliers > 0) {
        insights.push({
          type: 'warning',
          message: `${pattern.outliers} outliers found in "${column}" - worth investigating.`,
          icon: FiTarget
        });
      }
    });
    
    return insights;
  };

  const generateRecommendations = (analysis) => {
    const recommendations = [];
    const dataTypes = Object.values(analysis.dataTypes);
    const patterns = analysis.patterns;
    
    // Get column names for different types
    const numericColumns = Object.keys(analysis.dataTypes).filter(col => 
      analysis.dataTypes[col] === 'numeric'
    );
    const categoricalColumns = Object.keys(analysis.dataTypes).filter(col => 
      analysis.dataTypes[col] === 'categorical'
    );
    const dateColumns = Object.keys(analysis.dataTypes).filter(col => 
      analysis.dataTypes[col] === 'date'
    );
    const textColumns = Object.keys(analysis.dataTypes).filter(col => 
      analysis.dataTypes[col] === 'text'
    );

    // If we have text columns that might be numeric, try to convert them
    if (textColumns.length > 0 && numericColumns.length === 0) {
      textColumns.forEach(col => {
        const columnData = data.map(row => row[col]).filter(val => val !== null && val !== '');
        const sample = columnData.slice(0, Math.min(10, columnData.length));
        const numericSample = sample.filter(val => !isNaN(parseFloat(val)) && isFinite(parseFloat(val)));
        
        if (numericSample.length / sample.length > 0.7) {
          analysis.dataTypes[col] = 'numeric';
          numericColumns.push(col);
          textColumns.splice(textColumns.indexOf(col), 1);
        }
      });
    }

    // Calculate data characteristics
    const totalRows = data.length;
    const hasTimeSeries = dateColumns.length > 0;
    const hasComparisons = categoricalColumns.length > 0 && numericColumns.length > 0;
    const hasCorrelations = numericColumns.length >= 2;
    const hasProportions = categoricalColumns.length > 0 && numericColumns.length > 0;
    const hasNumericOnly = numericColumns.length > 0 && categoricalColumns.length === 0;
    const hasCategoricalOnly = categoricalColumns.length > 0 && numericColumns.length === 0;

    // Industry-standard chart selection logic with percentage scores

    // 1. BAR CHART - Best for comparisons (Categorical vs Numeric)
    if (hasComparisons) {
      const categoricalCol = categoricalColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[categoricalCol];
      
      let barScore = 85; // Base score
      
      // Adjust score based on data characteristics
      if (pattern && pattern.uniqueValues <= 15) barScore += 10; // Good for bar charts
      if (pattern && pattern.uniqueValues > 20) barScore -= 15; // Too many categories
      if (totalRows > 100) barScore += 5; // More data = better confidence
      
      recommendations.push({
        chartType: 'bar',
        confidence: Math.min(barScore, 95),
        reason: `Compare ${categoricalCol} categories using ${numericCol} values`,
        explanation: 'Bar charts excel at comparing different categories or groups. They\'re easy to read and great for showing rankings.',
        suggestedAxes: {
          xAxis: categoricalCol,
          yAxis: numericCol
        }
      });
    }

    // 2. LINE CHART - Best for trends over time OR sequential data
    if (hasTimeSeries && numericColumns.length > 0) {
      const dateCol = dateColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[numericCol];
      
      let lineScore = 90; // High base score for time series
      
      // Check for trends
      if (pattern && pattern.hasTrend) lineScore += 8;
      if (totalRows >= 10) lineScore += 5; // Need enough data points
      if (totalRows < 5) lineScore -= 20; // Too few data points
      
      recommendations.push({
        chartType: 'line',
        confidence: Math.min(lineScore, 98),
        reason: `Show trends over time using ${dateCol} and ${numericCol}`,
        explanation: pattern && pattern.hasTrend 
          ? 'Strong trend detected! Line charts will clearly show the pattern over time.'
          : 'Line charts are perfect for visualizing how values change over time.',
        suggestedAxes: {
          xAxis: dateCol,
          yAxis: numericCol
        }
      });
    }

    // 2b. LINE CHART for sequential numeric data (even without dates)
    if (hasNumericOnly && numericColumns.length >= 2) {
      const numCol1 = numericColumns[0];
      const numCol2 = numericColumns[1];
      const pattern = patterns[numCol2];
      
      let lineScore = 75;
      if (pattern && pattern.hasTrend) lineScore += 10;
      if (totalRows >= 10) lineScore += 5;
      
      recommendations.push({
        chartType: 'line',
        confidence: Math.min(lineScore, 85),
        reason: `Show trends between ${numCol1} and ${numCol2}`,
        explanation: 'Line charts can show relationships and trends between numeric variables.',
        suggestedAxes: {
          xAxis: numCol1,
          yAxis: numCol2
        }
      });
    }

    // 3. PIE CHART - Best for proportions (limited categories)
    if (hasProportions) {
      const categoricalCol = categoricalColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[categoricalCol];
      
      if (pattern && pattern.uniqueValues <= 8) {
        let pieScore = 80;
        
        // Pie charts work best with 2-8 categories
        if (pattern.uniqueValues >= 3 && pattern.uniqueValues <= 6) pieScore += 15;
        if (pattern.uniqueValues > 8) pieScore -= 30; // Too many categories
        
        recommendations.push({
          chartType: 'pie',
          confidence: Math.max(pieScore, 60),
          reason: `Show proportions of ${categoricalCol} (${pattern.uniqueValues} categories)`,
          explanation: 'Pie charts are ideal for showing how parts relate to the whole when you have 2-8 categories.',
          suggestedAxes: {
            xAxis: categoricalCol,
            yAxis: numericCol
          }
        });
      }
    }

    // 4. 3D PIE CHART - Enhanced pie for better visualization
    if (hasProportions) {
      const categoricalCol = categoricalColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[categoricalCol];
      
      if (pattern && pattern.uniqueValues <= 10) {
        let pie3dScore = 75;
        
        if (pattern.uniqueValues >= 3 && pattern.uniqueValues <= 8) pie3dScore += 10;
        if (totalRows > 50) pie3dScore += 5; // More data = better 3D effect
        
        recommendations.push({
          chartType: '3d-pie',
          confidence: Math.max(pie3dScore, 65),
          reason: `Interactive 3D visualization of ${categoricalCol} proportions`,
          explanation: '3D pie charts provide an engaging way to show proportions with interactive controls and depth.',
          suggestedAxes: {
            xAxis: categoricalCol,
            yAxis: numericCol
          }
        });
      }
    }

    // 5. SCATTER PLOT - Best for correlations between two numeric variables
    if (hasCorrelations) {
      const numCol1 = numericColumns[0];
      const numCol2 = numericColumns[1];
      const pattern1 = patterns[numCol1];
      const pattern2 = patterns[numCol2];
      
      let scatterScore = 85;
      
      // Check for outliers (scatter plots are great for showing outliers)
      if (pattern1 && pattern1.outliers > 0) scatterScore += 10;
      if (pattern2 && pattern2.outliers > 0) scatterScore += 10;
      if (totalRows >= 20) scatterScore += 5; // More data points = better correlation analysis
      
      recommendations.push({
        chartType: 'scatter',
        confidence: Math.min(scatterScore, 95),
        reason: `Explore relationship between ${numCol1} and ${numCol2}`,
        explanation: 'Scatter plots reveal correlations, patterns, and outliers between two variables.',
        suggestedAxes: {
          xAxis: numCol1,
          yAxis: numCol2
        }
      });
    }

    // 6. AREA CHART - Best for volume trends over time
    if (hasTimeSeries && numericColumns.length > 0) {
      const dateCol = dateColumns[0];
      const numericCol = numericColumns[0];
      
      let areaScore = 75;
      
      if (totalRows >= 15) areaScore += 10; // Need enough data for area visualization
      if (patterns[numericCol] && patterns[numericCol].hasTrend) areaScore += 8;
      
      recommendations.push({
        chartType: 'area',
        confidence: Math.min(areaScore, 90),
        reason: `Show volume trends over time using ${dateCol}`,
        explanation: 'Area charts emphasize the volume and cumulative nature of time series data.',
        suggestedAxes: {
          xAxis: dateCol,
          yAxis: numericCol
        }
      });
    }

    // 7. DOUGHNUT CHART - Alternative to pie with center space
    if (hasProportions) {
      const categoricalCol = categoricalColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[categoricalCol];
      
      if (pattern && pattern.uniqueValues <= 8) {
        let doughnutScore = 70;
        
        if (pattern.uniqueValues >= 3 && pattern.uniqueValues <= 6) doughnutScore += 10;
        
        recommendations.push({
          chartType: 'doughnut',
          confidence: Math.max(doughnutScore, 60),
          reason: `Show proportions with center space for ${categoricalCol}`,
          explanation: 'Doughnut charts are similar to pie charts but with center space for additional information.',
          suggestedAxes: {
            xAxis: categoricalCol,
            yAxis: numericCol
          }
        });
      }
    }

    // 8. AREA CHART - Best for volume trends over time
    if (hasTimeSeries && numericColumns.length > 0) {
      const dateCol = dateColumns[0];
      const numericCol = numericColumns[0];
      
      let areaScore = 75;
      
      if (totalRows >= 15) areaScore += 10; // Need enough data for area visualization
      if (patterns[numericCol] && patterns[numericCol].hasTrend) areaScore += 8;
      
      recommendations.push({
        chartType: 'area',
        confidence: Math.min(areaScore, 90),
        reason: `Show volume trends over time using ${dateCol}`,
        explanation: 'Area charts emphasize the volume and cumulative nature of time series data.',
        suggestedAxes: {
          xAxis: dateCol,
          yAxis: numericCol
        }
      });
    }

    // 9. 3D PIE CHART - Enhanced pie for better visualization
    if (hasProportions) {
      const categoricalCol = categoricalColumns[0];
      const numericCol = numericColumns[0];
      const pattern = patterns[categoricalCol];
      
      if (pattern && pattern.uniqueValues <= 10) {
        let pie3dScore = 75;
        
        if (pattern.uniqueValues >= 3 && pattern.uniqueValues <= 8) pie3dScore += 10;
        if (totalRows > 50) pie3dScore += 5; // More data = better 3D effect
        
        recommendations.push({
          chartType: '3d-pie',
          confidence: Math.max(pie3dScore, 65),
          reason: `Interactive 3D visualization of ${categoricalCol} proportions`,
          explanation: '3D pie charts provide an engaging way to show proportions with interactive controls and depth.',
          suggestedAxes: {
            xAxis: categoricalCol,
            yAxis: numericCol
          }
        });
      }
    }

    // 10. SCATTER PLOT - Best for correlations between two numeric variables
    if (hasCorrelations) {
      const numCol1 = numericColumns[0];
      const numCol2 = numericColumns[1];
      const pattern1 = patterns[numCol1];
      const pattern2 = patterns[numCol2];
      
      let scatterScore = 85;
      
      // Check for outliers (scatter plots are great for showing outliers)
      if (pattern1 && pattern1.outliers > 0) scatterScore += 10;
      if (pattern2 && pattern2.outliers > 0) scatterScore += 10;
      if (totalRows >= 20) scatterScore += 5; // More data points = better correlation analysis
      
      recommendations.push({
        chartType: 'scatter',
        confidence: Math.min(scatterScore, 95),
        reason: `Explore relationship between ${numCol1} and ${numCol2}`,
        explanation: 'Scatter plots reveal correlations, patterns, and outliers between two variables.',
        suggestedAxes: {
          xAxis: numCol1,
          yAxis: numCol2
        }
      });
    }

    // Sort by confidence (highest first)
    const sortedRecommendations = recommendations.sort((a, b) => b.confidence - a.confidence);
    return sortedRecommendations;
  };

  const generateBasicRecommendations = () => {
    const basicRecommendations = [];
    
    // Use only the first 2 columns (selected axes)
    const selectedColumns = columns.slice(0, 2);
    
    if (selectedColumns.length >= 2) {
      // Always recommend bar chart as a safe option
      basicRecommendations.push({
        chartType: 'bar',
        confidence: 85,
        reason: 'General purpose chart for comparisons',
        explanation: 'Bar charts work well for most data types and are easy to understand.',
        suggestedAxes: {
          xAxis: selectedColumns[0],
          yAxis: selectedColumns[1]
        }
      });
      
      // Recommend line chart if we have enough data points
      if (data && data.length > 5) {
        basicRecommendations.push({
          chartType: 'line',
          confidence: 80,
          reason: 'Show trends and patterns in your data',
          explanation: 'Line charts are great for showing how values change over time or sequence.',
          suggestedAxes: {
            xAxis: selectedColumns[0],
            yAxis: selectedColumns[1]
          }
        });
      }
      
      // Recommend pie chart for categorical data
      basicRecommendations.push({
        chartType: 'pie',
        confidence: 75,
        reason: 'Show proportions and percentages',
        explanation: 'Pie charts are perfect for showing how parts relate to the whole.',
        suggestedAxes: {
          xAxis: selectedColumns[0],
          yAxis: selectedColumns[1]
        }
      });

      // Recommend 3D pie for better visualization
      basicRecommendations.push({
        chartType: '3d-pie',
        confidence: 70,
        reason: 'Interactive 3D proportions visualization',
        explanation: '3D pie charts provide an engaging way to show proportions with interactive controls.',
        suggestedAxes: {
          xAxis: selectedColumns[0],
          yAxis: selectedColumns[1]
        }
      });

      // Recommend area chart for volume visualization
      if (data && data.length > 10) {
        basicRecommendations.push({
          chartType: 'area',
          confidence: 75,
          reason: 'Show volume and cumulative data',
          explanation: 'Area charts emphasize the volume and cumulative nature of your data.',
          suggestedAxes: {
            xAxis: selectedColumns[0],
            yAxis: selectedColumns[1]
          }
        });
      }

      // Recommend doughnut chart as pie alternative
      basicRecommendations.push({
        chartType: 'doughnut',
        confidence: 70,
        reason: 'Show proportions with center space',
        explanation: 'Doughnut charts are similar to pie charts but with center space for additional information.',
        suggestedAxes: {
          xAxis: selectedColumns[0],
          yAxis: selectedColumns[1]
        }
      });
    }
    
    return basicRecommendations;
  };

  const handleChartSelect = (recommendation) => {
    if (onChartSelect) {
      onChartSelect({
        chartType: recommendation.chartType,
        xAxis: recommendation.suggestedAxes.xAxis,
        yAxis: recommendation.suggestedAxes.yAxis
      });
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 90) return 'Excellent';
    if (confidence >= 80) return 'Very Good';
    if (confidence >= 70) return 'Good';
    return 'Fair';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <FiZap className={`h-7 w-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              AI Chart Recommendations
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Smart suggestions based on your data patterns
            </p>
          </div>
        </div>
        
        {isAnalyzing && (
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <FiZap className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Analyzing...
            </span>
          </div>
        )}
      </div>

      {/* Data Insights */}
      {analysis && analysis.insights.length > 0 && (
        <div className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-semibold mb-4 text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            📊 Data Insights
          </h4>
          <div className="space-y-3">
            {analysis.insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <insight.icon className={`h-5 w-5 mt-0.5 ${
                  insight.type === 'trend' ? 'text-green-500' :
                  insight.type === 'warning' ? 'text-orange-500' :
                  'text-blue-500'
                }`} />
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {insight.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Recommendations */}
      <div className="space-y-4">
        <h4 className={`font-semibold text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          🎯 Recommended Charts
        </h4>
        
        <AnimatePresence>
          {recommendations.map((recommendation, index) => {
            const chartInfo = chartTypes[recommendation.chartType];
            return (
              <motion.div
                key={`${recommendation.chartType}-${recommendation.confidence}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750' 
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleChartSelect(recommendation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <chartInfo.icon className={`h-6 w-6 text-${chartInfo.color}-500`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className={`font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                          {chartInfo.name}
                        </h5>
                        <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                          {recommendation.confidence}% - {getConfidenceText(recommendation.confidence)}
                        </span>
                      </div>
                      <p className={`font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {recommendation.reason}
                      </p>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {recommendation.explanation}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs">
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          X: {recommendation.suggestedAxes.xAxis}
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Y: {recommendation.suggestedAxes.yAxis}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                    {recommendation.confidence}%
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* No recommendations state */}
      {!isAnalyzing && recommendations.length === 0 && (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <FiInfo className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No chart recommendations available for this data.</p>
        </div>
      )}
    </div>
  );
};

export default AIChartRecommender; 