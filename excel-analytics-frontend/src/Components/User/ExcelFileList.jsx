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
import FileAnalyzer from "./FileAnalyzer";
import { toast } from "react-toastify";

const ExcelFileList = ({ files, setActiveTab }) => {
    const [selectedFile, setSelectedFile] = useState(null);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Excel Files</h2>
        <button
          onClick={() => setActiveTab("upload")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Upload File
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upload Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiFileText className="flex-shrink-0 h-5 w-5 text-blue-500" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {file.originalName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Math.round(file.fileSize / 1024)} KB
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(file.uploadDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedFile(file._id)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Analyze
                  </button>

                  {selectedFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
                        <FileAnalyzer
                          fileId={selectedFile}
                          files={files}
                          onClose={() => setSelectedFile(null)}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(file._id)}
                  className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  


  )
}

export default ExcelFileList