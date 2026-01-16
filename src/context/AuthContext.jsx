import { createContext, useContext, useState } from "react";
import { login as loginApi } from "../api/taskApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (username) => {
    setLoading(true);
    try {
      const userData = await loginApi(username);
      setUser(userData);
      console.log("User data after login:", userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
