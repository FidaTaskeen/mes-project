import { createContext, useContext, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
  // TEMPORARY TEST MODE — remove once backend login works
  return { name: "Test Admin", userType: "Admin" };

  // const saved = localStorage.getItem("mes_user");
  // return saved ? JSON.parse(saved) : null;
});

  const login = async (email, password) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    const { token, user } = res.data;

    localStorage.setItem("mes_token", token);
    localStorage.setItem("mes_user", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("mes_token");
    localStorage.removeItem("mes_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}