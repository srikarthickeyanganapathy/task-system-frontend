import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi } from "../api/taskApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start true to check storage first

  // ✨ Check localStorage on load
  useEffect(() => {
    const storedUser = localStorage.getItem("taskflow_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username) => {
    setLoading(true);
    try {
      const userData = await loginApi(username);
      setUser(userData);
      // ✨ Save to localStorage
      localStorage.setItem("taskflow_user", JSON.stringify(userData));
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // ✨ Clear from localStorage
    localStorage.removeItem("taskflow_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);