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
} from "react-icons/fi";
import {  BaseUrluser } from "../../endpoint/baseurl";
import { toast } from "react-toastify"

const ExcelUploader = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
  
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
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Upload Excel File</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="sr-only"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
          >
            <span>{file ? file.name : "Select a file"}</span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            XLS or XLSX files up to 10MB
          </p>
        </div>
        {uploadError && (
          <p className="text-red-500 text-sm mt-2">{uploadError}</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={isUploading || !file}
            className={`bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors ${
              isUploading || !file ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isUploading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    );
  };
  

export default ExcelUploader