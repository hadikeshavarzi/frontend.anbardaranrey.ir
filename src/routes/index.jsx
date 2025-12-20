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
import ReceiptsList from "../pages/Receipt/ReceiptsList";

/* Clearance (ترخیص) */
import Clearancesform from "../pages/Clearance/ClearanceForm";
import ClearanceReport from "../pages/Clearance/ClearanceReport";
import ClearanceEdit from "../pages/Clearance/ClearanceEdit";

/* Loading (بارگیری) */
import LoadingOrderForm from "../pages/Loading/LoadingOrderForm";
import LoadingList from "../pages/Loading/LoadingList";
import LoadingPrint from "../pages/Loading/LoadingPrint";

/* ✅ Exit (خروج و باسکول - جدید) */
import ExitList from "../pages/Exit/ExitList"; // <--- اضافه شد
import ExitCreate from "../pages/Exit/ExitCreate";
import ExitPrint from "../components/Prints/ExitPrint";

/* Authentication */
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

  /* ================= Receipt Routes ================= */
  { path: "/receipts", component: <ReceiptsList /> },
  { path: "/receipt/form", component: <ReceiptForm mode="create" /> },
  { path: "/receipt/form/edit/:id", component: <ReceiptForm mode="edit" /> },
  { path: "/receipt/view/:id", component: <ReceiptForm mode="view" /> },
  { path: "/receipt/list", component: <Navigate to="/receipts" /> },

  /* ================= Clearance Routes (ترخیص) ================= */
  { path: "/clearances/form", component: <Clearancesform /> },
  { path: "/clearances/report", component: <ClearanceReport /> },
  { path: "/clearances/edit/:id", component: <ClearanceEdit /> },

  /* ================= Loading Routes (بارگیری) ================= */
  { path: "/loading/create", component: <LoadingOrderForm /> },
  { path: "/loading/list", component: <LoadingList /> },
  { path: "/loading/print/:id", component: <LoadingPrint /> },

  /* ================= ✅ Exit Routes (خروج و باسکول) ================= */
  { path: "/exit/list", component: <ExitList /> }, // <--- مسیر لیست اضافه شد
  { path: "/exit/create", component: <ExitCreate /> },
  { path: "/exit/print/:id", component: <ExitPrint /> },

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
