// src/context/AuthContext.jsx

import { createContext, useEffect, useState } from "react";
import { getMe } from "../services/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ✅ اصلاح: باید authToken باشه
    const token = localStorage.getItem("authToken");  // ✅ تغییر نام

    if (!token) {
      console.log("⚠️ No token found");
      return;
    }

    console.log("🔍 Loading user with token...");

    getMe()
        .then(res => {
          if (res.user) {
            setUser(res.user);
            console.log("✅ User loaded:", res.user.full_name);
          } else {
            setUser(null);
            console.log("❌ No user in response");
          }
        })
        .catch(err => {
          console.error("❌ GetMe Error:", err);
          setUser(null);
        });
  }, []);

  return (
      <AuthContext.Provider value={{ user, setUser }}>
        {children}
      </AuthContext.Provider>
  );
}