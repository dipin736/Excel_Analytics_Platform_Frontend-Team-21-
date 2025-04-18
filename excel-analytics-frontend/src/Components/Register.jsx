import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff, User, Mail, Lock, Shield, BarChart3 } from "lucide-react"
import { BaseUrl } from "../endpoint/baseurl"
import bgImage from "../assets/Registerfrom_Bg.jpg"

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      role: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await axios.post(`${BaseUrl}register/`, formData)
      console.log("Registration successful:", res.data)
      navigate("/login")
    } catch (error) {
      console.error("Registration Failed:", error.response?.data || error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Full-width background image without blur */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}
      />

      {/* Optional: Grid/overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:50px_50px] opacity-10" />

      {/* Removed white blur overlay here */}

      <div className="container relative z-10 px-4 py-10 mx-auto">
        <div className="w-full max-w-sm mx-auto bg-black/70 border border-white/20 rounded-lg shadow-2xl backdrop-blur-sm">
          <div className="p-6 space-y-1 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="p-2 rounded-full bg-cyan-500/20 backdrop-blur-md">
                <BarChart3 className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Excel Analytics Pro
              </h2>
            </div>
            <h2 className="text-xl font-bold text-white">Create Your Account</h2>
            <p className="text-slate-300">Transform your Excel data into powerful insights</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-10 py-2 bg-black/60 border border-slate-500 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-10 py-2 bg-black/60 border border-slate-500 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4" />
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-black/60 border border-slate-500 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-white">
                  Account Type
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 h-4 w-4 z-10" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleRoleChange}
                    className="w-full pl-10 py-2 bg-black/60 border border-slate-500 rounded-md text-white appearance-none focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="user" className="bg-black text-white">User</option>
                    <option value="admin" className="bg-black text-white">Admin</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 space-y-4">
          <button
  onClick={handleSubmit}
  disabled={isLoading}
  className="relative px-8 py-3 bg-black text-white font-semibold rounded-lg border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:shadow-[0_0_20px_10px_rgba(168,85,247,0.6)] active:scale-95 active:shadow-[0_0_10px_5px_rgba(168,85,247,0.4)] group"
>
  <span className="flex items-center space-x-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors duration-300"
    >
      <path d="M5 13l4 4L19 7" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    <span>{isLoading ? "Creating Account..." : "Get Started"}</span>
  </span>
  <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-purple-500/20 to-indigo-500/20" />
</button>

            <p className="text-center text-sm text-slate-300">
              Already have an account?{" "}
              <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
