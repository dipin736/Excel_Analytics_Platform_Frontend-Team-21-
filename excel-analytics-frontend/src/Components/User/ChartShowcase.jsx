import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DynamicChart from './DynamicChart';
import InteractiveChartControls from './InteractiveChartControls';
import { FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const ChartShowcase = ({ darkMode = false }) => {
  const [selectedChart, setSelectedChart] = useState('waterfall');
  const [filteredData, setFilteredData] = useState(null);

  // Sample data for different chart types
  const sampleData = {
    waterfall: [
      { period: 'Q1 Start', value: 100 },
      { period: 'Revenue', value: 50 },
      { period: 'Costs', value: -20 },
      { period: 'Profit', value: 30 },
      { period: 'Q1 End', value: 160 }
    ],
    gauge: [
      { metric: 'Performance', value: 85, target: 100 },
      { metric: 'Efficiency', value: 92, target: 100 }
    ],
    funnel: [
      { stage: 'Visitors', value: 10000 },
      { stage: 'Leads', value: 5000 },
      { stage: 'Prospects', value: 2000 },
      { stage: 'Customers', value: 500 }
    ],
    radar: [
      { skill: 'JavaScript', score: 85 },
      { skill: 'React', score: 90 },
      { skill: 'Python', score: 75 },
      { skill: 'SQL', score: 80 },
      { skill: 'Analytics', score: 95 }
    ],
    bubble: [
      { product: 'A', sales: 1000, profit: 200, marketShare: 15 },
      { product: 'B', sales: 800, profit: 150, marketShare: 12 },
      { product: 'C', sales: 1200, profit: 180, marketShare: 18 },
      { product: 'D', sales: 600, profit: 100, marketShare: 8 }
    ],
    '3d-pie': [
      { category: 'Desktop', users: 45 },
      { category: 'Mobile', users: 35 },
      { category: 'Tablet', users: 20 }
    ]
  };

  // Chart configurations
  const chartConfigs = {
    waterfall: {
      title: 'Quarterly Financial Waterfall',
      chartType: 'waterfall',
      xAxis: 'period',
      yAxis: 'value',
      description: 'Shows cumulative impact of positive and negative changes'
    },
    gauge: {
      title: 'Performance Dashboard',
      chartType: 'gauge',
      xAxis: 'metric',
      yAxis: 'value',
      description: 'Displays metrics against targets with visual indicators'
    },
    funnel: {
      title: 'Sales Conversion Funnel',
      chartType: 'funnel',
      xAxis: 'stage',
      yAxis: 'value',
      description: 'Visualizes conversion rates through process stages'
    },
    radar: {
      title: 'Skills Assessment Radar',
      chartType: 'radar',
      xAxis: 'skill',
      yAxis: 'score',
      description: 'Multi-dimensional comparison across multiple categories'
    },
    bubble: {
      title: 'Product Performance Matrix',
      chartType: 'bubble',
      xAxis: 'sales',
      yAxis: 'profit',
      zAxis: 'marketShare',
      description: 'Three-dimensional data visualization with bubble sizes'
    },
    '3d-pie': {
      title: 'User Device Distribution',
      chartType: '3d-pie',
      xAxis: 'category',
      yAxis: 'users',
      description: 'Enhanced pie chart with 3D visual effects'
    }
  };

  const handleDataFilter = (newData) => {
    setFilteredData(newData);
  };

  const handleExport = (format) => {
    // Export functionality

  };

  const handleReset = () => {
    setFilteredData(null);
  };

  const chartTypes = [
    { key: 'waterfall', label: 'Waterfall Chart', icon: FiTrendingUp, color: 'bg-cyan-500' },
    { key: 'gauge', label: 'Gauge Chart', icon: FiBarChart2, color: 'bg-red-500' },
    { key: 'funnel', label: 'Funnel Chart', icon: FiTrendingUp, color: 'bg-yellow-500' },
    { key: 'radar', label: 'Radar Chart', icon: FiBarChart2, color: 'bg-lime-500' },
    { key: 'bubble', label: 'Bubble Chart', icon: FiBarChart2, color: 'bg-sky-500' },
    { key: '3d-pie', label: '3D Pie Chart', icon: FiPieChart, color: 'bg-purple-600' }
  ];

  const currentData = filteredData || sampleData[selectedChart];
  const currentConfig = chartConfigs[selectedChart];

  return (
    <div className={`p-6 space-y-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Advanced Excel-Style Chart Showcase
        </h1>
        <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Professional charting capabilities inspired by Excel's advanced features
        </p>
      </div>

      {/* Chart Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {chartTypes.map((type) => {
          const Icon = type.icon;
          return (
            <motion.button
              key={type.key}
              onClick={() => setSelectedChart(type.key)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedChart === type.key
                  ? `${type.color} text-white border-transparent shadow-lg`
                  : darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{type.label}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Interactive Controls */}
      <InteractiveChartControls
        chartConfig={currentConfig}
        data={sampleData[selectedChart]}
        darkMode={darkMode}
        onDataFilter={handleDataFilter}
        onExport={handleExport}
        onReset={handleReset}
        className="mb-6"
      />

      {/* Chart Display */}
      <motion.div
        key={selectedChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl shadow-lg p-6 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        {/* Chart Title and Description */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{currentConfig.title}</h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentConfig.description}
          </p>
        </div>

        {/* Chart Container */}
        <div className="h-96 w-full">
          <DynamicChart
            data={currentData}
            chartType={currentConfig.chartType}
            xAxis={currentConfig.xAxis}
            yAxis={currentConfig.yAxis}
            zAxis={currentConfig.zAxis}
            darkMode={darkMode}
            title={currentConfig.title}
            config={{
              theme: 'default',
              responsive: true,
              maintainAspectRatio: false
            }}
            chartControls={{
              showLegend: true,
              showGrid: true,
              enableAnimation: true
            }}
          />
        </div>

        {/* Chart Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-medium mb-2">✨ Interactive Features</h4>
            <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Real-time data filtering</li>
              <li>• Zoom and pan controls</li>
              <li>• Animation toggle</li>
              <li>• Export capabilities</li>
            </ul>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-medium mb-2">🎨 Visual Options</h4>
            <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Multiple color themes</li>
              <li>• 3D effects for supported charts</li>
              <li>• Responsive design</li>
              <li>• Dark/light mode support</li>
            </ul>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-medium mb-2">📊 Data Analysis</h4>
            <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <li>• Multi-dimensional visualization</li>
              <li>• Trend analysis</li>
              <li>• Comparative metrics</li>
              <li>• Data range selection</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Implementation Notes */}
      <div className={`rounded-lg p-6 ${darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
        <h3 className="text-lg font-semibold mb-3">🔧 Implementation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2 text-green-600">✅ Completed Features</h4>
            <ul className="text-sm space-y-1">
              <li>• Enhanced chart type library (18+ charts)</li>
              <li>• Advanced chart renderer component</li>
              <li>• Interactive controls framework</li>
              <li>• 3D chart support</li>
              <li>• Professional styling options</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-orange-600">🚧 Recommended Next Steps</h4>
            <ul className="text-sm space-y-1">
              <li>• Add chart.js plugins for advanced features</li>
              <li>• Implement data drill-down capabilities</li>
              <li>• Add chart templates and presets</li>
              <li>• Enhanced export options (PDF, SVG)</li>
              <li>• Real-time data streaming support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartShowcase; 