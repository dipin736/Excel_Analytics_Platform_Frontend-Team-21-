import React from "react";
import { useAuth } from "../../Context/AuthContext.";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
console.log(user.role)
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading user data...</p> {/* Show a loading message or spinner */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Dashboard</h1>

          <div className="flex items-center gap-4">
            <p className="text-sm">Welcome, <span className="font-medium">{user?.name}</span> 👋</p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <p className="text-gray-700 text-lg">This is your dashboard area.</p>
      </main>
    </div>
  );
};

export default Dashboard;
