import React from 'react';

const TrendAnalysis = ({ data, darkMode }) => {
  return (
    <div className="p-4">
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Trend Analysis
      </h3>
      <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Trend analysis functionality coming soon...
      </p>
    </div>
  );
};

export default TrendAnalysis; 