import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Register from "./Components/Register";
import Login from "./Components/Login";
import Dashboard from "./Components/User/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./Components/Admin/AdminDashboard";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* General Users */}
          <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route exact path="/" element={<Navigate to="/register" />} />
          <Route path="*" element={<Navigate to="/register" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
