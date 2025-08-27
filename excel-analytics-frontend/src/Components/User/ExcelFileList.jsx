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
  FiTrash2,
  FiTarget,
} from "react-icons/fi";
import { motion } from "framer-motion";

import { BaseUrluser } from "../../endpoint/baseurl";
import FileAnalyzer from "./FileAnalyzer";
import ThreeDVisualizer from "./ThreeDVisualizer";
import { toast } from "react-toastify";

const ExcelFileList = ({ files, setActiveTab, darkMode }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileFor3D, setSelectedFileFor3D] = useState(null);

  const handleDelete = (dashboardId) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p className="font-medium">Delete this file?</p>
          <div className="mt-2 flex gap-2 justify-end">
            <button
              onClick={async () => {
                closeToast();
                try {
                  const response = await fetch(
                    `${BaseUrluser}/excel/${dashboardId}`,
                    {
                      method: "DELETE",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                          "token"
                        )}`,
                      },
                    }
                  );

                  const result = await response.json();
                  if (result.success) {
                    toast.success("Dashboard deleted successfully.");
                    setTimeout(() => {
                      window.location.reload();
                    }, 1500);
                  } else {
                    toast.error("Delete failed: " + result.message);
                  }
                } catch (error) {
                  console.error("Error deleting dashboard:", error);
                  toast.error("An error occurred during deletion.");
                }
              }}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Yes
            </button>
            <button
              onClick={closeToast}
              className="bg-gray-300 text-black px-3 py-1 rounded"
            >
              No
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  return (
    <div className={`space-y-6 p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header with Upload Button */}
      <motion.div
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2
          className={`text-2xl font-bold ${
            darkMode ? "text-gray-400" : "text-gray-800"
          } mb-6`}
        >
          Excel Files
        </h2>
        <motion.button
          onClick={() => setActiveTab("upload")}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiUpload className="text-lg" />
          <span>Upload File</span>
        </motion.button>
      </motion.div>

      {/* Files Table */}
      <motion.div
        className={`backdrop-blur-sm rounded-2xl shadow-sm border overflow-hidden ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200/50"
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <table className="min-w-full divide-y divide-gray-200/50">
          <thead className={`${darkMode ? "bg-gray-700/80" : "bg-gray-50/80"}`}>
            <tr>
              {["File Name", "Size", "Upload Date", "Actions"].map(
                (header, idx) => (
                  <th
                    key={idx}
                    className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {files.map((file, index) => (
              <motion.tr
                key={file._id}
                className={`hover:bg-gray-50/50 transition-colors ${
                  darkMode ? "hover:bg-gray-700/50" : ""
                }`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
              >
                {/* File Name */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiFileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div
                        className={`text-sm font-medium truncate max-w-xs ${
                          darkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {file.originalName}
                      </div>
                      <div
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {file.sheets?.length || 0} sheets
                      </div>
                    </div>
                  </div>
                </td>

                {/* File Size */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </td>

                {/* Upload Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {new Date(file.uploadDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={() => setSelectedFile(file._id)}
                      className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiBarChart2 size={14} />
                      Analyze
                    </motion.button>

                    <motion.button
                      onClick={() => setSelectedFileFor3D(file._id)}
                      className="flex items-center gap-1 text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiTarget size={14} />
                      3D Analysis
                    </motion.button>

                    <motion.button
                      onClick={() => handleDelete(file._id)}
                      className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* File Analyzer Modal */}
      {selectedFile && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border ${
              darkMode
                ? "bg-gray-800 text-gray-200 border-white/10"
                : "bg-white text-gray-900 border-white/20"
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <FileAnalyzer
              fileId={selectedFile}
              files={files}
              darkMode={darkMode}
              onClose={() => setSelectedFile(null)}
            />
          </motion.div>
        </motion.div>
      )}

      {/* 3D Visualizer Modal */}
      {selectedFileFor3D && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border ${
              darkMode
                ? "bg-gray-800 text-gray-200 border-white/10"
                : "bg-white text-gray-900 border-white/20"
            }`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <ThreeDVisualizer
              fileId={selectedFileFor3D}
              files={files}
              darkMode={darkMode}
              onClose={() => setSelectedFileFor3D(null)}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ExcelFileList;
