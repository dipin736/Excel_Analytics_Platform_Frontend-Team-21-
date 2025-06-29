import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiUsers,
  FiDatabase,
  FiSettings,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiBell,
  FiMail,
  FiSearch,
  FiMenu,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUserPlus,
  FiShield,
  FiActivity,
  FiFileText,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiHelpCircle,
  FiX
} from "react-icons/fi";
import DynamicChart from "../User/DynamicChart";
import { BaseUrluser } from "../../endpoint/baseurl";
import axios from "axios";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import UsersManagement from "./EnhancedUsersManagement";
import SecurityAudit from "./SecurityAudit";

// Enhanced Admin Dashboard with modern UI
const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showShortcutsList, setShowShortcutsList] = useState(false);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Navigation items with icons and descriptions
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FiHome,
      description: "Overview & Analytics"
    },
    {
      id: "users",
      label: "User Management",
      icon: FiUsers,
      description: "Manage Users & Permissions"
    },
    {
      id: "security",
      label: "Security & Audit",
      icon: FiShield,
      description: "Security & Activity Logs"
    }
  ];

  // Theme configuration
  const themeClasses = {
    background: darkMode ? "bg-gray-900" : "bg-gray-50",
    sidebar: darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    card: darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200",
    textPrimary: darkMode ? "text-white" : "text-gray-800",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-600",
    textMuted: darkMode ? "text-gray-400" : "text-gray-500",
    border: darkMode ? "border-gray-700" : "border-gray-200",
    hover: darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50",
    input: darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800 border-gray-300"
  };

  // Fetch admin statistics - only once on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BaseUrluser}/dashboard/admin/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin stats");
        }

        const data = await response.json();
        const stats = data.data;

        const dynamicMetrics = [
          {
            title: "Total Users",
            value: stats.users.total.toString(),
            change: `+${stats.users.new} this month`,
            trend: "up",
            icon: FiUsers,
            color: "blue"
          },
          {
            title: "Active Users",
            value: stats.users.active.toString(),
            change: "Last 7 days",
            trend: "up",
            icon: FiActivity,
            color: "green"
          },
          {
            title: "Total Dashboards",
            value: stats.dashboards.total.toString(),
            change: `${stats.dashboards.public} public`,
            trend: "up",
            icon: FiGrid,
            color: "purple"
          },
          {
            title: "Files Stored",
            value: stats.files.total.toString(),
            change: `${(stats.files.storageUsed / (1024 * 1024 * 1024)).toFixed(2)} GB used`,
            trend: "up",
            icon: FiDatabase,
            color: "orange"
          }
        ];

        setMetrics(dynamicMetrics);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        setError(err.message);
        toast.error("Failed to load admin statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty dependency array - only run once

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    toast.info("Logged out successfully");
    navigate("/login");
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Navigation item component - simplified
  const NavItem = ({ item, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg"
          : `${themeClasses.textSecondary} ${themeClasses.hover}`
      }`}
      type="button"
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {sidebarOpen && (
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium truncate">{item.label}</div>
          <div className={`text-xs ${isActive ? "text-indigo-100" : themeClasses.textMuted} truncate`}>
            {item.description}
          </div>
        </div>
      )}
    </button>
  );

  // Metric card component
  const MetricCard = ({ metric }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500"
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${themeClasses.card} rounded-xl p-6 border shadow-sm`}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>
              {metric.title}
            </p>
            <p className={`text-3xl font-bold mt-1 ${themeClasses.textPrimary}`}>
              {metric.value}
            </p>
            <p className={`text-xs mt-1 ${themeClasses.textMuted}`}>
              {metric.change}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[metric.color]} bg-opacity-10`}>
            <metric.icon className={`w-6 h-6 ${colorClasses[metric.color].replace('bg-', 'text-')}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${themeClasses.card} rounded-xl p-6 border`}
            >
              <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                Welcome back, {user?.name}!
              </h1>
              <p className={`mt-2 ${themeClasses.textSecondary}`}>
                Here's what's happening with your Excel Analytics Platform
              </p>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${themeClasses.card} rounded-xl p-6 border`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${themeClasses.textPrimary}`}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab("users")}
                  className="flex items-center space-x-3 p-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  type="button"
                >
                  <FiUserPlus className="w-5 h-5 text-indigo-600" />
                  <span className="text-indigo-700 font-medium">Manage Users</span>
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  type="button"
                >
                  <FiShield className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Security & Audit</span>
                </button>
              </div>
            </motion.div>
          </div>
        );

      case "users":
        return <UsersManagement darkMode={darkMode} themeClasses={themeClasses} />;

      case "security":
        return <SecurityAudit darkMode={darkMode} themeClasses={themeClasses} />;

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${themeClasses.textSecondary}`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} flex`}>
      {/* Sidebar */}
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className={`${themeClasses.sidebar} border-r transition-all duration-300 flex flex-col h-screen sticky top-0`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold ${sidebarOpen ? "block" : "hidden"}`}>
              Admin Panel
            </h1>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              type="button"
            >
              {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => handleTabChange(item.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowLogoutConfirmation(true)}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              type="button"
            >
              <FiLogOut />
              {sidebarOpen && <span>Logout</span>}
            </button>
            <button
              onClick={() => setShowShortcutsList(true)}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Keyboard shortcuts"
              type="button"
            >
              <FiHelpCircle />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              type="button"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            {sidebarOpen && (
              <div className="text-xs text-gray-400">
                Admin Panel
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className={`${themeClasses.card} border-b p-4 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              type="button"
            >
              <FiMenu />
            </button>
            <div>
              <h2 className={`text-lg font-semibold ${themeClasses.textPrimary}`}>
                {navigationItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className={`text-sm ${themeClasses.textSecondary}`}>
                {navigationItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`text-sm ${themeClasses.textSecondary}`}>
              Admin: {user?.name}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirmation && (
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
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiLogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${themeClasses.textPrimary}`}>
                  Confirm Logout
                </h3>
                <p className={`${themeClasses.textSecondary} mb-6`}>
                  Are you sure you want to logout? Any unsaved changes will be lost.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirmation(false)}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
