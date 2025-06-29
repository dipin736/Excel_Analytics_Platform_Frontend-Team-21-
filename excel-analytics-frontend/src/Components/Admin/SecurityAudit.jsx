import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiEyeOff,
  FiDownload,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiUser,
  FiClock,
  FiMapPin,
  FiActivity,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiInfo
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { BaseUrluser } from "../../endpoint/baseurl";

/**
 * Security & Audit Component
 * 
 * This component now uses REAL data from your backend APIs:
 * 
 * ✅ REAL DATA BEING USED:
 * - User login history (from User.lastLogin field)
 * - User account status (active/inactive)
 * - User storage usage monitoring
 * - System-level storage statistics
 * - User creation timestamps
 * - Account deactivation events
 * 
 * 🔄 FALLBACK TO MOCK DATA:
 * - If API calls fail, falls back to mock data for demonstration
 * 
 * 🚀 FUTURE ENHANCEMENTS (when backend supports):
 * - IP address tracking
 * - Device/browser information
 * - Session duration tracking
 * - Failed login attempts
 * - File access patterns
 * - Real-time security alerts
 * - Geolocation data
 * - Detailed audit trails
 */

const SecurityAudit = ({ darkMode, themeClasses }) => {
  const [activeTab, setActiveTab] = useState("login-history");
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "7d",
    eventType: "all",
    user: "all",
    status: "all"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Mock data for demonstration
  const mockLoginHistory = [
    {
      id: 1,
      userId: "user1",
      userName: "John Doe",
      email: "john@example.com",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      ipAddress: "192.168.1.100",
      location: "New York, US",
      device: "Chrome on Windows",
      status: "success",
      sessionDuration: "2h 15m"
    },
    {
      id: 2,
      userId: "user2",
      userName: "Jane Smith",
      email: "jane@example.com",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      ipAddress: "10.0.0.50",
      location: "London, UK",
      device: "Safari on Mac",
      status: "success",
      sessionDuration: "1h 45m"
    },
    {
      id: 3,
      userId: "user3",
      userName: "Bob Wilson",
      email: "bob@example.com",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      ipAddress: "203.0.113.25",
      location: "Sydney, AU",
      device: "Firefox on Linux",
      status: "failed",
      sessionDuration: "0m"
    }
  ];

  const mockSecurityEvents = [
    {
      id: 1,
      type: "failed_login",
      severity: "medium",
      description: "Multiple failed login attempts",
      userId: "user3",
      userName: "Bob Wilson",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      ipAddress: "203.0.113.25",
      details: "5 failed attempts in 10 minutes"
    },
    {
      id: 2,
      type: "suspicious_activity",
      severity: "high",
      description: "Unusual file access pattern",
      userId: "user1",
      userName: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
      ipAddress: "192.168.1.100",
      details: "Accessed 50+ files in 5 minutes"
    },
    {
      id: 3,
      type: "password_change",
      severity: "low",
      description: "Password changed successfully",
      userId: "user2",
      userName: "Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      ipAddress: "10.0.0.50",
      details: "Password updated via security settings"
    }
  ];

  const mockUserActivity = [
    {
      id: 1,
      userId: "user1",
      userName: "John Doe",
      action: "file_upload",
      details: "Uploaded sales_data.xlsx",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      ipAddress: "192.168.1.100",
      sessionId: "sess_12345"
    },
    {
      id: 2,
      userId: "user2",
      userName: "Jane Smith",
      action: "chart_created",
      details: "Created bar chart from revenue_data.xlsx",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      ipAddress: "10.0.0.50",
      sessionId: "sess_12346"
    },
    {
      id: 3,
      userId: "user1",
      userName: "John Doe",
      action: "dashboard_shared",
      details: "Shared dashboard 'Q4 Analytics' with team",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      ipAddress: "192.168.1.100",
      sessionId: "sess_12345"
    }
  ];

  const mockAuditLogs = [
    {
      id: 1,
      action: "user_created",
      performedBy: "admin",
      target: "user4",
      details: "Created new user account for alice@example.com",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      ipAddress: "192.168.1.1",
      changes: { role: "user", status: "active" }
    },
    {
      id: 2,
      action: "permission_changed",
      performedBy: "admin",
      target: "user2",
      details: "Changed user role from 'user' to 'moderator'",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
      ipAddress: "192.168.1.1",
      changes: { role: "moderator" }
    },
    {
      id: 3,
      action: "file_deleted",
      performedBy: "user1",
      target: "temp_file.xlsx",
      details: "Deleted temporary file",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      ipAddress: "192.168.1.100",
      changes: { fileSize: "2.5MB", fileType: "xlsx" }
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from backend APIs
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all users for login history and activity
        const usersResponse = await fetch(`${BaseUrluser}/users`, { headers });
        const usersData = await usersResponse.json();
        
        // Fetch admin dashboard stats for additional security insights
        const statsResponse = await fetch(`${BaseUrluser}/dashboard/admin/stats`, { headers });
        const statsData = statsResponse.ok ? await statsResponse.json() : null;
        
        if (usersData.success) {
          // Transform user data into login history format
          const loginHistoryData = usersData.data
            .filter(user => user.lastLogin)
            .map(user => ({
              id: user._id,
              userId: user._id,
              userName: user.name,
              email: user.email,
              timestamp: new Date(user.lastLogin),
              ipAddress: "N/A", // Not stored in current model
              location: "N/A", // Not stored in current model
              device: "N/A", // Not stored in current model
              status: "success",
              sessionDuration: "N/A" // Not tracked in current model
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10); // Get last 10 logins

          setLoginHistory(loginHistoryData);

          // Generate security events based on user data
          const securityEventsData = [];
          
          // Check for inactive users
          const inactiveUsers = usersData.data.filter(user => !user.isActive);
          inactiveUsers.forEach(user => {
            securityEventsData.push({
              id: `inactive_${user._id}`,
              type: "account_deactivated",
              severity: "medium",
              description: "User account deactivated",
              userId: user._id,
              userName: user.name,
              timestamp: new Date(user.updatedAt || user.createdAt),
              ipAddress: "N/A",
              details: `Account for ${user.email} has been deactivated`
            });
          });

          // Check for users with high storage usage
          const highStorageUsers = usersData.data.filter(user => 
            user.storageUsed && user.storageLimit && 
            (user.storageUsed / user.storageLimit) > 0.8
          );
          highStorageUsers.forEach(user => {
            securityEventsData.push({
              id: `storage_${user._id}`,
              type: "high_storage_usage",
              severity: "low",
              description: "High storage usage detected",
              userId: user._id,
              userName: user.name,
              timestamp: new Date(),
              ipAddress: "N/A",
              details: `${Math.round((user.storageUsed / user.storageLimit) * 100)}% storage used`
            });
          });

          // Add system-level security events if stats are available
          if (statsData && statsData.success) {
            const stats = statsData.data;
            
            // Check for unusual file upload patterns
            if (stats.files && stats.files.total > 100) {
              securityEventsData.push({
                id: "high_file_count",
                type: "high_file_activity",
                severity: "medium",
                description: "High number of files detected",
                userId: "system",
                userName: "System",
                timestamp: new Date(),
                ipAddress: "N/A",
                details: `${stats.files.total} total files in system`
              });
            }

            // Check for storage usage
            if (stats.files && stats.files.storageUsed > 1024 * 1024 * 1024) { // 1GB
              securityEventsData.push({
                id: "high_storage_usage",
                type: "system_storage_warning",
                severity: "medium",
                description: "High system storage usage",
                userId: "system",
                userName: "System",
                timestamp: new Date(),
                ipAddress: "N/A",
                details: `${(stats.files.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB used`
              });
            }
          }

          setSecurityEvents(securityEventsData);

          // Generate user activity from user data
          const userActivityData = usersData.data
            .filter(user => user.lastLogin)
            .map(user => ({
              id: user._id,
              userId: user._id,
              userName: user.name,
              action: "login",
              details: `Last login from ${user.email}`,
              timestamp: new Date(user.lastLogin),
              ipAddress: "N/A"
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

          setUserActivity(userActivityData);

          // Generate audit logs from user management actions
          const auditLogsData = usersData.data
            .map(user => ({
              id: user._id,
              action: "user_created",
              performedBy: "system",
              target: user.email,
              details: `User account created for ${user.name}`,
              timestamp: new Date(user.createdAt),
              ipAddress: "N/A"
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

          setAuditLogs(auditLogsData);
        }

      } catch (err) {
        console.error("Failed to load security data:", err);
        setError(err.message);
        toast.error("Failed to load security data");
        
        // Fallback to mock data if API fails
        setLoginHistory(mockLoginHistory);
        setSecurityEvents(mockSecurityEvents);
        setUserActivity(mockUserActivity);
        setAuditLogs(mockAuditLogs);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400";
      case "medium": return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400";
      case "low": return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400";
      default: return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success": return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <FiXCircle className="w-4 h-4 text-red-500" />;
      case "pending": return <FiClock className="w-4 h-4 text-yellow-500" />;
      default: return <FiInfo className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const exportData = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filename} exported successfully`);
  };

  const refreshData = () => {
    setLoading(true);
    // Reload data from APIs
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const usersResponse = await fetch(`${BaseUrluser}/users`, { headers });
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
          // Update login history
          const loginHistoryData = usersData.data
            .filter(user => user.lastLogin)
            .map(user => ({
              id: user._id,
              userId: user._id,
              userName: user.name,
              email: user.email,
              timestamp: new Date(user.lastLogin),
              ipAddress: "N/A",
              location: "N/A",
              device: "N/A",
              status: "success",
              sessionDuration: "N/A"
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

          setLoginHistory(loginHistoryData);

          // Update security events
          const securityEventsData = [];
          const inactiveUsers = usersData.data.filter(user => !user.isActive);
          inactiveUsers.forEach(user => {
            securityEventsData.push({
              id: `inactive_${user._id}`,
              type: "account_deactivated",
              severity: "medium",
              description: "User account deactivated",
              userId: user._id,
              userName: user.name,
              timestamp: new Date(user.updatedAt || user.createdAt),
              ipAddress: "N/A",
              details: `Account for ${user.email} has been deactivated`
            });
          });

          const highStorageUsers = usersData.data.filter(user => 
            user.storageUsed && user.storageLimit && 
            (user.storageUsed / user.storageLimit) > 0.8
          );
          highStorageUsers.forEach(user => {
            securityEventsData.push({
              id: `storage_${user._id}`,
              type: "high_storage_usage",
              severity: "low",
              description: "High storage usage detected",
              userId: user._id,
              userName: user.name,
              timestamp: new Date(),
              ipAddress: "N/A",
              details: `${Math.round((user.storageUsed / user.storageLimit) * 100)}% storage used`
            });
          });

          setSecurityEvents(securityEventsData);

          // Update user activity
          const userActivityData = usersData.data
            .filter(user => user.lastLogin)
            .map(user => ({
              id: user._id,
              userId: user._id,
              userName: user.name,
              action: "login",
              details: `Last login from ${user.email}`,
              timestamp: new Date(user.lastLogin),
              ipAddress: "N/A"
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

          setUserActivity(userActivityData);

          // Update audit logs
          const auditLogsData = usersData.data
            .map(user => ({
              id: user._id,
              action: "user_created",
              performedBy: "system",
              target: user.email,
              details: `User account created for ${user.name}`,
              timestamp: new Date(user.createdAt),
              ipAddress: "N/A"
            }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

          setAuditLogs(auditLogsData);
        }

        toast.success("Security data refreshed successfully");
      } catch (err) {
        console.error("Failed to refresh security data:", err);
        toast.error("Failed to refresh security data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  };

  const tabs = [
    { id: "login-history", label: "Login History", icon: FiUser },
    { id: "security-events", label: "Security Events", icon: FiShield },
    { id: "user-activity", label: "User Activity", icon: FiActivity },
    { id: "audit-logs", label: "Audit Logs", icon: FiLock }
  ];

  const renderLoginHistory = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
          Recent Login Activity
        </h3>
        <button
          onClick={() => exportData(loginHistory, "login_history")}
          className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          type="button"
        >
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className={`${themeClasses.card} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${themeClasses.background} border-b ${themeClasses.border}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  User
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Time
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  IP Address
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Location
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Device
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((login) => (
                <tr key={login.id} className={`border-b ${themeClasses.border} hover:${themeClasses.hover}`}>
                  <td className="px-4 py-3">
                    <div>
                      <div className={`font-medium ${themeClasses.textPrimary}`}>
                        {showSensitiveData ? login.userName : login.userName.replace(/(.{2}).*(.{2})/, '$1***$2')}
                      </div>
                      <div className={`text-sm ${themeClasses.textMuted}`}>
                        {showSensitiveData ? login.email : login.email.replace(/(.{3}).*@/, '$1***@')}
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {formatTimestamp(login.timestamp)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {showSensitiveData ? login.ipAddress : login.ipAddress.replace(/\d+\.\d+\.\d+\.(\d+)/, '***.***.***.$1')}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    <div className="flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3" />
                      <span>{login.location}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {login.device}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(login.status)}
                      <span className={`text-sm capitalize ${login.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {login.status}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {login.sessionDuration}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSecurityEvents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
          Security Events & Alerts
        </h3>
        <button
          onClick={() => exportData(securityEvents, "security_events")}
          className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          type="button"
        >
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {securityEvents.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${themeClasses.card} rounded-lg border p-4`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </span>
                  <h4 className={`font-medium ${themeClasses.textPrimary}`}>
                    {event.description}
                  </h4>
                </div>
                <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>
                  {event.details}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <FiUser className="w-3 h-3" />
                    <span>{event.userName}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiClock className="w-3 h-3" />
                    <span>{formatTimestamp(event.timestamp)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiMapPin className="w-3 h-3" />
                    <span>{event.ipAddress}</span>
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View details"
                  type="button"
                >
                  <FiEye className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Mark as resolved"
                  type="button"
                >
                  <FiCheckCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
          User Activity Monitor
        </h3>
        <button
          onClick={() => exportData(userActivity, "user_activity")}
          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          type="button"
        >
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="grid gap-4">
        {userActivity.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${themeClasses.card} rounded-lg border p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div>
                  <h4 className={`font-medium ${themeClasses.textPrimary}`}>
                    {activity.userName}
                  </h4>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    {activity.details}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FiClock className="w-3 h-3" />
                      <span>{formatTimestamp(activity.timestamp)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3" />
                      <span>{activity.ipAddress}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
          System Audit Logs
        </h3>
        <button
          onClick={() => exportData(auditLogs, "audit_logs")}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          type="button"
        >
          <FiDownload className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className={`${themeClasses.card} rounded-lg border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${themeClasses.background} border-b ${themeClasses.border}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Action
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Performed By
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Target
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Details
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  Time
                </th>
                <th className={`px-4 py-3 text-left text-sm font-medium ${themeClasses.textSecondary}`}>
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className={`border-b ${themeClasses.border} hover:${themeClasses.hover}`}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {log.performedBy}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {log.target}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {log.details}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${themeClasses.textSecondary}`}>
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const getActionColor = (action) => {
    switch (action) {
      case "file_upload": return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400";
      case "chart_created": return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400";
      case "dashboard_shared": return "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400";
      case "user_created": return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400";
      case "permission_changed": return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400";
      case "file_deleted": return "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "file_upload": return <FiDownload className="w-4 h-4" />;
      case "chart_created": return <FiBarChart2 className="w-4 h-4" />;
      case "dashboard_shared": return <FiTrendingUp className="w-4 h-4" />;
      default: return <FiActivity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-2 ${themeClasses.textSecondary}`}>Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
            Security & Audit
          </h1>
          <p className={`mt-1 ${themeClasses.textSecondary}`}>
            Monitor system security, user activity, and audit logs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.hover}`}
            type="button"
          >
            {showSensitiveData ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            <span>{showSensitiveData ? "Hide" : "Show"} Sensitive Data</span>
          </button>
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            type="button"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              type="button"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "login-history" && renderLoginHistory()}
          {activeTab === "security-events" && renderSecurityEvents()}
          {activeTab === "user-activity" && renderUserActivity()}
          {activeTab === "audit-logs" && renderAuditLogs()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SecurityAudit; 