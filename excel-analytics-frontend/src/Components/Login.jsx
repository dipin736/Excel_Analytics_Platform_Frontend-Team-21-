import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff, User, Mail, Lock, Shield, BarChart3 } from "lucide-react"
import { BaseUrl } from "../endpoint/baseurl"
import bgImage from "../assets/Registerfrom_Bg.jpg"
import { useAuth } from "../Context/AuthContext."
import { toast } from "react-toastify"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { setToken, setUser } = useAuth();

  const validateForm = () => {
    const newErrors = {}
    
    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      })
    }
  }

  const handleRoleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submitting
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }
    
    setIsLoading(true)

    try {
      const res = await axios.post(`${BaseUrl}login/`, formData)
      const role = res.data?.user?.role;
      const token = res.data?.token;
      
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      setToken(token);
      setUser(res.data.user); 
      
      toast.success("Login successful!")
      
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Invalid email or password")
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error("An error occurred during login")
      }
      console.error("Login Failed:", error.response?.data || error)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 animate-gradient-shift" />

      {/* Floating analytics cards in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg"
            style={{
              width: `${Math.random() * 200 + 100}px`,
              height: `${Math.random() * 120 + 80}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite ${Math.random() * 5}s`,  // All in one line
            }}
            
          >
            <div className="p-2">
              <div className="h-full bg-gradient-to-br from-white/10 to-white/5 rounded-lg overflow-hidden">
                {/* Mini chart animation */}
                <div className="h-full w-full relative">
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-400/50 animate-pulse" />
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="absolute bottom-0 bg-teal-400/30"
                      style={{
                        left: `${j * 20 + 10}%`,
                        width: "12%",
                        height: `${Math.random() * 80 + 20}%`,
                        animation: `grow ${Math.random() * 3 + 2}s ease-in-out alternate infinite ${j * 0.2}s`,  // All in one line
                      }}
                      
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main login card with analytics preview */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
          {/* Glowing header */}
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-400/20">
                <BarChart3 className="h-6 w-6 text-teal-400 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                Excel Analytics Pro
              </h1>
            </div>
            <p className="mt-2 text-center text-gray-300">
              Login to unlock powerful insights
            </p>

            {/* Floating active users indicator */}
            <div className="absolute top-4 right-4 flex items-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500" />
              </span>
              <span className="ml-1 text-xs text-gray-400">
                <span className="font-medium text-lime-400">24</span> active
              </span>
            </div>
          </div>

          {/* Analytics preview section */}
          <div className="p-4 bg-gray-800/50 border-b border-gray-700/30">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-300">
                Sample Dashboard
              </h3>
              <div className="text-xs text-teal-400 animate-pulse-slow">
                Live Preview
              </div>
            </div>

            {/* Mini dashboard animation */}
            <div className="bg-gray-900/50 rounded-lg p-2 h-32 overflow-hidden relative">
              {/* Animated chart */}
              <div className="absolute bottom-0 left-0 right-0 h-full flex items-end space-x-1 px-2">
                {["40%", "55%", "70%", "90%", "75%", "60%", "85%"].map(
                  (height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-sm"
                      style={{
                        height,
                        animation: `chartGrow ${
                          i * 0.2 + 1
                        }s infinite alternate ease-in-out`,
                      }}
                    />
                  )
                )}
              </div>

              {/* Moving trend line */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-teal-400/30">
                <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-teal-400/70 to-transparent animate-trend-line" />
              </div>

              {/* Floating metrics */}
              <div className="absolute top-2 left-2 bg-gray-800/80 border border-gray-700/30 rounded px-2 py-1 text-xs text-white shadow-sm animate-float-slow">
                <div className="text-teal-400 font-medium">↑ 15%</div>
                <div className="text-gray-300">This month</div>
              </div>
            </div>
          </div>

          {/* Login form */}
          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Password
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
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-400 transition-colors"
                  >
                    {passwordVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded bg-gray-900/50 border-gray-700 text-teal-500 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-300"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="/forgot-password"
                  className="text-sm text-teal-500 hover:text-teal-400"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 hover:shadow-teal-500/30"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  "Sign in"
                )}
              </button>
            </form>

            <div className="text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link to='/register'
                className="font-medium text-teal-500 hover:text-teal-400"
              >
              Get started
                </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }
        @keyframes chartGrow {
          from {
            height: 0;
            opacity: 0.5;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes trend-line {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100vw);
          }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default Login
