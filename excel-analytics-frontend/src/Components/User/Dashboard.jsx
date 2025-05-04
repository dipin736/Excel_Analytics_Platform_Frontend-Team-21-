import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext.";
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
  FiBarChart2,FiMoon,FiSun 
} from "react-icons/fi";
import { BaseUrl, BaseUrluser } from "../../endpoint/baseurl";
import ExcelFileList from "./ExcelFileList";
import ExcelUploader from "./ExcelUploader";
import DashboardList from "./DashboardList";
import DashboardView from "./DashboardView";
import { motion, AnimatePresence } from "framer-motion";
import UserProfile from "./UserProfile";
const NavButton = ({ active, onClick, icon, children, darkMode }) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center space-x-3 p-3 rounded-lg transition-all ${
      active 
        ? (darkMode ? 'bg-gray-700 shadow-md' : 'bg-white/10 shadow-md')
        : (darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white/5')
    }`}
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

  // // Welcome notification on mount
  // useEffect(() => {
  //   if (user && user.name) {
  //     toast.success(`Welcome back, ${user.name}!`);
  //   }
  // }, [user]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-400"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BaseUrluser}/dashboard/user/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUserStats({
          user: result.data.user,
          stats: result.data.stats,
          latestActivity: result.data.latestActivity,
        });
      } else {
        throw new Error("Invalid data format from API");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExcelData = async () => {
    try {
      const response = await fetchExcelFiles();

      setExcelFiles(response.data);
    } catch (err) {
      console.error("Error fetching excel files:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchExcelData(),
        fetchUserActivity(),
      ]);
    };
    fetchData();
  }, []);
  const fetchUserActivity = async (userId) => {
    try {
      const response = await fetch(`${BaseUrluser}/dashboard/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user activity");
      }

      const result = await response.json();

      console.log("API Response:", result);

      if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          setDashboards(result.data);
        } else if (
          result.data.recentActivity &&
          Array.isArray(result.data.recentActivity.dashboards)
        ) {
          setDashboards(result.data.recentActivity.dashboards);
        } else {
          setDashboards([]);
          console.log(
            "Dashboard data structure not recognized, dashboards set to empty."
          );
        }
      } else {
        setDashboards([]);
        throw new Error("Invalid user activity data");
      }
    } catch (err) {
      console.error("Error fetching user activity:", err);
      setDashboards([]); // Ensure dashboards is empty on error
    }
  };
  const renderContent = () => {
    if (loading1) {
      return (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          Error: {error}
        </div>
      );
    }

    if (!userStats) {
      return (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">
          No data available
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardView  darkMode={darkMode} stats={userStats} />;
      case "dashboards":
        return <DashboardList dashboards={dashboards} darkMode={darkMode}
        setDashboards={setDashboards}
        />;
      case "excel":
        return <ExcelFileList darkMode={darkMode} files={excelFiles} setActiveTab={setActiveTab} />;
      case "upload":
        return <ExcelUploader  darkMode={darkMode} />;
      case "user":
          return <UserProfile darkMode={darkMode} setDarkMode={setDarkMode}/>;
      default:
        return <div>Select a tab</div>;
    }
  };
  const [darkMode, setDarkMode] = useState(true);
 

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  // Check for saved theme preference on component mount
  useEffect(() => {
    const savedMode = JSON.parse(localStorage.getItem('darkMode'));
    if (savedMode !== null) {
      setDarkMode(savedMode);
    }
  }, []);

  // Theme classes
  const themeClasses = {
    background: darkMode 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
      : 'bg-gradient-to-br from-blue-50 to-blue-100',
    sidebar: darkMode 
      ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
      : 'bg-gradient-to-b from-indigo-600 to-indigo-700',
    header: darkMode 
      ? 'bg-gray-800/70 border-gray-700' 
      : 'bg-white/70 border-blue-200/50',
    main: darkMode 
      ? 'bg-gray-800/80' 
      : 'bg-blue-100/80',
    text: darkMode 
      ? 'text-gray-100' 
      : 'text-gray-700',
    modal: darkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-blue-100',
    modalText: darkMode 
      ? 'text-gray-100' 
      : 'text-gray-800',
    button: darkMode 
      ? 'bg-gray-700 hover:bg-gray-600' 
      : 'bg-gray-100 hover:bg-gray-200',
    logoutButton: darkMode 
      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
      : 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600'
  };

  return (
    <>
     <div className={`flex h-screen ${themeClasses.background}`}>
      {/* Animated Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 10 }}
        className={`w-64 ${themeClasses.sidebar} text-white p-5 flex flex-col shadow-xl`}
      >
        <div className="mb-10">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12 }}
            className="flex items-center space-x-3"
          >
            <FiPieChart className="text-2xl text-indigo-300 animate-spin-slow" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                InsightForge
            </h1>
          </motion.div>
          <p className="text-indigo-300 text-sm mt-1">Interactive Dashboard</p>
        </div>

        <nav className="space-y-2 flex-1">
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
                onClick={() => setActiveTab(item.tab)}
                icon={item.icon}
                darkMode={darkMode}
              >
                {item.label}
              </NavButton>
            </motion.div>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-indigo-500">
    
          {/* User Profile (unchanged) */}
          {userStats && (
            <motion.div
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                darkMode ? 'bg-gray-700/70' : 'bg-indigo-800/70'
              } backdrop-blur-sm`}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 90, damping: 13 }}
            >
              <div className="bg-indigo-500 p-2 rounded-full shadow-sm">
                <FiUser className="text-white animate-fade-in-down" />
              </div>
              <div>
                <p className="font-medium text-indigo-100">{userStats.user?.name || "User"}</p>
                <div className="w-full bg-indigo-700 rounded-full h-1.5 mt-1">
                  <motion.div
                    className="bg-indigo-300 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.round((userStats.user?.storagePercentage || 0) * 100)}%`
                    }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-xs text-indigo-200 mt-1">
                  {Math.round((userStats.user?.storagePercentage || 0) * 100)}% storage used
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 10 }}
          className={`${themeClasses.header} backdrop-blur-sm py-4 px-6 flex justify-between items-center shadow-sm`}
        >
          <motion.h1
            className={`text-xl font-semibold ${themeClasses.text} capitalize`}
            key={activeTab}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab.replace("-", " ")}
          </motion.h1>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <FiSun className="text-yellow-300" />
              ) : (
                <FiMoon className="text-indigo-700" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08, backgroundColor: 'rgba(255, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              onClick={() => setShowLogoutConfirmation(true)}
              className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg"
            >
              <FiLogOut className="animate-fade-in" />
              <span>Logout</span>
            </motion.button>
          </div>
        </motion.header>

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
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 16 }}
              className={`${themeClasses.modal} rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-full bg-red-100 animate-pulse-slow">
                  <FiLogOut className="text-red-500 text-xl" />
                </div>
                <h3 className={`text-xl font-semibold ${themeClasses.modalText}`}>Confirm Logout</h3>
              </div>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to log out?
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
                  onClick={() => setShowLogoutConfirmation(false)}
                  className={`px-4 py-2 ${themeClasses.button} rounded-lg transition-all shadow-sm ${
                    darkMode ? 'text-gray-100' : 'text-gray-700'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 130, damping: 17 }}
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
    </div>
    <TailwindAnimations /> {/* Render the TailwindAnimations component */}
  </>
);
};

// Define some simple keyframe animations with Tailwind CSS in JS
const TailwindAnimations = () => (
<style jsx global>{`
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes wiggle {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(5deg); }
    50% { transform: rotate(0deg); }
    75% { transform: rotate(-5deg); }
    100% { transform: rotate(0deg); }
  }
  @keyframes slide-in-left {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fade-in-down {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-spin-slow { animation: spin-slow 3s linear infinite; }
  .animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
  .animate-slide-in-left { animation: slide-in-left 0.5s ease-out; }
  .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
  .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-fade-in { animation: fade-in 0.3s ease-out; }
  .animate-fade-in-down { animation: fade-in-down 0.4s ease-out; }
`}</style>
);


export const getDashboard = async (id) => {
  const response = await fetch(`${BaseUrluser}/dashboard/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return await response.json();
};

export const fetchExcelFiles = async () => {
  const response = await fetch(`${BaseUrluser}/excel/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return await response.json();
};

export default Dashboard;
