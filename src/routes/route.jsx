import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const Authmiddleware = (props) => {
  const location = useLocation();

  // ✅ اصلاح: چک کردن کلیدهایی که در Login.jsx ذخیره کردیم
  const user = localStorage.getItem("user");
  const authUser = localStorage.getItem("authUser");
  const token = localStorage.getItem("token"); // جهت اطمینان این را هم نگه می‌داریم

  // اگر هیچ‌کدام از این‌ها نبود، یعنی کاربر لاگین نیست
  if (!user && !authUser && !token) {
    return (
        <Navigate to={{ pathname: "/login", state: { from: location } }} />
    );
  }

  // اگر بود، اجازه ورود بده
  return <>{props.children}</>;
};

export default Authmiddleware;