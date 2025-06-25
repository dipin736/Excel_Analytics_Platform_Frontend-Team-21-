import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiInfo, FiDownload } from 'react-icons/fi';

const CorrelationMatrix = ({ data, darkMode }) => {
  const [selectedCorrelation, setSelectedCorrelation] = useState(null);
  
  const getCorrelationColor = (correlation) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return darkMode ? 'bg-red-500' : 'bg-red-500';
    if (abs >= 0.5) return darkMode ? 'bg-orange-500' : 'bg-orange-500';
    if (abs >= 0.3) return darkMode ? 'bg-yellow-500' : 'bg-yellow-500';
    if (abs >= 0.1) return darkMode ? 'bg-blue-500' : 'bg-blue-500';
    return darkMode ? 'bg-gray-600' : 'bg-gray-300';
  };

  const getCorrelationIntensity = (correlation) => {
    const abs = Math.abs(correlation);
    return abs; // Returns 0-1 for opacity
  };

  const renderCorrelationCell = (corrData) => {
    const { correlation, column1, column2, strength, significance } = corrData;
    
    return (
      <motion.div
        key={`${column1}_${column2}`}
        className={`p-4 rounded-lg border cursor-pointer transition-all ${
          selectedCorrelation === `${column1}_${column2}`
            ? darkMode ? 'border-blue-500 bg-gray-600' : 'border-blue-500 bg-blue-50'
            : darkMode ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
        onClick={() => setSelectedCorrelation(`${column1}_${column2}`)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              {column1} ↔ {column2}
            </h4>
          </div>
          <div className="flex items-center ml-2">
            {correlation > 0 ? (
              <FiTrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <FiTrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Correlation
            </span>
            <span className={`font-bold text-lg ${
              Math.abs(correlation) >= 0.7 ? 'text-red-500' :
              Math.abs(correlation) >= 0.5 ? 'text-orange-500' :
              Math.abs(correlation) >= 0.3 ? 'text-yellow-500' :
              'text-gray-500'
            }`}>
              {correlation.toFixed(3)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Strength
            </span>
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {strength}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Significance
            </span>
            <span className={`text-xs font-medium ${
              significance === 'Significant' ? 'text-green-500' : 'text-gray-500'
            }`}>
              {significance}
            </span>
          </div>
        </div>
        
        {/* Correlation bar */}
        <div className={`mt-3 h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
          <div
            className={`h-full rounded-full transition-all ${getCorrelationColor(correlation)}`}
            style={{ 
              width: `${Math.abs(correlation) * 100}%`,
              opacity: getCorrelationIntensity(correlation)
            }}
          />
        </div>
      </motion.div>
    );
  };

  const renderDetailedView = () => {
    if (!selectedCorrelation || !data[selectedCorrelation]) return null;
    
    const corrData = data[selectedCorrelation];
    const { correlation, column1, column2, strength, significance } = corrData;
    
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
            Correlation Analysis: {column1} ↔ {column2}
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
          {/* Correlation Details */}
          <div>
            <h4 className={`text-lg font-medium mb-4 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Correlation Summary
            </h4>
            
            <div className="space-y-4">
              {/* Correlation Value */}
              <div className={`p-4 rounded-lg text-center ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <div className={`text-4xl font-bold mb-2 ${
                  Math.abs(correlation) >= 0.7 ? 'text-red-500' :
                  Math.abs(correlation) >= 0.5 ? 'text-orange-500' :
                  Math.abs(correlation) >= 0.3 ? 'text-yellow-500' :
                  'text-gray-500'
                }`}>
                  {correlation.toFixed(3)}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pearson Correlation Coefficient
                </div>
              </div>
              
              {/* Correlation Properties */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Direction:
                    </span>
                    <span className={`flex items-center ${
                      correlation > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {correlation > 0 ? (
                        <>
                          <FiTrendingUp className="mr-1 h-4 w-4" />
                          Positive
                        </>
                      ) : (
                        <>
                          <FiTrendingDown className="mr-1 h-4 w-4" />
                          Negative
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Strength:
                    </span>
                    <span className={`font-medium ${
                      strength === 'Strong' ? 'text-red-500' :
                      strength === 'Moderate' ? 'text-orange-500' :
                      strength === 'Weak' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`}>
                      {strength}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Significance:
                    </span>
                    <span className={`font-medium ${
                      significance === 'Significant' ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {significance}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Interpretation */}
          <div>
            <h4 className={`text-lg font-medium mb-4 ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Interpretation
            </h4>
            
            <div className="space-y-4">
              {/* What it means */}
              <div className={`p-4 rounded-lg ${
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
                      What this means:
                    </div>
                    <div className={`text-sm mt-1 ${
                      darkMode ? 'text-blue-200' : 'text-blue-700'
                    }`}>
                      {getCorrelationInterpretation(correlation, column1, column2)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Guidelines */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-600' : 'bg-gray-50'
              }`}>
                <h5 className={`font-medium mb-3 ${
                  darkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Correlation Guidelines:
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>±0.70 to ±1.00</span>
                    <span className="text-red-500 font-medium">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span>±0.30 to ±0.69</span>
                    <span className="text-orange-500 font-medium">Moderate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>±0.10 to ±0.29</span>
                    <span className="text-yellow-500 font-medium">Weak</span>
                  </div>
                  <div className="flex justify-between">
                    <span>±0.00 to ±0.09</span>
                    <span className="text-gray-500 font-medium">Very Weak</span>
                  </div>
                </div>
              </div>
              
              {/* Caution */}
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
              } border`}>
                <div className={`font-medium text-sm ${
                  darkMode ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  ⚠️ Remember: Correlation ≠ Causation
                </div>
                <div className={`text-xs mt-1 ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-700'
                }`}>
                  A correlation between variables doesn't mean one causes the other.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const getCorrelationInterpretation = (correlation, col1, col2) => {
    const abs = Math.abs(correlation);
    const direction = correlation > 0 ? 'positively' : 'negatively';
    
    if (abs >= 0.7) {
      return `There is a strong ${direction} correlated relationship between ${col1} and ${col2}. As one variable increases, the other tends to ${correlation > 0 ? 'increase' : 'decrease'} significantly.`;
    } else if (abs >= 0.5) {
      return `There is a moderate ${direction} correlated relationship between ${col1} and ${col2}. The variables show a noticeable pattern of moving together.`;
    } else if (abs >= 0.3) {
      return `There is a weak ${direction} correlated relationship between ${col1} and ${col2}. The variables show some tendency to move together but the relationship is not very strong.`;
    } else {
      return `There is very little to no linear relationship between ${col1} and ${col2}. The variables appear to be largely independent of each other.`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Correlation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, corrData]) => 
          renderCorrelationCell(corrData)
        )}
      </div>
      
      {/* Detailed View */}
      {renderDetailedView()}
    </div>
  );
};

export default CorrelationMatrix; 