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
} from "react-icons/fi";
import DynamicChart from "../User/DynamicChart";
import { BaseUrluser } from "../../endpoint/baseurl";
import axios from "axios";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import UsersManagement from "./UsersManagement";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
  };

  const fetchExcelFiles = async () => {
    const response = await fetch(`${BaseUrluser}/users/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return await response.json();
  };


  useEffect(() => {
    const savedMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedMode !== null) {
      setDarkMode(savedMode);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setDarkMode(true);
    }
    fetchExcelFiles();
  }, []);

  // Sample data
  const usersData = [
    { month: "Jan", users: 1200, revenue: 45000 },
    { month: "Feb", users: 1800, revenue: 52000 },
    { month: "Mar", users: 2100, revenue: 61000 },
    { month: "Apr", users: 2400, revenue: 73000 },
    { month: "May", users: 2900, revenue: 85000 },
    { month: "Jun", users: 3500, revenue: 92000 },
  ];

  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${BaseUrluser}/dashboard/admin/stats/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, 
          },
        });

        const stats = res.data.data;

  
        const dynamicMetrics = [
          {
            title: "Total Users",
            value: stats.users.total.toString(),
            change: `+${stats.users.new}`,
            trend: stats.users.new > 0 ? "up" : "down",
          },
          {
            title: "Active Users",
            value: stats.users.active.toString(),
            change: "",
            trend: "up",
          },
          {
            title: "Dashboards",
            value: stats.dashboards.total.toString(),
            change: "",
            trend: "up",
          },
          {
            title: "Public Dashboards",
            value: stats.dashboards.public.toString(),
            change: "",
            trend: "up",
          },
          {
            title: "Files Stored",
            value: stats.files.total.toString(),
            change: "",
            trend: "up",
          },
          {
            title: "Storage Used",
            value: `${(stats.files.storageUsed / (1024 * 1024)).toFixed(2)} MB`,
            change: "",
            trend: "up",
          },
        ];

        setMetrics(dynamicMetrics);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Theme classes
  const themeClasses = {
    background: darkMode ? "bg-gray-900" : "bg-gray-50",
    sidebar: darkMode ? "bg-gray-800" : "bg-blue-800",
    card: darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800",
    header: darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800",
    textPrimary: darkMode ? "text-white" : "text-gray-800",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-600",
    border: darkMode ? "border-gray-700" : "border-gray-200",
    input: darkMode
      ? "bg-gray-700 text-white border-gray-600"
      : "bg-white text-gray-800 border-gray-300",
    tableHeader: darkMode
      ? "bg-gray-700 text-gray-300"
      : "bg-gray-50 text-gray-500",
    tableRow: darkMode
      ? "bg-gray-800 hover:bg-gray-700"
      : "bg-white hover:bg-gray-50",
    successBadge: darkMode
      ? "bg-green-900 text-green-200"
      : "bg-green-100 text-green-800",
    logoutButton: darkMode
      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
      : "bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600",
  };
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Session timeout management
  useEffect(() => {
    const resetTimeout = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    // Check for inactivity
    const checkInactivity = setInterval(() => {
      const timeNow = Date.now();
      const timeSinceLastActivity = timeNow - lastActivity;
      
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        clearInterval(checkInactivity);
        toast.warning("Your session is about to expire due to inactivity");
        setSessionTimeout(setTimeout(() => {
          toast.error("Session expired due to inactivity");
          handleLogout();
        }, 60000)); // Give them 1 minute warning
      }
    }, 60000); // Check every minute

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
      clearInterval(checkInactivity);
      if (sessionTimeout) clearTimeout(sessionTimeout);
    };
  }, [lastActivity]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    toast.info("You have been logged out successfully");
    navigate("/login");
  };

  return (
    <div className={`flex h-screen ${themeClasses.background}`}>
      {/* Sidebar */}
      <motion.div
        animate={{ width: sidebarOpen ? 256 : 80 }} 
        transition={{ duration: 0.3 }}
        className={`${themeClasses.sidebar} text-white h-full transition-all`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">AdminPanel</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-opacity-20 "
          >
            <FiMenu size={20} />
          </button>
        </div>

        <nav className="mt-8">
          <NavItem
            icon={<FiHome />}
            text="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            expanded={sidebarOpen}
            darkMode={darkMode}
          />
          <NavItem
            icon={<FiUsers />}
            text="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            expanded={sidebarOpen}
            darkMode={darkMode}
          />
          {/* <NavItem
            icon={<FiDatabase />}
            text="Data"
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
            expanded={sidebarOpen}
            darkMode={darkMode}
          />
          <NavItem
            icon={<FiBarChart2 />}
            text="Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
            expanded={sidebarOpen}
            darkMode={darkMode}
          />
          <NavItem
            icon={<FiSettings />}
            text="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            expanded={sidebarOpen}
            darkMode={darkMode}
          /> */}
        </nav>
        <div className="mt-6">
          <NavItem
            icon={<FiLogOut />}
            text="Logout"
            active={false}
            onClick={() => setShowLogoutConfirmation(true)}
            expanded={sidebarOpen}
            darkMode={darkMode}
          />
        </div>
        <AnimatePresence>
          {showLogoutConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 16 }}
                className={`${themeClasses.modal} rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border`}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-full bg-red-100 animate-pulse-slow">
                    <FiLogOut className="text-red-500 text-xl" />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${themeClasses.modalText}`}
                  >
                    Confirm Logout
                  </h3>
                </div>
                <p
                  className={`${
                    darkMode ? "text-gray-100" : "text-gray-200"
                  } mb-6`}
                >
                  Are you sure you want to log out?
                </p>
                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 130, damping: 17 }}
                    onClick={() => setShowLogoutConfirmation(false)}
                    className={`px-4 py-2 ${
                      themeClasses.button
                    } rounded-lg transition-all shadow-sm ${
                      darkMode ? "text-gray-100" : "text-gray-100"
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 130, damping: 17 }}
                    onClick={handleLogout}
                    className={`px-4 py-2 ${themeClasses.logoutButton} text-white rounded-lg transition-all shadow-md`}
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation */}
        <motion.header
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`${themeClasses.header} shadow-sm p-4 flex justify-between items-center`}
        >
          <h2 className={`text-xl font-semibold ${themeClasses.textPrimary}`}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle moved here */}
            <div className="relative">
              <FiSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search..."
                className={`pl-10 pr-4 py-2 rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>

            <button
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              } relative`}
            >
              <FiBell
                size={20}
                className={darkMode ? "text-gray-300" : "text-gray-600"}
              />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-blue-100 hover:bg-blue-200"
              } transition-colors`}
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <FiSun className="text-yellow-300" size={20} />
              ) : (
                <FiMoon className="text-blue-700" size={20} />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                A
              </div>
              {sidebarOpen && (
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  {user.name}
                </span>
              )}
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <motion.main
          key={activeTab} // triggers animation on tab change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6"
        >
          {activeTab === "dashboard" && (
            <>
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MetricCard
                      title={metric.title}
                      value={metric.value}
                      change={metric.change}
                      trend={metric.trend}
                      darkMode={darkMode}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-4xl font-bold text-center text-indigo-600 mb-8"
              >
                📊 Charts to Display Static, Illustrative Data
              </motion.h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <motion.div
                  className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3
                    className={`text-lg font-medium mb-4 ${themeClasses.textPrimary}`}
                  >
                    User Growth
                  </h3>
                  <div className="h-80">
                    <DynamicChart
                      data={usersData}
                      chartType="line"
                      xAxis="month"
                      yAxis="users"
                      darkMode={darkMode}
                      xAxisColor="red"   
                      yAxisColor="blue"  
                    />
                  </div>
                </motion.div>

                <motion.div
                  className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3
                    className={`text-lg font-medium mb-4 ${themeClasses.textPrimary}`}
                  >
                    Revenue Sources
                  </h3>
                  <div className="h-80">
                    <DynamicChart
                      data={usersData}
                      chartType="bar"
                      xAxis="month"
                      yAxis="revenue"
                      darkMode={darkMode}
                    />
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <UsersManagement darkMode={darkMode} themeClasses={themeClasses} />
          )}
          {activeTab === "data" && (
            <DataManagement darkMode={darkMode} themeClasses={themeClasses} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsDashboard
              darkMode={darkMode}
              themeClasses={themeClasses}
            />
          )}
          {activeTab === "settings" && (
            <SettingsPanel darkMode={darkMode} themeClasses={themeClasses} />
          )}
        </motion.main>
      </div>
    </div>
  );
};

