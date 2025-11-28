import React from "react";
import { Navigate } from "react-router-dom";

const Authmiddleware = (props) => {
  const token = localStorage.getItem("token");

  // اگر توکن نیست → برگرد لاگین
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{props.children}</>;
};

export default Authmiddleware;
