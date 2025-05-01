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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Dashboards</h2>
       
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard._id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1">{dashboard.title}</h3>
              <p className="text-gray-600 text-sm mb-3">
                {dashboard.description}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  Last updated:{" "}
                  {new Date(dashboard.lastUpdated).toLocaleDateString()}
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {dashboard.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
            <div className=" px-5 py-3 bg-gray-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditingDashboard({ ...dashboard }); // Clone to avoid mutation
                  setShowEditModal(true);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(dashboard._id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showEditModal && editingDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Dashboard</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                value={editingDashboard.title || ""}
                onChange={(e) => handleEditChange("title", e.target.value)}
                className="w-full p-2 mb-3 border rounded"
                placeholder="Dashboard Title"
                required
              />

              <textarea
                value={editingDashboard.description || ""}
                onChange={(e) =>
                  handleEditChange("description", e.target.value)
                }
                className="w-full p-2 mb-3 border rounded"
                placeholder="Description"
              />

           
              {/* Charts Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Charts</h4>
                {Array.isArray(editingDashboard.charts) &&
                editingDashboard.charts.length > 0 ? (
                  <div className="space-y-4">
                    {editingDashboard.charts.map((chart, index) => {
                      const data = {
                        labels: chart.data.labels,
                        datasets: chart.data.datasets.map((ds) => ({
                          ...ds,
                          backgroundColor: [
                            "rgba(255, 99, 132, 0.6)",
                            "rgba(54, 162, 235, 0.6)",
                            "rgba(255, 206, 86, 0.6)",
                            "rgba(75, 192, 192, 0.6)",
                            "rgba(153, 102, 255, 0.6)",
                          ],
                          borderColor: "rgba(54, 162, 235, 1)",
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
                        <div
                          key={index}
                          className="border rounded p-4 bg-white shadow-sm"
                        >
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
                                  backgroundColor: "rgba(255, 99, 132, 0.6)",
                                  borderColor: "rgba(255, 99, 132, 1)",
                                  showLine: true,
                                })),
                              }}
                              options={options}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No charts available.</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDashboard(null);
                  }}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardList;