// Reusable Components
const NavItem = ({ icon, text, active, onClick, expanded, darkMode }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-4 ${
      active
        ? darkMode
          ? "bg-gray-700"
          : "bg-blue-700"
        : darkMode
        ? "hover:bg-gray-700"
        : "hover:bg-blue-700"
    } transition-colors`}
  >
    <span className="mr-3">{icon}</span>
    {expanded && <span>{text}</span>}
  </button>
);

const MetricCard = ({ title, value, change, trend, darkMode }) => (
  <div
    className={`${
      darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
    } p-6 rounded-xl shadow-sm`}
  >
    <h3
      className={`${
        darkMode ? "text-gray-400" : "text-gray-500"
      } text-sm font-medium mb-1`}
    >
      {title}
    </h3>
    <p className="text-2xl font-bold mb-2">{value}</p>
    <div
      className={`flex items-center ${
        trend === "up" ? "text-green-500" : "text-red-500"
      }`}
    >
      {trend === "up" ? (
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
      <span className="text-sm">{change}</span>
    </div>
  </div>
);



const DataManagement = ({ darkMode, themeClasses }) => (
  <div className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}>
    <h2 className={`text-xl font-semibold mb-6 ${themeClasses.textPrimary}`}>
      Data Management
    </h2>
    {/* Data management content */}
  </div>
);

const AnalyticsDashboard = ({ darkMode, themeClasses }) => (
  <div className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}>
    <h2 className={`text-xl font-semibold mb-6 ${themeClasses.textPrimary}`}>
      Analytics Dashboard
    </h2>
    {/* Analytics content */}
  </div>
);

const SettingsPanel = ({ darkMode, themeClasses }) => (
  <div className={`${themeClasses.card} p-6 rounded-xl shadow-sm`}>
    <h2 className={`text-xl font-semibold mb-6 ${themeClasses.textPrimary}`}>
      Settings
    </h2>
    {/* Settings content */}
  </div>
);

export default AdminDashboard;
