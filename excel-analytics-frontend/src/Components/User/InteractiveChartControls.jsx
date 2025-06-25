import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFilter,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiMaximize,
  FiMinimize,
  FiRefreshCw,
  FiDownload,
  FiSettings,
  FiEye,
  FiEyeOff,
  FiPlay,
  FiPause,
  FiSkipBack,
  FiSkipForward,
  FiTrendingUp,
  FiBarChart3
} from 'react-icons/fi';

const InteractiveChartControls = ({
  chartConfig,
  onConfigChange,
  data = [],
  darkMode = false,
  onDataFilter,
  onExport,
  onReset,
  className = ''
}) => {
  const [activeFilters, setActiveFilters] = useState({});
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [selectedDataRange, setSelectedDataRange] = useState([0, data.length - 1]);

  // Interactive features based on Excel professional charts
  const interactiveFeatures = {
    // Data Filtering and Selection
    filtering: {
      enabled: true,
      multiSelect: true,
      searchable: true
    },
    // Zoom and Pan Controls
    zoom: {
      enabled: true,
      minZoom: 50,
      maxZoom: 300,
      step: 25
    },
    // Animation Controls
    animation: {
      enabled: true,
      duration: 750,
      easing: 'easeInOut'
    },
    // 3D Controls (for 3D charts)
    rotation: {
      enabled: chartConfig.chartType?.includes('3d'),
      step: 15,
      maxAngle: 360
    },
    // Data Range Selection
    dataRange: {
      enabled: true,
      slider: true,
      stepThrough: true
    }
  };

  // Handle data filtering
  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    setActiveFilters(newFilters);
    
    if (onDataFilter) {
      const filteredData = applyFilters(data, newFilters);
      onDataFilter(filteredData);
    }
  };

  // Apply filters to data
  const applyFilters = (sourceData, filters) => {
    let filtered = [...sourceData];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => 
          String(item[key]).toLowerCase().includes(String(value).toLowerCase())
        );
      }
    });
    
    return filtered;
  };

  // Handle zoom
  const handleZoom = (direction) => {
    const step = interactiveFeatures.zoom.step;
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel + step, interactiveFeatures.zoom.maxZoom)
      : Math.max(zoomLevel - step, interactiveFeatures.zoom.minZoom);
    
    setZoomLevel(newZoom);
    
    if (onConfigChange) {
      onConfigChange('zoom', newZoom);
    }
  };

  // Handle rotation (for 3D charts)
  const handleRotation = (direction) => {
    const step = interactiveFeatures.rotation.step;
    const newAngle = direction === 'clockwise'
      ? (rotationAngle + step) % 360
      : (rotationAngle - step + 360) % 360;
    
    setRotationAngle(newAngle);
    
    if (onConfigChange) {
      onConfigChange('rotation', newAngle);
    }
  };

  // Handle data range selection
  const handleDataRangeChange = (start, end) => {
    setSelectedDataRange([start, end]);
    
    if (onDataFilter) {
      const rangeData = data.slice(start, end + 1);
      onDataFilter(rangeData);
    }
  };

  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    
    if (onConfigChange) {
      onConfigChange('animation', !isAnimating);
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (column) => {
    return [...new Set(data.map(item => item[column]))];
  };

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Main Controls Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-600 dark:text-gray-300" />
          <select
            className={`px-3 py-1 text-sm rounded border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
            onChange={(e) => handleFilterChange(chartConfig.xAxis, e.target.value)}
            value={activeFilters[chartConfig.xAxis] || 'all'}
          >
            <option value="all">All {chartConfig.xAxis}</option>
            {getUniqueValues(chartConfig.xAxis).map((value, index) => (
              <option key={index} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {/* Zoom Controls */}
        {interactiveFeatures.zoom.enabled && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom('out')}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Zoom Out"
            >
              <FiZoomOut size={16} />
            </button>
            <span className={`text-sm px-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {zoomLevel}%
            </span>
            <button
              onClick={() => handleZoom('in')}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Zoom In"
            >
              <FiZoomIn size={16} />
            </button>
          </div>
        )}

        {/* Rotation Controls (for 3D charts) */}
        {interactiveFeatures.rotation.enabled && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleRotation('counterclockwise')}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Rotate Left"
            >
              <FiRotateCw size={16} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <span className={`text-sm px-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {rotationAngle}°
            </span>
            <button
              onClick={() => handleRotation('clockwise')}
              className={`p-2 rounded transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Rotate Right"
            >
              <FiRotateCw size={16} />
            </button>
          </div>
        )}

        {/* Animation Toggle */}
        <button
          onClick={toggleAnimation}
          className={`p-2 rounded transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title={isAnimating ? 'Pause Animation' : 'Play Animation'}
        >
          {isAnimating ? <FiPause size={16} /> : <FiPlay size={16} />}
        </button>

        {/* Advanced Controls Toggle */}
        <button
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          className={`p-2 rounded transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          } ${showAdvancedControls ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
          title="Advanced Controls"
        >
          <FiSettings size={16} />
        </button>

        {/* Export Button */}
        <button
          onClick={() => onExport && onExport('png')}
          className={`p-2 rounded transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Export Chart"
        >
          <FiDownload size={16} />
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setActiveFilters({});
            setZoomLevel(100);
            setRotationAngle(0);
            setSelectedDataRange([0, data.length - 1]);
            onReset && onReset();
          }}
          className={`p-2 rounded transition-colors ${
            darkMode 
              ? 'hover:bg-gray-700 text-gray-300' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Reset All"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {/* Advanced Controls Panel */}
      <AnimatePresence>
        {showAdvancedControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`border-t pt-4 mt-4 space-y-4 ${
              darkMode ? 'border-gray-600' : 'border-gray-200'
            }`}
          >
            {/* Data Range Slider */}
            {interactiveFeatures.dataRange.enabled && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Data Range: {selectedDataRange[0]} - {selectedDataRange[1]}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={data.length - 1}
                    value={selectedDataRange[0]}
                    onChange={(e) => handleDataRangeChange(
                      parseInt(e.target.value), 
                      selectedDataRange[1]
                    )}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min={0}
                    max={data.length - 1}
                    value={selectedDataRange[1]}
                    onChange={(e) => handleDataRangeChange(
                      selectedDataRange[0], 
                      parseInt(e.target.value)
                    )}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {/* Additional Y-Axis Filtering */}
            {chartConfig.yAxis && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Filter by {chartConfig.yAxis}
                </label>
                <select
                  className={`w-full px-3 py-2 text-sm rounded border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  onChange={(e) => handleFilterChange(chartConfig.yAxis, e.target.value)}
                  value={activeFilters[chartConfig.yAxis] || 'all'}
                >
                  <option value="all">All Values</option>
                  {getUniqueValues(chartConfig.yAxis).map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Chart Style Quick Switches */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quick Style Options
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onConfigChange && onConfigChange('showGrid', !chartConfig.showGrid)}
                  className={`px-3 py-1 text-xs rounded ${
                    chartConfig.showGrid
                      ? 'bg-blue-500 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => onConfigChange && onConfigChange('showLegend', !chartConfig.showLegend)}
                  className={`px-3 py-1 text-xs rounded ${
                    chartConfig.showLegend
                      ? 'bg-blue-500 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Legend
                </button>
                <button
                  onClick={() => onConfigChange && onConfigChange('showTooltips', !chartConfig.showTooltips)}
                  className={`px-3 py-1 text-xs rounded ${
                    chartConfig.showTooltips
                      ? 'bg-blue-500 text-white'
                      : darkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Tooltips
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InteractiveChartControls; 