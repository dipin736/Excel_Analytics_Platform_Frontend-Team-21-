import { BaseUrluser } from "../endpoint/baseurl";

/**
 * Chart API Service
 * Handles all chart-related API calls for Excel Analytics Platform
 */

// Get authentication headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {

  }
  return {
    'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
  };
};

/**
 * GET /api/excel/:id/chart-metadata
 * Returns field information for axis selection
 */
export const getChartMetadata = async (excelId) => {
  try {
    const response = await fetch(`${BaseUrluser}/excel/${excelId}/chart-metadata`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chart metadata: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error fetching chart metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * GET /api/excel/:id/chart-data
 * Returns data formatted for specific chart types
 */
export const getChartData = async (excelId, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      chartType: params.chartType || 'bar',
      xAxis: params.xAxis || '',
      yAxis: params.yAxis || '',
      zAxis: params.zAxis || '',
      sheetIndex: params.sheetIndex || '0',
      limit: params.limit || '1000'
    });

    const response = await fetch(`${BaseUrluser}/excel/${excelId}/chart-data?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chart data: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * POST /api/dashboard/
 * Create a new dashboard
 */
export const createDashboard = async (dashboardData) => {
  try {
    const response = await fetch(`${BaseUrluser}/dashboard/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dashboardData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create dashboard: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * POST /api/dashboard/:id/charts
 * Save chart configurations
 */
export const saveChartConfiguration = async (dashboardId, chartConfig) => {
  try {
    const response = await fetch(`${BaseUrluser}/dashboard/${dashboardId}/charts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(chartConfig)
    });

    if (!response.ok) {
      throw new Error(`Failed to save chart configuration: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error saving chart configuration:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * PUT /api/dashboard/:id/charts/:chartId
 * Update chart configurations
 */
export const updateChartConfiguration = async (dashboardId, chartId, chartConfig) => {
  try {
    const response = await fetch(`${BaseUrluser}/dashboard/${dashboardId}/charts/${chartId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(chartConfig)
    });

    if (!response.ok) {
      throw new Error(`Failed to update chart configuration: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error updating chart configuration:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * DELETE /api/dashboard/:id/charts/:chartId
 * Delete charts
 */
export const deleteChart = async (dashboardId, chartId) => {
  try {
    const response = await fetch(`${BaseUrluser}/dashboard/${dashboardId}/charts/${chartId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chart: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error deleting chart:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Utility function to validate chart configuration
 */
export const validateChartConfig = (config) => {
  const errors = [];

  if (!config.title || config.title.trim() === '') {
    errors.push('Chart title is required');
  }

  if (!config.chartType) {
    errors.push('Chart type is required');
  }

  if (!config.xAxis) {
    errors.push('X-axis selection is required');
  }

  if (!config.yAxis && config.chartType !== 'pie') {
    errors.push('Y-axis selection is required');
  }

  if (config.chartType === '3d' && !config.zAxis) {
    errors.push('Z-axis selection is required for 3D charts');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Utility function to format chart data for Chart.js
 */
export const formatChartDataForChartJS = (apiData, chartType) => {
  if (!apiData || !apiData.labels || !apiData.datasets) {
    return null;
  }

  const baseConfig = {
    labels: apiData.labels,
    datasets: apiData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: getChartColors(chartType, index),
      borderColor: getBorderColors(chartType, index),
      borderWidth: chartType === 'line' ? 2 : 1,
      tension: chartType === 'line' ? 0.4 : 0,
      fill: chartType === 'area' ? true : false
    }))
  };

  return baseConfig;
};

/**
 * Get appropriate colors for different chart types
 */
const getChartColors = (chartType, index) => {
  const colors = [
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(168, 85, 247, 0.8)',   // Purple
    'rgba(236, 72, 153, 0.8)',   // Pink
    'rgba(14, 165, 233, 0.8)',   // Sky
    'rgba(20, 184, 166, 0.8)',   // Teal
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(34, 197, 94, 0.8)',    // Green
    'rgba(239, 68, 68, 0.8)'     // Red
  ];

  if (chartType === 'pie' || chartType === 'doughnut') {
    return colors;
  }

  return colors[index % colors.length];
};

/**
 * Get border colors for charts
 */
const getBorderColors = (chartType, index) => {
  const colors = [
    'rgba(99, 102, 241, 1)',     // Indigo
    'rgba(168, 85, 247, 1)',     // Purple
    'rgba(236, 72, 153, 1)',     // Pink
    'rgba(14, 165, 233, 1)',     // Sky
    'rgba(20, 184, 166, 1)',     // Teal
    'rgba(245, 158, 11, 1)',     // Amber
    'rgba(34, 197, 94, 1)',      // Green
    'rgba(239, 68, 68, 1)'       // Red
  ];

  return colors[index % colors.length];
}; 