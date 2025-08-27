import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useBlocker, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,FiMoon,FiSun,
  FiHelpCircle
} from "react-icons/fi";
import { BaseUrl, BaseUrluser } from "../../endpoint/baseurl";
import ExcelFileList from "./ExcelFileList";
import ExcelUploader from "./ExcelUploader";
import DashboardList from "./DashboardList";
import DashboardView from "./DashboardView";
import { motion, AnimatePresence } from "framer-motion";
import UserProfile from "./UserProfile";
import ErrorBoundary from "../ErrorBoundary";
import { FullPageLoading, LoadingSpinner } from "../LoadingComponents";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts.jsx";

const NavButton = ({ active, onClick, icon, children, darkMode }) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg transition-all ${
      active 
        ? (darkMode ? 'bg-gray-700 shadow-md' : 'bg-white/10 shadow-md')
        : (darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white/5')
    }`}
    aria-label={`Navigate to ${children}`}
  >
    <span className={`text-lg ${
      active 
        ? 'text-white' 
        : (darkMode ? 'text-gray-300' : 'text-indigo-200')
    }`}>
      {icon}
    </span>
    <span className={`font-medium ${
      active 
        ? 'text-white' 
        : (darkMode ? 'text-gray-300' : 'text-indigo-200')
    }`}>
      {children}
    </span>
  </button>
);

const Dashboard = () => {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const [userStats, setUserStats] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [excelFiles, setExcelFiles] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading1, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  const { showShortcuts: showShortcutsList } = useKeyboardShortcuts({
    onSave: () => {
      // Handle save based on active tab
      toast.info('Save functionality available in chart builder');
    },
    onDownload: () => {
      toast.info('Download functionality available in charts');
    },
    onClose: () => {
      if (showLogoutConfirmation) {
        setShowLogoutConfirmation(false);
      }
    },
    onToggleDarkMode: () => setDarkMode(!darkMode),
    onRefresh: () => {
      window.location.reload();
    },
    onNewChart: () => {
      if (activeTab === 'excel') {
        toast.info('Select a file to create a new chart');
      }
    },
    onSearch: () => {
      toast.info('Search functionality coming soon');
    }
  });

  // Block any navigation that would go back
  useEffect(() => {
    // Push a new entry into the history stack
    window.history.pushState(null, null, window.location.href);
    
    const handleBackButton = (e) => {
      e.preventDefault();
      // Push another entry if they try to go back
      window.history.pushState(null, null, window.location.href);
    };

    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate]);

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

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Make all API calls in parallel for faster loading
        const [statsResponse, dashboardsResponse, filesResponse] = await Promise.all([
          fetch(`${BaseUrluser}/dashboard/user/stats`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${BaseUrluser}/dashboard`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch(`${BaseUrluser}/excel`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
        ]);

        // Process responses
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUserStats(statsData.data || {});
        }

        if (dashboardsResponse.ok) {
          const dashboardsData = await dashboardsResponse.json();
          setDashboards(dashboardsData.data || []);
        }

        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setExcelFiles(filesData.data || []);
        }

      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && !loading) {
      loadInitialData();
    }
  }, [user, loading]);

  const showLogoutDialog = () => {
    setShowLogoutConfirmation(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    toast.info("You have been logged out successfully");
    navigate("/login");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset any errors when changing tabs
    setError(null);
  };

  // Theme classes
  const themeClasses = {
    main: darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800',
    sidebar: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-indigo-600 border-indigo-500',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  };

  const renderContent = () => {
    if (loading1) {
      return <FullPageLoading message="Loading your dashboard..." darkMode={darkMode} />;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            user={user}
            stats={userStats}
            dashboards={dashboards}
            excelFiles={excelFiles}
            darkMode={darkMode}
          />
        );
      case "dashboards":
        return (
          <DashboardList
            dashboards={dashboards}
            setDashboards={setDashboards}
            darkMode={darkMode}
          />
        );
      case "excel":
        return (
          <ExcelFileList
            files={excelFiles}
            setFiles={setExcelFiles}
            darkMode={darkMode}
          />
        );
      case "upload":
        return (
          <ExcelUploader
            onUploadSuccess={(newFile) => {
              setExcelFiles(prev => [...prev, newFile]);
              toast.success("File uploaded successfully!");
            }}
            onCancel={() => handleTabChange("excel")}
            darkMode={darkMode}
          />
        );
      case "user":
        return (
          <UserProfile
            user={user}
            setUser={setUser}
            darkMode={darkMode}
          />
        );
      default:
        return <DashboardView user={user} stats={userStats} dashboards={dashboards} excelFiles={excelFiles} darkMode={darkMode} />;
    }
  };

  if (loading) {
    return <FullPageLoading message="Authenticating..." darkMode={darkMode} />;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 flex-shrink-0 ${themeClasses.sidebar} border-r flex flex-col`}>
          {/* Header */}
          <div className="p-6 border-b border-indigo-500">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Excel Analytics</h1>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-indigo-500'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FiSun className="text-white" /> : <FiMoon className="text-white" />}
              </button>
            </div>
            <p className="text-indigo-200 text-sm mt-1">Welcome back, {user.name}</p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1 p-4">
            {[
              { tab: "dashboard", icon: <FiHome className="animate-pulse" />, label: "Overview" },
              { tab: "dashboards", icon: <FiPieChart className="animate-wiggle" />, label: "My Dashboards" },
              { tab: "excel", icon: <FiFileText className="animate-slide-in-left" />, label: "Excel Files" },
              { tab: "upload", icon: <FiUpload className="animate-bounce-slow" />, label: "Upload File" },
              { tab: "user", icon: <FiUser className="animate-bounce-slow" />, label: "User Profile" }

            ].map((item) => (
              <motion.div
                key={item.tab}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 150, damping: 15 }}
              >
                <NavButton
                  active={activeTab === item.tab}
                  onClick={() => handleTabChange(item.tab)}
                  icon={item.icon}
                  darkMode={darkMode}
                >
                  {item.label}
                </NavButton>
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-indigo-500">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={showLogoutDialog}
                className="flex items-center space-x-2 text-indigo-200 hover:text-white transition-colors"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
              <button
                onClick={showShortcutsList}
                className="p-2 text-indigo-200 hover:text-white transition-colors"
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts (Ctrl+K)"
              >
                <FiHelpCircle />
              </button>
            </div>
            <div className="text-xs text-indigo-300">
              Session: {Math.floor((Date.now() - lastActivity) / 60000)}m ago
            </div>
          </div>
        </div>

        {/* Main Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className={`flex-1 overflow-y-auto p-6 ${themeClasses.main}`}
          >
            {renderContent()}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Animated Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
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
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  Confirm Logout
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 mb-6`}>
                  Are you sure you want to logout? Any unsaved changes will be lost.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={cancelLogout}
                    className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                      darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
};

export default Dashboard;
