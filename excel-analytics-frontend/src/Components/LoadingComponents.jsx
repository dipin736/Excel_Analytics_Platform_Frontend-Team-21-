import React from 'react';
import { FiLoader, FiBarChart2, FiFileText, FiPieChart, FiUpload } from 'react-icons/fi';

// Main loading spinner
export const LoadingSpinner = ({ size = 'md', text = 'Loading...', darkMode = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <FiLoader className={`${sizeClasses[size]} animate-spin text-indigo-600 dark:text-indigo-400 mb-2`} />
      {text && (
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Chart loading skeleton
export const ChartLoadingSkeleton = ({ darkMode = false }) => (
  <div className={`w-full h-64 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse flex items-center justify-center`}>
    <div className="text-center">
      <FiBarChart2 className="w-8 h-8 text-gray-400 mb-2" />
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Loading chart...
      </p>
    </div>
  </div>
);

// Data table loading skeleton
export const TableLoadingSkeleton = ({ rows = 5, columns = 4, darkMode = false }) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="flex space-x-2">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={`h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse flex-1`}
        />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className={`h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1`}
          />
        ))}
      </div>
    ))}
  </div>
);

// File upload loading
export const FileUploadLoading = ({ fileName, progress = 0, darkMode = false }) => (
  <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center space-x-3 mb-3">
      <FiUpload className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
      <div className="flex-1">
        <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {fileName}
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Uploading... {progress}%
        </p>
      </div>
    </div>
    
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
      <div
        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// Dashboard card loading skeleton
export const DashboardCardSkeleton = ({ darkMode = false }) => (
  <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} animate-pulse`}>
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
    </div>
  </div>
);

// Chart grid loading skeleton
export const ChartGridSkeleton = ({ count = 6, darkMode = false }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} animate-pulse`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
        </div>
        <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    ))}
  </div>
);

// Full page loading
export const FullPageLoading = ({ message = 'Loading your dashboard...', darkMode = false }) => (
  <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
    <div className="text-center">
      <div className="relative">
        <FiLoader className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-full" />
        </div>
      </div>
      <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        {message}
      </h2>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Please wait while we prepare your data...
      </p>
    </div>
  </div>
);

// Button loading state
export const LoadingButton = ({ 
  loading = false, 
  children, 
  onClick, 
  disabled = false,
  className = '',
  darkMode = false 
}) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      loading || disabled
        ? 'bg-gray-400 cursor-not-allowed text-white'
        : darkMode
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
          : 'bg-indigo-500 hover:bg-indigo-600 text-white'
    } ${className}`}
  >
    {loading && <FiLoader className="w-4 h-4 animate-spin" />}
    {children}
  </button>
);

// Inline loading indicator
export const InlineLoading = ({ text = 'Loading...', darkMode = false }) => (
  <div className="flex items-center space-x-2">
    <FiLoader className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      {text}
    </span>
  </div>
); 