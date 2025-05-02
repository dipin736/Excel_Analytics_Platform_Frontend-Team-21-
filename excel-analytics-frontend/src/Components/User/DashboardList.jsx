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
  Title,
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
const DashboardList = ({ dashboards, setDashboards }) => {
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

  return (
    <div className="space-y-6 p-4">
  {/* Header */}
  <motion.div 
    className="flex justify-between items-center"
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-2xl font-bold text-gray-800">My Dashboards</h2>
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
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-md border border-gray-200/50 overflow-hidden transition-all"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="p-5">
          <h3 className="font-bold text-lg mb-2 text-gray-800">{dashboard.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {dashboard.description || "No description"}
          </p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              Updated: {new Date(dashboard.lastUpdated).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              dashboard.isPublic 
                ? "bg-green-100 text-green-800" 
                : "bg-purple-100 text-purple-800"
            }`}>
              {dashboard.isPublic ? "Public" : "Private"}
            </span>
          </div>
        </div>
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-200/50 flex justify-end space-x-3">
          <motion.button
            onClick={() => {
              setEditingDashboard({ ...dashboard });
              setShowEditModal(true);
            }}
            className="flex items-center gap-1 text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiEdit2 size={14} />
            Edit
          </motion.button>
          <motion.button
            onClick={() => handleDelete(dashboard._id)}
            className="flex items-center gap-1 text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
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
        className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200/50 pb-4">
            <h3 className="text-xl font-bold text-gray-800">Edit Dashboard</h3>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingDashboard(null);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editingDashboard.title || ""}
                onChange={(e) => handleEditChange("title", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="Dashboard Title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editingDashboard.description || ""}
                onChange={(e) => handleEditChange("description", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[100px]"
                placeholder="Description"
              />
            </div>

            {/* Charts Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Charts Preview</h4>
              {Array.isArray(editingDashboard.charts) && editingDashboard.charts.length > 0 ? (
                <div className="space-y-6">
                  {editingDashboard.charts.map((chart, index) => {
                    const data = {
                      labels: chart.data.labels,
                      datasets: chart.data.datasets.map((ds) => ({
                        ...ds,
                        backgroundColor: [
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
                        },
                        title: {
                          display: true,
                          text: chart.title,
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
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: chart.configuration?.yAxisLabel || "",
                          },
                        },
                      },
                    };

                    const chartType = chart.chartType?.toLowerCase();

                    return (
                      <motion.div
                        key={index}
                        className="border border-gray-200/50 rounded-xl p-4 bg-white/80 shadow-sm"
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
                                  backgroundColor: "rgba(99, 102, 241, 0.6)",
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
                <div className="p-6 bg-gray-50/50 rounded-lg border border-gray-200/50 text-center">
                  <FiPieChart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No charts available</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
              <motion.button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDashboard(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors"
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
