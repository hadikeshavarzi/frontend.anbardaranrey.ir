import React from "react";
import { Navigate } from "react-router-dom";

/* Dashboard */
import Dashboard from "../pages/Dashboard";

/* Inventory (انبار و کالا) */
import UnitList from "../pages/Inventory/UnitList";
import AddUnit from "../pages/Inventory/AddUnit";
import EditUnit from "../pages/Inventory/EditUnit";

import CategoryList from "../pages/Inventory/CategoryList";
import AddCategory from "../pages/Inventory/AddCategory";
import EditCategory from "../pages/Inventory/EditCategory";

import ProductList from "../pages/Inventory/ProductList";
import AddProduct from "../pages/Inventory/AddProduct";
import EditProduct from "../pages/Inventory/EditProduct";

/* Members (اعضا) */
import MemberList from "../pages/Members/MemberList";
import AddMember from "../pages/Members/AddMember";
import EditMember from "../pages/Members/EditMember";

/* Customers (مشتریان) */
import CustomerList from "../pages/Customers/CustomerList";
import AddCustomer from "../pages/Customers/AddCustomer";
import EditCustomer from "../pages/Customers/EditCustomer";

/* Receipt (رسید کالا) */
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

/* Exit (خروج و باسکول) */
import ExitList from "../pages/Exit/ExitList";
import ExitCreate from "../pages/Exit/ExitCreate";
import ExitPrint from "../components/Prints/ExitPrint";

/* ✅ Accounting (حسابداری عمومی) */
import AccountingList from "../pages/Accounting/AccountingList";
import AccountingCoding from "../pages/Accounting/AccountingCoding";
import AccountingCreate from "../pages/Accounting/AccountingCreate";

/* ✅ Accounting Reports (گزارشات مالی - جدید) */
import JournalReport from "../pages/Accounting/Reports/JournalReport";
import CustomerBalance from "../pages/Accounting/Reports/CustomerBalance";
import AccountLedger from "../pages/Accounting/Reports/AccountLedger";
import ComprehensiveLedger from "../pages/Accounting/Reports/ComprehensiveLedger";
//اجاره
import WarehouseRentCreate from "../pages/WarehouseRent/WarehouseRentCreate";
import WarehouseRentList from "../pages/WarehouseRent/WarehouseRentList";

/* ✅ Treasury (خزانه‌داری - ماژول جدید) */
import TreasuryForm from "../pages/Accounting/TreasuryForm";
import CheckOperations from "../pages/Accounting/CheckOperations";
import TreasuryList from "../pages/Accounting/TreasuryList";
import TreasuryDefinitions from "../pages/Accounting/TreasuryDefinitions";

/* Authentication */
import Login from "../pages/Authentication/Login";
import Register from "../pages/Authentication/Register";
import Logout from "../pages/Authentication/Logout";

// ===============================================
// 🔒 Protected Routes (نیاز به لاگین)
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

  /* Receipt Routes */
  { path: "/receipts", component: <ReceiptsList /> },
  { path: "/receipt/form", component: <ReceiptForm mode="create" /> },
  { path: "/receipt/form/edit/:id", component: <ReceiptForm mode="edit" /> },
  { path: "/receipt/view/:id", component: <ReceiptForm mode="view" /> },
  { path: "/receipt/list", component: <Navigate to="/receipts" /> },

  /* Clearance Routes */
  { path: "/clearances/form", component: <Clearancesform /> },
  { path: "/clearances/report", component: <ClearanceReport /> },
  { path: "/clearances/edit/:id", component: <ClearanceEdit /> },

  /* Loading Routes */
  { path: "/loading/create", component: <LoadingOrderForm /> },
  { path: "/loading/list", component: <LoadingList /> },
  { path: "/loading/print/:id", component: <LoadingPrint /> },

  /* Exit Routes */
  { path: "/exit/list", component: <ExitList /> },
  { path: "/exit/create", component: <ExitCreate /> },
  { path: "/exit/print/:id", component: <ExitPrint /> },

  /* ======================================================== */
  /* ✅ Accounting Routes (حسابداری عمومی)                     */
  /* ======================================================== */
  { path: "/accounting/documents", component: <AccountingList /> }, // لیست کل اسناد حسابداری
  { path: "/accounting/coding", component: <AccountingCoding /> },
  { path: "/accounting/new", component: <AccountingCreate /> },
  { path: "/accounting/edit/:id", component: <AccountingCreate /> },

  /* ======================================================== */
  /* ✅ Reports Routes (گزارشات مالی)                          */
  /* ======================================================== */
  { path: "/accounting/reports/journal", component: <JournalReport /> },
  { path: "/accounting/reports/customers", component: <CustomerBalance /> },
  { path: "/accounting/reports/ledger", component: <AccountLedger /> },
  { path: "/accounting/reports/comprehensive", component: <ComprehensiveLedger /> },
    
  /* ======================================================== */
  /* ✅ Treasury Routes (خزانه‌داری - ماژول جدید)              */
  /* ======================================================== */

  // 1. لیست اسناد دریافت و پرداخت
  { path: "/accounting/list", component: <TreasuryList /> },

  // 2. فرم ثبت دریافت و پرداخت
  { path: "/accounting/treasury-form", component: <TreasuryForm /> },

  // 3. کارتابل چک
  { path: "/accounting/check-operations", component: <CheckOperations /> },

  // 4. تعاریف پایه (بانک و صندوق)
  { path: "/accounting/definitions", component: <TreasuryDefinitions /> },
// اجاره
  { path: "/rent/create", component: <WarehouseRentCreate /> },
  { path: "/rent/list", component: <WarehouseRentList /> },

  /* Default Redirect */
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

// ===============================================
// 🔓 Public Routes (عمومی)
// ===============================================
const publicRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/register", component: <Register /> },
  { path: "/logout", component: <Logout /> },
];

export { authProtectedRoutes, publicRoutes };