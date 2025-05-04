import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,
 FiAlertCircle, FiLoader,  FiSun, FiMoon 
} from "react-icons/fi";
import { motion } from 'framer-motion';
import {  BaseUrluser } from "../../endpoint/baseurl";
import { toast } from "react-toastify"

const ExcelUploader = ({darkMode}) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const handleFileChange = (e) => {
      setFile(e.target.files[0]);
    };

    const uploadExcelFile = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
      
        const response = await fetch(`${BaseUrluser}/excel/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
        return await response.json();
      toast.success("File upload successfully!")
        
      };
  
    const handleUpload = async () => {
      if (!file) return;
  
      setIsUploading(true);
      setUploadError(null);
  
      try {
        const result = await uploadExcelFile(file);
        if (result.success) {
          // Refresh file list or show success message
          window.location.reload(); // Simple refresh for demo
        } else {
          setUploadError(result.message || "Upload failed");
        }
      } catch (error) {
        setUploadError("Network error occurred");
      } finally {
        setIsUploading(false);
      }
    };
 return (
      <motion.div 
      className={` backdrop-blur-sm rounded-2xl shadow-lg border ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-6 max-w-2xl mx-auto`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
           <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-400' : 'text-gray-800'} mb-6`}>Upload Excel File</h2>
      
      <motion.div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging 
            ? darkMode 
              ? 'border-indigo-500 bg-indigo-900/20' 
              : 'border-indigo-400 bg-indigo-50/50'
            : darkMode 
              ? 'border-gray-600 hover:border-indigo-400' 
              : 'border-gray-300 hover:border-indigo-300'
        }`}
        whileHover={{ scale: 1.01 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { 
          e.preventDefault(); 
          setIsDragging(false); 
          if (e.dataTransfer.files.length) handleFileChange({ target: { files: e.dataTransfer.files } }); 
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`p-3 rounded-full ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
            <FiUpload className={`h-6 w-6 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          
          <input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            id="file-upload"
          />
          
          <div className="text-center">
            <label
              htmlFor="file-upload"
              className={`relative cursor-pointer font-medium ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
            >
              <span className="underline">Click to browse</span> or drag and drop
            </label>
            
            {file ? (
              <motion.div 
                className={`mt-3 flex items-center justify-center space-x-2 rounded-lg px-3 py-2 max-w-xs mx-auto ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiFileText className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                <span className="text-sm font-medium truncate">{file.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className={darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
                >
                  <FiX size={16} />
                </button>
              </motion.div>
            ) : (
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                XLS, XLSX, or CSV files up to 10MB
              </p>
            )}
          </div>
        </div>
      </motion.div>
    
      {uploadError && (
        <motion.div 
          className={`mt-3 flex items-center space-x-2 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiAlertCircle />
          <span>{uploadError}</span>
        </motion.div>
      )}
    
      <div className="mt-6 flex justify-end space-x-3">
        <motion.button
          onClick={() => onCancel()}
          className={`px-4 py-2 border rounded-xl transition-colors ${darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Cancel
        </motion.button>
        
        <motion.button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className={`px-4 py-2 rounded-xl text-white transition-colors ${
            isUploading || !file 
              ? darkMode 
                ? 'bg-indigo-700 cursor-not-allowed' 
                : 'bg-indigo-700 cursor-not-allowed'
              : darkMode 
                ? 'bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
          }`}
          whileHover={!isUploading && !file ? { scale: 1.03 } : {}}
          whileTap={!isUploading && !file ? { scale: 0.97 } : {}}
        >
          {isUploading ? (
            <span className="flex items-center justify-center space-x-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <FiLoader />
              </motion.span>
              <span>Uploading...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <FiUpload />
              <span>Upload File</span>
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
    );
  };
  

export default ExcelUploader