import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BaseUrl } from "../endpoint/baseurl";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${BaseUrl}me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      // If we get a 401, clear the invalid token
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setToken(null);
      }
      console.error("Error fetching current user:", err);
    } finally {
      setLoading(false);
    }
  };
  

  // Run fetchCurrentUser when token changes
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setUser(null); 
      setLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
