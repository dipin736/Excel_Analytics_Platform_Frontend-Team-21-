import React, { useState } from "react";
import axios from "axios";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { BaseUrl } from "../endpoint/baseurl";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", 
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await axios.post(`${BaseUrl}register/`, formData);
      console.log("Registration successful:", res.data);
      navigate("/login");
    } catch (error) {
      // Log the entire error object to the console
      console.error("Registration Failed:", error.response?.data || error);
    }
  };
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6">
  <form
    onSubmit={handleSubmit}
    className="w-full max-w-lg bg-white p-10 rounded-xl shadow-lg"
  >
    <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Create Your Account</h2>

    {/* Name */}
    <div className="mb-6">
      <label htmlFor="name" className="block text-lg font-medium mb-2 text-gray-700">
        Full Name
      </label>
      <input
        type="text"
        name="name"
        id="name"
        className="w-full border border-gray-300 px-5 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.name}
        onChange={handleChange}
        required
      />
    </div>

    {/* Email */}
    <div className="mb-6">
      <label htmlFor="email" className="block text-lg font-medium mb-2 text-gray-700">
        Email Address
      </label>
      <input
        type="email"
        name="email"
        id="email"
        className="w-full border border-gray-300 px-5 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.email}
        onChange={handleChange}
        required
      />
    </div>

    {/* Password */}
    <div className="mb-6 relative">
      <label htmlFor="password" className="block text-lg font-medium mb-2 text-gray-700">
        Password
      </label>
      <input
        type={passwordVisible ? "text" : "password"}
        name="password"
        id="password"
        className="w-full border border-gray-300 px-5 py-3 rounded-lg text-lg pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button
        type="button"
        onClick={() => setPasswordVisible((prev) => !prev)}
        className="absolute right-4 top-12 text-gray-600 text-xl"
      >
        {passwordVisible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>

    {/* Role */}
    <div className="mb-6">
      <label htmlFor="role" className="block text-lg font-medium mb-2 text-gray-700">
        Role
      </label>
      <select
        name="role"
        id="role"
        className="w-full border border-gray-300 px-5 py-3 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={formData.role}
        onChange={handleChange}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    {/* Submit */}
    <button
      type="submit"
      className="w-full bg-blue-600 text-white text-lg py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
    >
      Sign Up
    </button>

    <p className="text-center text-sm text-gray-600 mt-6">
      Already have an account?{" "}
      <a href="/login" className="text-blue-600 font-medium hover:underline">
        Login here
      </a>
    </p>
  </form>
</div>


  );
};

export default Register;
