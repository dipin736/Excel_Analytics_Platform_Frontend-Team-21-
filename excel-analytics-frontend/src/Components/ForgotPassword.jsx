import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { Mail, BarChart3, Lock, Eye, EyeOff } from "lucide-react";
import { BaseUrl } from "../endpoint/baseurl";
import { useAuth } from "../Context/AuthContext.jsx";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification, 3: Password Reset
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [useOldSystem, setUseOldSystem] = useState(false);
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for OTP input - only allow digits and limit to 6 characters
    if (name === 'otp') {
      const cleanOTP = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: cleanOTP
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

        try {
      const response = await axios.post(`${BaseUrl}forgot-password`, { 
        email: formData.email 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
          // Check if the response indicates OTP was sent (new system)
          if (response.data.message && response.data.message.toLowerCase().includes('otp')) {
            toast.success("OTP sent to your email address");
            setOtpSent(true);
            setStep(2); // Move to OTP verification step
            setCountdown(120); // 2 minutes countdown
          } else {
            // Old system - redirect to email instructions
        toast.success("Password reset instructions have been sent to your email");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
          }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!formData.email || !formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    // Validate OTP
    if (!formData.otp || !formData.otp.trim()) {
      toast.error("OTP is required");
      return;
    }

    // Clean and validate OTP
    const cleanOTP = formData.otp.trim().replace(/\D/g, '');
    
    if (cleanOTP.length !== 6) {
      toast.error("OTP must be exactly 6 digits");
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    const finalEmail = formData.email.trim().toLowerCase();
    const finalOTP = parseInt(cleanOTP, 10); // Convert string to number

    setIsLoading(true);

    try {
      const requestPayload = {
        email: finalEmail,
        otp: finalOTP  // Send as number instead of string
      };
      
      // Try to verify OTP with backend
      const response = await axios.post(`${BaseUrl}verify-otp`, requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success("OTP verified successfully!");
        setOtpVerified(true);
        setStep(3);
      } else {
        toast.error(response.data.message || "OTP verification failed");
      }
      
    } catch (verifyError) {
      // Handle specific error cases
      if (verifyError.response?.status === 404) {
        toast.success("OTP accepted, proceeding to password reset");
        setOtpVerified(true);
        setStep(3);
      } else if (verifyError.response?.status === 400) {
        // Handle validation errors from backend
        if (verifyError.response?.data?.errors) {
          const errorMessages = verifyError.response.data.errors.map(err => err.msg || err.message).join(', ');
          toast.error(`Validation errors: ${errorMessages}`);
        } else if (verifyError.response?.data?.error) {
          toast.error(verifyError.response.data.error);
        } else if (verifyError.response?.data?.message) {
          toast.error(verifyError.response.data.message);
        } else {
          toast.error("Invalid or expired OTP");
        }
      } else if (verifyError.response?.status === 401) {
        toast.error("OTP has expired or is invalid. Please request a new one.");
      } else if (verifyError.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        const errorMessage = verifyError.response?.data?.error || verifyError.response?.data?.message || "OTP verification failed";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (step === 2) {
      // This is OTP verification step
      return handleVerifyOTP(e);
    }
    
    // This is password reset step (step 3)
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
      // Reset password with verified OTP
      const otpAsNumber = parseInt(formData.otp.replace(/\D/g, ''), 10);
      
      const response = await axios.post(`${BaseUrl}reset-password-with-otp`, {
        email: formData.email,
        otp: otpAsNumber,  // Send as number instead of string
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.data.success) {
        toast.success("Password reset successful! Logging you in...");
        
        // Auto-login after successful reset
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", user.role);
        setToken(token);
        setUser(user);
        
        setTimeout(() => {
          if (user.role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 1500);
      }
    } catch (error) {
      // Check if it's a 404 (endpoint doesn't exist) or 400 (bad request)
      if (error.response?.status === 404) {
        toast.error("OTP-based password reset is not yet available. Please use the email link method.");
        setUseOldSystem(true);
        // Redirect back to step 1 or to login
        setStep(1);
        setOtpSent(false);
        setCountdown(0);
        return;
      }
      
      const errorMessage = error.response?.data?.message || "Failed to reset password";
      toast.error(errorMessage);
      
      // Show more detailed error for debugging
      if (error.response?.status === 400) {
        // Show specific validation errors if available
        if (error.response?.data?.errors) {
          const validationErrors = Object.values(error.response.data.errors).flat();
          toast.error(`Validation errors: ${validationErrors.join(', ')}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${BaseUrl}forgot-password`, { 
        email: formData.email 
      });
      
      if (response.data.success) {
        toast.success("New OTP sent to your email");
        setCountdown(120);
      }
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  const handleEmailBlur = () => {
    if (formData.email) {
      setFormData(prev => ({
        ...prev,
        email: prev.email.trim().toLowerCase()
      }));
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
                {step === 1 ? "Reset Password" : step === 2 ? "Enter OTP & Verify" : "Enter New Password"}
              </h1>
            </div>
            <p className="mt-2 text-center text-gray-300">
              {step === 1 
                ? (useOldSystem 
                    ? "Enter your email to receive reset instructions" 
                    : "Enter your email to receive a 6-digit OTP")
                : step === 2 ? "Check your email for the OTP and enter it here" : "Enter your new password"}
            </p>
            
            {useOldSystem && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                <p className="text-xs text-yellow-300 text-center">
                  ⚠️ Using legacy email link system
                </p>
              </div>
            )}
            
            {/* Progress indicator */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                <div className={`w-6 h-0.5 ${step >= 2 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                <div className={`w-6 h-0.5 ${step >= 3 ? 'bg-teal-500' : 'bg-gray-600'}`} />
                <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-teal-500' : 'bg-gray-600'}`} />
              </div>
            </div>
            
            {/* Step labels */}
            <div className="mt-2 flex justify-center">
              <div className="flex text-xs text-gray-400 space-x-8">
                <span className={step === 1 ? 'text-teal-400 font-medium' : ''}>Email</span>
                <span className={step === 2 ? 'text-teal-400 font-medium' : ''}>Verify</span>
                <span className={step === 3 ? 'text-teal-400 font-medium' : ''}>Reset</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                      required
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2 bg-gray-900/50 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
                                      ) : step === 2 ? (
               <form onSubmit={handleVerifyOTP} className="space-y-4">
                 {/* Email confirmation */}
                 <div className="p-3 bg-teal-500/10 border border-teal-400/20 rounded-lg">
                   <p className="text-sm text-teal-300 text-center">
                     📧 OTP sent to: <span className="font-medium">{formData.email}</span>
                   </p>
                 </div>

                 {/* OTP Input */}
                 <div className="space-y-2">
                   <label htmlFor="otp" className="block text-sm font-medium text-gray-300">
                     6-Digit OTP
                   </label>
                   <div className="relative">
                     <input
                       id="otp"
                       name="otp"
                       type="text"
                       maxLength="6"
                       value={formData.otp}
                       onChange={handleInputChange}
                       required
                       placeholder="123456"
                       pattern="[0-9]{6}"
                       inputMode="numeric"
                       autoComplete="one-time-code"
                       className={`w-full px-3 py-2 bg-gray-900/50 border rounded-md text-white text-center text-lg tracking-widest placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                         formData.otp.length === 6 
                           ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                           : 'border-gray-700 focus:ring-teal-500 focus:border-teal-500'
                       }`}
                     />
                   </div>
                   <div className="flex justify-between items-center mt-1">
                     <p className="text-xs text-gray-400">
                       Enter the 6-digit code sent to your email
                     </p>
                     <span className={`text-xs ${
                       formData.otp.length === 6 ? 'text-green-400' : 'text-gray-500'
                     }`}>
                       {formData.otp.length}/6
                     </span>
                   </div>
                   
                   {/* OTP Timer and Resend */}
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400">
                       {countdown > 0 ? `OTP expires in ${formatTime(countdown)}` : "OTP expired"}
                     </span>
                     <button
                       type="button"
                       onClick={handleResendOTP}
                       disabled={countdown > 0 || isLoading}
                       className="text-teal-500 hover:text-teal-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                     >
                       Resend OTP
                     </button>
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={isLoading || countdown === 0}
                   className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isLoading ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   ) : (
                     "Verify OTP"
                   )}
                 </button>

                 {/* Back button */}
                 <button
                   type="button"
                   onClick={() => {
                     setStep(1);
                     setOtpSent(false);
                     setCountdown(0);
                     setFormData(prev => ({ ...prev, otp: "", password: "", confirmPassword: "" }));
                   }}
                   className="w-full py-2 text-sm text-gray-400 hover:text-teal-400 transition-colors"
                 >
                   ← Back to email entry
                 </button>
               </form>
                          ) : (
               <form onSubmit={handleResetPassword} className="space-y-4">
                 {/* OTP Verified confirmation */}
                 <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
                   <p className="text-sm text-green-300 text-center">
                     ✅ OTP verified for: <span className="font-medium">{formData.email}</span>
                   </p>
                 </div>

                 {/* New Password */}
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
                      onChange={handleInputChange}
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
                </div>

                {/* Confirm Password */}
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
                      onChange={handleInputChange}
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

                <button
                  type="submit"
                  disabled={isLoading || countdown === 0}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300 hover:shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                                     ) : (
                     "Reset Password & Login"
                   )}
                </button>

                                 {/* Back button */}
                 <button
                   type="button"
                   onClick={() => {
                     setStep(2);
                     setOtpVerified(false);
                     setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
                   }}
                   className="w-full py-2 text-sm text-gray-400 hover:text-teal-400 transition-colors"
                 >
                   ← Back to OTP verification
                 </button>
              </form>
            )}

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


          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
