import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { Lock, BarChart3, Eye, EyeOff } from "lucide-react";
import { BaseUrl } from "../endpoint/baseurl";
import { useAuth } from "../Context/AuthContext.jsx";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // Use the legacy token-based endpoint
      const response = await axios.put(`${BaseUrl}reset-password/${token}`, {
        password: formData.password,
      });
      
      if (response.data.success) {
        toast.success("Password has been reset successfully! Logging you in...");
        
        // Auto-login after successful reset if token is provided
        if (response.data.token && response.data.user) {
          const { token: authToken, user } = response.data;
          localStorage.setItem("token", authToken);
          localStorage.setItem("role", user.role);
          setToken(authToken);
          setUser(user);
          
          setTimeout(() => {
            if (user.role === "admin") {
              navigate("/admin/dashboard");
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        } else {
          // Fallback to login page if no auto-login
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to reset password";
      if (error.response?.status === 400 && errorMessage.includes("expired")) {
        toast.error("Reset link has expired. Please request a new password reset.");
        setTimeout(() => {
          navigate("/forgot-password");
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-400/20">
                <BarChart3 className="h-6 w-6 text-teal-400 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                Create New Password
              </h1>
            </div>
            <p className="mt-2 text-center text-gray-300">
              Enter your new password below
            </p>
            
            {/* Security notice */}
            <div className="mt-3 p-2 bg-teal-500/10 border border-teal-400/20 rounded-lg">
              <p className="text-xs text-teal-300 text-center">
                🔒 Secure password reset via email link
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition-colors"
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition-colors"
                  >
                    {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="space-y-1">
                <div className="flex space-x-1">
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 6 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(formData.password) ? 'bg-teal-500' : 'bg-gray-600'}`} />
                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(formData.password) ? 'bg-teal-500' : 'bg-gray-600'}`} />
                </div>
                <p className="text-xs text-gray-400">
                  Password strength: {
                    formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) 
                      ? 'Strong' 
                      : formData.password.length >= 6 
                        ? 'Medium' 
                        : 'Weak'
                  }
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Reset Password & Login"
                )}
              </button>

              <div className="text-center text-sm text-gray-400">
                Need a new reset link?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-medium text-teal-500 hover:text-teal-400"
                >
                  Request new reset
                </button>
              </div>

              <div className="text-center text-sm text-gray-400">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-medium text-teal-500 hover:text-teal-400"
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
