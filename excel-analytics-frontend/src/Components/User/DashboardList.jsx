import React, { useState } from "react";
import { toast } from "react-toastify";
import { BaseUrluser } from "../../endpoint/baseurl";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";
import { Bar, Line, Pie, Scatter } from "react-chartjs-2";
import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2, FiX, FiPieChart } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
const DashboardList = ({ dashboards, setDashboards,darkMode }) => {
  const [editingDashboard, setEditingDashboard] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = (dashboardId) => {
    toast.info(
      ({ closeToast }) => (
        <div>
          <p className="font-medium">Delete this dashboard?</p>
          <div className="mt-2 flex gap-2 justify-end">
            <button
              onClick={async () => {
                closeToast();
                try {
                  const response = await fetch(
                    `${BaseUrluser}/dashboard/${dashboardId}`,
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
                    setDashboards((prev) =>
                      prev.filter((d) => d._id !== dashboardId)
                    );
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

  const handleEditChange = (field, value) => {
    setEditingDashboard((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${BaseUrluser}/dashboard/${editingDashboard._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(editingDashboard),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Dashboard updated successfully.");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        setDashboards((prev) =>
          prev.map((d) => (d._id === editingDashboard._id ? result.data : d))
        );
        setShowEditModal(false);
        setEditingDashboard(null);
      } else {
        toast.error("Update failed: " + result.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating.");
    }
  };


  // Theme classes
  const themeClasses = {
    background: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    textPrimary: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
    card: darkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/80 border-gray-200/50',
    cardHover: darkMode ? 'hover:bg-gray-700/90' : 'hover:bg-white',
    cardFooter: darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50/50 border-gray-200/50',
    button: darkMode ? 'bg-gray-700 text-indigo-300 hover:bg-gray-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    deleteButton: darkMode ? 'bg-gray-700 text-red-300 hover:bg-gray-600' : 'bg-red-50 text-red-600 hover:bg-red-100',
    modal: darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/90 border-white/20',
    modalBorder: darkMode ? 'border-gray-700' : 'border-gray-200/50',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800',
    emptyState: darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-400' : 'bg-gray-50/50 border-gray-200/50 text-gray-500',
    saveButton: darkMode ? 'from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600' : 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
  };


  return (
    <div className={`space-y-6 p-4 ${themeClasses.background}`}>
    {/* Header */}
    <motion.div 
      className="flex justify-between items-center"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>My Dashboards</h2>
   
    </motion.div>

    {/* Dashboard Cards Grid */}
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {dashboards.map((dashboard) => (
        <motion.div
          key={dashboard._id}
          className={`${themeClasses.card} rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all ${themeClasses.cardHover}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, boxShadow: darkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)" : "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="p-5">
            <h3 className={`font-bold text-lg mb-2 ${themeClasses.textPrimary}`}>{dashboard.title}</h3>
            <p className={`${themeClasses.textSecondary} text-sm mb-4 line-clamp-2`}>
              {dashboard.description || "No description"}
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className={themeClasses.textSecondary}>
                Updated: {new Date(dashboard.lastUpdated).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                dashboard.isPublic 
                  ? darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800" 
                  : darkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-800"
              }`}>
                {dashboard.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
          <div className={`px-5 py-3 ${themeClasses.cardFooter} flex justify-end space-x-3`}>
            <motion.button
              onClick={() => {
                setEditingDashboard({ ...dashboard });
                setShowEditModal(true);
              }}
              className={`flex items-center gap-1 text-sm ${themeClasses.button} px-3 py-1.5 rounded-lg transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiEdit2 size={14} />
              Edit
            </motion.button>
            <motion.button
              onClick={() => handleDelete(dashboard._id)}
              className={`flex items-center gap-1 text-sm ${themeClasses.deleteButton} px-3 py-1.5 rounded-lg transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiTrash2 size={14} />
              Delete
            </motion.button>
          </div>
        </motion.div>
      ))}
    </motion.div>

    {/* Edit Modal */}
    {showEditModal && editingDashboard && (
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={`${themeClasses.modal} rounded-2xl shadow-2xl border ${themeClasses.modalBorder} w-full max-w-4xl max-h-[90vh] overflow-auto`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className="p-6">
            <div className={`flex justify-between items-center mb-6 border-b ${themeClasses.modalBorder} pb-4`}>
              <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Edit Dashboard</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDashboard(null);
                }}
                className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <FiX size={20} className={themeClasses.textSecondary} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Title</label>
                <input
                  type="text"
                  value={editingDashboard.title || ""}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${themeClasses.input}`}
                  placeholder="Dashboard Title"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Description</label>
                <textarea
                  value={editingDashboard.description || ""}
                  onChange={(e) => handleEditChange("description", e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[100px] ${themeClasses.input}`}
                  placeholder="Description"
                />
              </div>

              {/* Charts Preview */}
              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-3`}>Charts Preview</h4>
                {Array.isArray(editingDashboard.charts) && editingDashboard.charts.length > 0 ? (
                  <div className="space-y-6">
                    {editingDashboard.charts.map((chart, index) => {
                      const data = {
                        labels: chart.data.labels,
                        datasets: chart.data.datasets.map((ds) => ({
                          ...ds,
                          backgroundColor: darkMode ? [
                            "rgba(99, 102, 241, 0.8)",
                            "rgba(168, 85, 247, 0.8)",
                            "rgba(236, 72, 153, 0.8)",
                            "rgba(14, 165, 233, 0.8)",
                            "rgba(20, 184, 166, 0.8)",
                          ] : [
                            "rgba(99, 102, 241, 0.6)",
                            "rgba(168, 85, 247, 0.6)",
                            "rgba(236, 72, 153, 0.6)",
                            "rgba(14, 165, 233, 0.6)",
                            "rgba(20, 184, 166, 0.6)",
                          ],
                          borderColor: "rgba(99, 102, 241, 1)",
                          borderWidth: 1,
                        })),
                      };

                      const options = {
                        responsive: true,
                        plugins: {
                          legend: {
                            position: "top",
                            labels: {
                              color: darkMode ? '#E5E7EB' : '#374151',
                            },
                          },
                          title: {
                            display: true,
                            text: chart.title,
                            color: darkMode ? '#F3F4F6' : '#111827',
                            font: {
                              size: 16
                            }
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: chart.configuration?.xAxisLabel || "",
                              color: darkMode ? '#E5E7EB' : '#374151',
                            },
                            grid: {
                              color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            },
                            ticks: {
                              color: darkMode ? '#9CA3AF' : '#6B7280',
                            },
                          },
                          y: {
                            title: {
                              display: true,
                              text: chart.configuration?.yAxisLabel || "",
                              color: darkMode ? '#E5E7EB' : '#374151',
                            },
                            grid: {
                              color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            },
                            ticks: {
                              color: darkMode ? '#9CA3AF' : '#6B7280',
                            },
                          },
                        },
                      };

                      const chartType = chart.chartType?.toLowerCase();

                      return (
                        <motion.div
                          key={index}
                          className={`border ${themeClasses.modalBorder} rounded-xl p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-white/80'} shadow-sm`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="h-64">
                            {chartType === "bar" && (
                              <Bar data={data} options={options} />
                            )}
                            {chartType === "line" && (
                              <Line data={data} options={options} />
                            )}
                            {chartType === "pie" && (
                              <Pie data={data} options={options} />
                            )}
                            {chartType === "scatter" && (
                              <Scatter
                                data={{
                                  datasets: chart.data.datasets.map((ds) => ({
                                    label: ds.label,
                                    data: chart.data.labels.map((x, i) => ({
                                      x,
                                      y: ds.data[i],
                                    })),
                                    backgroundColor: darkMode ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 0.6)",
                                    borderColor: "rgba(99, 102, 241, 1)",
                                    showLine: true,
                                  })),
                                }}
                                options={options}
                              />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={`p-6 ${themeClasses.emptyState} rounded-lg border text-center`}>
                    <FiPieChart className="mx-auto h-8 w-8 mb-2" />
                    <p>No charts available</p>
                  </div>
                )}
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${themeClasses.modalBorder}`}>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDashboard(null);
                  }}
                  className={`px-4 py-2 border ${themeClasses.modalBorder} rounded-xl ${themeClasses.textSecondary} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className={`px-4 py-2 bg-gradient-to-r ${themeClasses.saveButton} text-white rounded-xl transition-colors`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    )}
  </div>
  );
};

export default DashboardList;
