import React, { useEffect, useState } from 'react'
import { BaseUrluser } from '../../endpoint/baseurl';
import { toast } from "react-toastify";

const UsersManagement = ({ darkMode, themeClasses }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    const [activityMode, setActivityMode] = useState(false);
    const [userActivity, setUserActivity] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);
  
    // Fetch users data on component mount
    useEffect(() => {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          // Replace with your actual API endpoint
          const response = await fetch(`${BaseUrluser}/users/`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
  
          if (!response.ok) {
            throw new Error("Failed to fetch users");
          }
  
          const data = await response.json();
  
          setUsers(data.data); // Assuming the API returns the array directly
        } catch (err) {
          setError(err.message);
          console.error("Error fetching users:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchUsers();
    }, []);
  
    const handleEdit = (user) => {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        storageLimit: user.storageLimit / (1024 * 1024), // Convert to MB
      });
      setEditMode(true);
    };
  
    const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    };
  
    const handleUpdateUser = async () => {
      try {
        const response = await fetch(`${BaseUrluser}/users/${selectedUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...formData,
            storageLimit: formData.storageLimit * 1024 * 1024, // Convert back to bytes
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update user");
        }
  
        const updatedUser = await response.json();
        setUsers((prev) =>
          prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
        );
        setEditMode(false);
        setSelectedUser(null);
      } catch (err) {
        console.error("Error updating user:", err);
        alert(err.message);
      }
    };
  
    const fetchUserActivity = async (userId) => {
      try {
        setActivityLoading(true);
        const response = await fetch(`${BaseUrluser}/users/${userId}/activity`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch user activity");
        }
  
        const data = await response.json();
        setUserActivity(data.data);
        setActivityMode(true);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching user activity:", err);
      } finally {
        setActivityLoading(false);
      }
    };
    const handleDeleteUser = (userId) => {
      toast(
        ({ closeToast }) => (
          <div>
            <p>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={async () => {
                  closeToast();
                  try {
                    const response = await fetch(
                      `${BaseUrluser}/users/${userId}`,
                      {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "token"
                          )}`,
                        },
                      }
                    );
  
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.message || "Failed to delete user"
                      );
                    }
  
                    setUsers((prev) => prev.filter((u) => u._id !== userId));
  
                    if (selectedUser && selectedUser._id === userId) {
                      setSelectedUser(null);
                    }
  
                    toast.success("User deleted successfully", {
                      position: "top-right",
                      autoClose: 3000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    });
                  } catch (err) {
                    console.error("Error deleting user:", err);
                    toast.error(err.message, {
                      position: "top-right",
                      autoClose: 5000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    });
                  }
                }}
                style={{
                  backgroundColor: "#dc2626",
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "5px",
                }}
              >
                Delete
              </button>
              <button
                onClick={closeToast}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  padding: "5px 10px",
                  borderRadius: "5px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
        }
      );
    };
    const renderActionButtons = (user) => (
      <>
        <button
          onClick={() => handleEdit(user)}
          className={`mr-2 ${
            darkMode
              ? "text-blue-400 hover:text-blue-300"
              : "text-blue-600 hover:text-blue-900"
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => {
            setSelectedUser(user);
            setActivityMode(false);
          }}
          className={`mr-2 ${
            darkMode
              ? "text-gray-400 hover:text-gray-300"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          View
        </button>
        <button
          onClick={() => {
            setSelectedUser(user);
            fetchUserActivity(user._id);
          }}
          className={`mr-2 ${
            darkMode
              ? "text-green-400 hover:text-green-300"
              : "text-green-600 hover:text-green-900"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => handleDeleteUser(user._id)}
          className={` mr-2 ${
            darkMode
              ? "text-red-400 hover:text-red-300"
              : "text-red-600 hover:text-red-900"
          }`}
          title="Delete User (Admin Only)"
        >
          Delete
        </button>
      </>
    );
  
    if (loading) {
      return (
        <div
          className={`${themeClasses.card} p-6 rounded-xl shadow-sm flex justify-center items-center h-64`}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}>
          <div
            className={`p-4 rounded-lg bg-red-100 text-red-700 ${
              darkMode ? "bg-opacity-20" : ""
            }`}
          >
            Error: {error}
          </div>
        </div>
      );
    }
  
    return (
      <div className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}>
        <h2 className={`text-xl font-semibold mb-6 ${themeClasses.textPrimary}`}>
          Users Management
        </h2>
  
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={themeClasses.tableHeader}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Storage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${themeClasses.border}`}>
              {Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className={themeClasses.tableRow}>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.textPrimary}`}
                    >
                      {user.name || "N/A"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}
                    >
                      {user.email}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}
                    >
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}
                    >
                      {(user.storageUsed / (1024 * 1024)).toFixed(2)} MB /{" "}
                      {(user.storageLimit / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {renderActionButtons(user)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {loading ? "Loading users..." : "No users found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
  
        {/* Edit Modal */}
        {editMode && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg w-full max-w-md`}
            >
              <h3
                className={`text-lg font-medium mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Edit User: {selectedUser.name}
              </h3>
  
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
  
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
  
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
  
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Storage Limit (MB)
                  </label>
                  <input
                    type="number"
                    name="storageLimit"
                    value={formData.storageLimit}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300"
                    }`}
                  />
                </div>
  
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    className={`ml-2 block text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Active Account
                  </label>
                </div>
              </div>
  
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditMode(false)}
                  className={`px-4 py-2 border rounded-lg ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-white hover:bg-gray-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* View Modal */}
        {!editMode && selectedUser && !activityMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg w-full max-w-md`}
            >
              <h3
                className={`text-lg font-medium mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                User Details: {selectedUser.name}
              </h3>
  
              <div className="space-y-3">
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Name
                  </p>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>
                    {selectedUser.name}
                  </p>
                </div>
  
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Email
                  </p>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>
                    {selectedUser.email}
                  </p>
                </div>
  
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Role
                  </p>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedUser.role}
                    </span>
                  </p>
                </div>
  
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Storage
                  </p>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>
                    {(selectedUser.storageUsed / (1024 * 1024)).toFixed(2)} MB /{" "}
                    {(selectedUser.storageLimit / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
  
                <div>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Status
                  </p>
                  <p className={darkMode ? "text-white" : "text-gray-900"}>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedUser.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
  
                {selectedUser.age && (
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Age
                    </p>
                    <p className={darkMode ? "text-white" : "text-gray-900"}>
                      {selectedUser.age}
                    </p>
                  </div>
                )}
  
                {selectedUser.gender && (
                  <div>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Gender
                    </p>
                    <p className={darkMode ? "text-white" : "text-gray-900"}>
                      {selectedUser.gender}
                    </p>
                  </div>
                )}
              </div>
  
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Activity Modal */}
        {activityMode && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  className={`text-lg font-medium ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  User Activity: {selectedUser.name}
                </h3>
                <button
                  onClick={() => setActivityMode(false)}
                  className={`p-1 rounded-full ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
  
              {activityLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div
                  className={`p-4 mb-4 rounded-lg bg-red-100 text-red-700 ${
                    darkMode ? "bg-opacity-20" : ""
                  }`}
                >
                  {error}
                </div>
              ) : userActivity ? (
                <div className="space-y-6">
                  {/* User Info Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-md font-medium mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      User Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Name
                        </p>
                        <p className={darkMode ? "text-white" : "text-gray-900"}>
                          {userActivity.user.name}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Email
                        </p>
                        <p className={darkMode ? "text-white" : "text-gray-900"}>
                          {userActivity.user.email}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Last Login
                        </p>
                        <p className={darkMode ? "text-white" : "text-gray-900"}>
                          {new Date(userActivity.user.lastLogin).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Account Created
                        </p>
                        <p className={darkMode ? "text-white" : "text-gray-900"}>
                          {new Date(userActivity.user.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
  
                  {/* Dashboards Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-md font-medium mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Recent Dashboards (
                      {userActivity.recentActivity.dashboards.length})
                    </h4>
                    {userActivity.recentActivity.dashboards.length > 0 ? (
                      <div className="space-y-3">
                        {userActivity.recentActivity.dashboards.map(
                          (dashboard) => (
                            <div
                              key={dashboard._id}
                              className={`p-3 rounded ${
                                darkMode ? "bg-gray-600" : "bg-white"
                              } shadow`}
                            >
                              <div className="flex justify-between">
                                <div>
                                  <p
                                    className={`font-medium ${
                                      darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {dashboard.title}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      darkMode ? "text-gray-300" : "text-gray-500"
                                    }`}
                                  >
                                    {dashboard.description}
                                  </p>
                                </div>
                                <p
                                  className={`text-sm ${
                                    darkMode ? "text-gray-300" : "text-gray-500"
                                  }`}
                                >
                                  Last updated:{" "}
                                  {new Date(
                                    dashboard.lastUpdated
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No recent dashboard activity
                      </p>
                    )}
                  </div>
  
                  {/* Files Section */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-md font-medium mb-3 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Recent Files ({userActivity.recentActivity.files.length})
                    </h4>
                    {userActivity.recentActivity.files.length > 0 ? (
                      <div className="space-y-3">
                        {userActivity.recentActivity.files.map((file) => (
                          <div
                            key={file._id}
                            className={`p-3 rounded ${
                              darkMode ? "bg-gray-600" : "bg-white"
                            } shadow`}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p
                                  className={`font-medium ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {file.originalName}
                                </p>
                                <p
                                  className={`text-sm ${
                                    darkMode ? "text-gray-300" : "text-gray-500"
                                  }`}
                                >
                                  {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-500"
                                }`}
                              >
                                Uploaded:{" "}
                                {new Date(file.uploadDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No recent file uploads
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  };

export default UsersManagement