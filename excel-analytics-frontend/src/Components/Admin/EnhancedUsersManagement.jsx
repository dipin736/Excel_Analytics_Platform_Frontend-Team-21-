import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "react-toastify";
import {
  FiUsers, FiSearch, FiPlus, FiEdit, FiTrash2, FiEye,
  FiUserCheck, FiUserX, FiX, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { BaseUrluser } from '../../endpoint/baseurl';

const EnhancedUsersManagement = ({ darkMode, themeClasses }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BaseUrluser}/users/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${BaseUrluser}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      await fetchUsers();
      setShowCreateModal(false);
      setFormData({});
      toast.success('User created successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`${BaseUrluser}/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({});
      toast.success('User updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${BaseUrluser}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      await fetchUsers();
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${BaseUrluser}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      await fetchUsers();
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // User Modal Component
  const UserModal = ({ isEdit = false, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`max-w-md w-full ${themeClasses.card} rounded-xl shadow-2xl p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>
            {isEdit ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <FiX />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          isEdit ? handleUpdateUser() : handleCreateUser();
        }} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              required
              className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              required
              className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter email address"
            />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword || ''}
                  onChange={handleInputChange}
                  required
                  className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                  placeholder="Confirm password"
                />
              </div>
            </>
          )}

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
              Role
            </label>
            <select
              name="role"
              value={formData.role || 'user'}
              onChange={handleInputChange}
              className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={handleInputChange}
                required
                min="18"
                max="100"
                className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
                placeholder="Age"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                required
                className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              required
              className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.textSecondary}`}>
              Address *
            </label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              required
              rows="3"
              className={`mt-1 w-full px-3 py-2 rounded-lg border ${themeClasses.input}`}
              placeholder="Enter address"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                darkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${themeClasses.textSecondary}`}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
            User Management
          </h2>
          <p className={`mt-1 ${themeClasses.textSecondary}`}>
            Manage users, permissions, and account settings
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({});
            setShowCreateModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Search */}
      <div className={`${themeClasses.card} rounded-xl p-6 border`}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${themeClasses.input}`}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className={`${themeClasses.card} rounded-xl border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(paginatedUsers.map(u => u._id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  User
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Role
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Storage
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {paginatedUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(prev => [...prev, user._id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user._id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                          {user.name}
                        </div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm ${themeClasses.textSecondary}`}>
                      {((user.storageUsed || 0) / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setFormData({
                            name: user.name,
                            email: user.email,
                            role: user.role,
                            isActive: user.isActive,
                            company: user.company || '',
                            jobTitle: user.jobTitle || '',
                            age: user.age,
                            gender: user.gender,
                            phone: user.phone,
                            address: user.address
                          });
                          setShowEditModal(true);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="Edit user"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        className={`p-1 transition-colors ${
                          user.isActive
                            ? 'text-yellow-600 hover:text-yellow-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? <FiUserX className="w-4 h-4" /> : <FiUserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete user"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className={`text-sm ${themeClasses.textSecondary}`}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : `${themeClasses.textSecondary} hover:bg-gray-100`
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <UserModal isEdit={false} onClose={() => setShowCreateModal(false)} />
        )}
        {showEditModal && (
          <UserModal isEdit={true} onClose={() => setShowEditModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedUsersManagement; 