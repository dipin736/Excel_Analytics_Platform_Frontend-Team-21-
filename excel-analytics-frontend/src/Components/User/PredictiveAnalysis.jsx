import React from 'react';

const PredictiveAnalysis = ({ data, darkMode }) => {
  return (
    <div className="p-4">
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Predictive Analysis
      </h3>
      <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Predictive analysis functionality coming soon...
      </p>
    </div>
  );
};

export default PredictiveAnalysis; 