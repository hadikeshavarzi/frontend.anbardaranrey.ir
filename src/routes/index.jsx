import React from "react";
import { Navigate } from "react-router-dom";

/* Dashboard */
import Dashboard from "../pages/Dashboard";

/* Inventory */
import UnitList from "../pages/Inventory/UnitList";
import AddUnit from "../pages/Inventory/AddUnit";
import EditUnit from "../pages/Inventory/EditUnit";

import CategoryList from "../pages/Inventory/CategoryList";
import AddCategory from "../pages/Inventory/AddCategory";
import EditCategory from "../pages/Inventory/EditCategory";

import ProductList from "../pages/Inventory/ProductList";
import AddProduct from "../pages/Inventory/AddProduct";
import EditProduct from "../pages/Inventory/EditProduct";

/* Members */
import MemberList from "../pages/Members/MemberList";
import AddMember from "../pages/Members/AddMember";
import EditMember from "../pages/Members/EditMember";

/* Customers */
import CustomerList from "../pages/Customers/CustomerList";
import AddCustomer from "../pages/Customers/AddCustomer";
import EditCustomer from "../pages/Customers/EditCustomer";

/* Receipt */
import ReceiptForm from "../pages/Receipt/ReceiptForm";

// ✅ اصلاح شد: نام فایل احتمالا ReceiptsList.jsx است (با s)
// همچنین متغیر را ReceiptsList نامیدیم تا با پایین کد هماهنگ باشد
import ReceiptsList from "../pages/Receipt/ReceiptsList"; 

/* Clearance */
import Clearancesform from "../pages/Clearance/ClearanceForm";  


/* Auth */
import Login from "../pages/Authentication/Login";
import Register from "../pages/Authentication/Register";
import Logout from "../pages/Authentication/Logout";

// ===============================================
// 🔒 Protected Routes
// ===============================================
const authProtectedRoutes = [
  /* Dashboard */
  { path: "/dashboard", component: <Dashboard /> },

  /* Members */
  { path: "/members/list", component: <MemberList /> },
  { path: "/members/add", component: <AddMember /> },
  { path: "/members/edit/:id", component: <EditMember /> },

  /* Customers */
  { path: "/customers/list", component: <CustomerList /> },
  { path: "/customers/add", component: <AddCustomer /> },
  { path: "/customers/edit/:id", component: <EditCustomer /> },

  /* Inventory */
  { path: "/inventory/unit-list", component: <UnitList /> },
  { path: "/inventory/add-unit", component: <AddUnit /> },
  { path: "/inventory/edit-unit/:id", component: <EditUnit /> },

  { path: "/inventory/category-list", component: <CategoryList /> },
  { path: "/inventory/add-category", component: <AddCategory /> },
  { path: "/inventory/edit-category/:id", component: <EditCategory /> },

  { path: "/inventory/product-list", component: <ProductList /> },
  { path: "/inventory/add-product", component: <AddProduct /> },
  { path: "/inventory/edit-product/:id", component: <EditProduct /> },

  /* ================= Receipt Routes (Fixed) ================= */
  
  // 1. لیست اصلی رسیدها
  // ✅ الان کامپوننت ReceiptsList از ایمپورت بالا خوانده می‌شود
  { path: "/receipts", component: <ReceiptsList /> },

  // 2. ثبت رسید جدید
  { path: "/receipt/form", component: <ReceiptForm mode="create" /> },

  // 3. ویرایش رسید
  { path: "/receipt/form/edit/:id", component: <ReceiptForm mode="edit" /> },

  // 4. مشاهده رسید (فقط خواندنی)
  { path: "/receipt/view/:id", component: <ReceiptForm mode="view" /> },

  // * ریدایرکت لینک قدیمی به جدید
  { path: "/receipt/list", component: <Navigate to="/receipts" /> },
  /* ========================================================== */

  /* Clearance */
  { path: "/clearances/form", component: <Clearancesform /> },

  /* Default Redirect */
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

// ===============================================
// 🔓 Public Routes
// ===============================================
const publicRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/register", component: <Register /> },
  { path: "/logout", component: <Logout /> },
];

export { authProtectedRoutes, publicRoutes };