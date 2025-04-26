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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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

          <Route exact path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/register" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
