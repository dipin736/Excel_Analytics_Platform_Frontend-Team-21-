import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext.";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiHome,
  FiPieChart,
  FiFileText,
  FiUpload,
  FiLogOut,
  FiUser,
  FiX,
  FiBarChart2,
} from "react-icons/fi";
import { BaseUrluser } from "../../endpoint/baseurl";
import ExcelFileList from "./ExcelFileList";
import ExcelUploader from "./ExcelUploader";
import DashboardList from "./DashboardList";
import DashboardView from "./DashboardView";

const NavButton = ({ children, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active
        ? "bg-indigo-600 text-white shadow-md"
        : "text-indigo-200 hover:bg-indigo-800"
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{children}</span>
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
        return <DashboardView stats={userStats} />;
      case "dashboards":
        return <DashboardList dashboards={dashboards}
        setDashboards={setDashboards}
        />;
      case "excel":
        return <ExcelFileList files={excelFiles} setActiveTab={setActiveTab} />;
      case "upload":
        return <ExcelUploader />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white p-5 flex flex-col">
        <div className="mb-10">
          <h1 className="text-2xl font-bold flex items-center">
            <FiPieChart className="mr-2" /> DataViz
          </h1>
          <p className="text-indigo-200 text-sm">Analytics Dashboard</p>
        </div>

        <nav className="space-y-1 flex-1">
          <NavButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={<FiHome />}
          >
            Overview
          </NavButton>
          <NavButton
            active={activeTab === "dashboards"}
            onClick={() => setActiveTab("dashboards")}
            icon={<FiPieChart />}
          >
            My Dashboards
          </NavButton>
          <NavButton
            active={activeTab === "excel"}
            onClick={() => setActiveTab("excel")}
            icon={<FiFileText />}
          >
            Excel Files
          </NavButton>
          <NavButton
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
            icon={<FiUpload />}
          >
            Upload File
          </NavButton>
        </nav>

        <div className="mt-auto pt-4 border-t border-indigo-600">
          {userStats && (
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-indigo-800">
              <div className="bg-indigo-600 p-2 rounded-full">
                <FiUser className="text-white" />
              </div>
              <div>
                <p className="font-medium">{userStats.user?.name || "User"}</p>
                <p className="text-xs text-indigo-300">
                  {Math.round((userStats.user?.storagePercentage || 0) * 100)}%
                  storage used
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {activeTab.replace("-", " ")}
          </h1>
          <button
              onClick={showLogoutDialog}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <FiLogOut /> <span>Logout</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {renderContent()}
        </main>
      </div>
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h3 className="text-xl font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};



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
