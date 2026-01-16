import { createContext, useContext, useState, useEffect } from "react";
import { login as loginApi } from "../api/taskApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Parse JWT payload safely
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const rawRole = decoded.roles ? decoded.roles.split('.')[0] : "ROLE_EMPLOYEE";
      
      return {
        username: decoded.sub,
        role: { name: rawRole.replace("ROLE_", "") }
      };
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      const userData = decodeToken(token);
      userData ? setUser(userData) : localStorage.removeItem("jwt_token");
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const token = await loginApi(username, password);
      localStorage.setItem("jwt_token", token);
      setUser(decodeToken(token));
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("jwt_token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);