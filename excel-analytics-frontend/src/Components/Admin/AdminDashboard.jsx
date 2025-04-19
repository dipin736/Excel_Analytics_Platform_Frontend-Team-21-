import React from "react";
import { useAuth } from "../../Context/AuthContext.";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

          <div className="flex items-center gap-4">
            <p className="text-sm">Welcome, <span className="font-medium">{user?.name || "Loading..."}</span> 👋</p>
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
        <p className="text-gray-700 text-lg">This is your Admin dashboard area.</p>
      </main>
    </div>
  );
};

export default AdminDashboard;
