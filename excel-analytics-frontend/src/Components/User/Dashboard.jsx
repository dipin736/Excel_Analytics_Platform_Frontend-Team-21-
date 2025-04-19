import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext.";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
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

  // Welcome notification on mount
  useEffect(() => {
    if (user && user.name) {
      toast.success(`Welcome back, ${user.name}!`);
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Logout confirmation dialog */}
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

      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Dashboard</h1>

          <div className="flex items-center gap-4">
            <p className="text-sm">Welcome, <span className="font-medium">{user?.name}</span> 👋</p>
            <button
              onClick={showLogoutDialog}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Your Dashboard</h2>
          <p className="text-gray-700">This is your personalized dashboard area where you can manage your Excel analytics.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
