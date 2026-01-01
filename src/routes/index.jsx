import React from "react";
import { Navigate } from "react-router-dom";

/* Component for Route Protection */
// مطمئن شوید که این کامپوننت در مسیر ذکر شده وجود دارد
import PrivateRoute from "../components/Common/PrivateRoute";

/* Dashboard */
import Dashboard from "../pages/Dashboard";
import CustomerDashboard from "../pages/Dashboard/CustomerDashboard";

/* Inventory (انبار و کالا) */
import UnitList from "../pages/Inventory/UnitList";
import AddUnit from "../pages/Inventory/AddUnit";
import EditUnit from "../pages/Inventory/EditUnit"; // اگر هنوز نساختید، فعلا کامنت کنید

import CategoryList from "../pages/Inventory/CategoryList";
import AddCategory from "../pages/Inventory/AddCategory";
import EditCategory from "../pages/Inventory/EditCategory"; // اگر هنوز نساختید، فعلا کامنت کنید

import ProductList from "../pages/Inventory/ProductList";
import AddProduct from "../pages/Inventory/AddProduct";
import EditProduct from "../pages/Inventory/EditProduct"; // ✅ صفحه‌ای که تازه ساختیم

/* Members (اعضا و پرسنل) */
import MemberList from "../pages/Members/MemberList";
import AddMember from "../pages/Members/AddMember";
import EditMember from "../pages/Members/EditMember"; // ✅ صفحه‌ای که برای دسترسی‌ها ساختیم
import SystemUsersList from "../pages/Members/SystemUsersList";

/* Customers (مشتریان) */
import CustomerList from "../pages/Customers/CustomerList";
import AddCustomer from "../pages/Customers/AddCustomer";
import EditCustomer from "../pages/Customers/EditCustomer";

/* Receipt (رسید کالا - ورود) */
import ReceiptForm from "../pages/Receipt/ReceiptForm";
import ReceiptsList from "../pages/Receipt/ReceiptsList";

/* Clearance (ترخیص و مجوز خروج) */
import Clearancesform from "../pages/Clearance/ClearanceForm";
import ClearanceReport from "../pages/Clearance/ClearanceReport";
import ClearanceEdit from "../pages/Clearance/ClearanceEdit";

/* Loading (بارگیری) */
import LoadingOrderForm from "../pages/Loading/LoadingOrderForm";
import LoadingList from "../pages/Loading/LoadingList";
import LoadingPrint from "../pages/Loading/LoadingPrint";

/* Exit (خروج نهایی و باسکول) */
import ExitList from "../pages/Exit/ExitList";
import ExitCreate from "../pages/Exit/ExitCreate";
import ExitPrint from "../components/Prints/ExitPrint";

/* Accounting (حسابداری) */
import AccountingList from "../pages/Accounting/AccountingList";
import AccountingCoding from "../pages/Accounting/AccountingCoding";
import AccountingCreate from "../pages/Accounting/AccountingCreate";

/* Accounting Reports (گزارشات مالی) */
import JournalReport from "../pages/Accounting/Reports/JournalReport";
import CustomerBalance from "../pages/Accounting/Reports/CustomerBalance";
import AccountLedger from "../pages/Accounting/Reports/AccountLedger";
import ComprehensiveLedger from "../pages/Accounting/Reports/ComprehensiveLedger";

/* Warehouse Rent (قراردادهای اجاره) */
import WarehouseRentCreate from "../pages/WarehouseRent/WarehouseRentCreate";
import WarehouseRentList from "../pages/WarehouseRent/WarehouseRentList";

/* Treasury (خزانه‌داری) */
import TreasuryForm from "../pages/Accounting/TreasuryForm";
import CheckOperations from "../pages/Accounting/CheckOperations";
import TreasuryList from "../pages/Accounting/TreasuryList";
import TreasuryDefinitions from "../pages/Accounting/TreasuryDefinitions";

/* Authentication (احراز هویت) */
import Login from "../pages/Authentication/Login";
import Register from "../pages/Authentication/Register";
import Logout from "../pages/Authentication/Logout";
import UserProfile from "../pages/Authentication/user-profile"; // پروفایل کاربری (اختیاری)

// ===============================================
// 🧠 انتخابگر هوشمند داشبورد
// ===============================================
const DashboardSelector = () => {
  const userStr = localStorage.getItem("user");
  let isCustomer = false;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // اولویت با دیتابیس است (اگر نقش ادمین نباشد، مشتری است)
      if (user.member_details && user.member_details.role !== 'admin') {
        isCustomer = true;
      }
      // فال‌بک برای شماره موبایل (اگر دیتابیس سینک نبود)
      else {
        const adminMobile = "09121137675";
        let currentPhone = user.phone || "";
        if(currentPhone.startsWith('+98')) currentPhone = '0' + currentPhone.substring(3);
        else if(currentPhone.startsWith('98')) currentPhone = '0' + currentPhone.substring(2);

        if (currentPhone !== adminMobile) isCustomer = true;
      }
    } catch (e) { console.error(e); }
  }

  return isCustomer ? <CustomerDashboard /> : <Dashboard />;
};

// ===============================================
// 🔒 Protected Routes (مسیرهای حفاظت شده)
// ===============================================
const authProtectedRoutes = [

  /* --- داشبورد --- */
  { path: "/dashboard", component: <DashboardSelector /> },
  { path: "/profile", component: <UserProfile /> },

  /* --- مدیریت اعضا و دسترسی‌ها --- */
  { path: "/members/list", component: <PrivateRoute permission="member.view" component={<MemberList />} /> },
  { path: "/members/add", component: <PrivateRoute permission="member.create" component={<AddMember />} /> },
  // ✅ مسیر مهم برای ویرایش دسترسی‌ها:
  { path: "/members/edit/:id", component: <PrivateRoute permission="member.manage" component={<EditMember />} /> },

  // مخصوص کارفرما (مشتری حقوقی) برای مدیریت کارمندان خودش
  { path: "/system-users", component: <PrivateRoute permission="member.manage" component={<SystemUsersList />} /> },

  /* --- مشتریان --- */
  { path: "/customers/list", component: <PrivateRoute permission="customer.view" component={<CustomerList />} /> },
  { path: "/customers/add", component: <PrivateRoute permission="customer.create" component={<AddCustomer />} /> },
  { path: "/customers/edit/:id", component: <PrivateRoute permission="customer.edit" component={<EditCustomer />} /> },

  /* --- انبار: کالا، دسته، واحد --- */
  // واحدها
  { path: "/inventory/unit-list", component: <PrivateRoute permission="inventory.view" component={<UnitList />} /> },
  { path: "/inventory/add-unit", component: <PrivateRoute permission="inventory.create" component={<AddUnit />} /> },
  { path: "/inventory/edit-unit/:id", component: <PrivateRoute permission="inventory.create" component={<EditUnit />} /> },

  // دسته‌بندی‌ها
  { path: "/inventory/category-list", component: <PrivateRoute permission="inventory.view" component={<CategoryList />} /> },
  { path: "/inventory/add-category", component: <PrivateRoute permission="inventory.create" component={<AddCategory />} /> },
  { path: "/inventory/edit-category/:id", component: <PrivateRoute permission="inventory.create" component={<EditCategory />} /> },

  // محصولات (کالاها)
  { path: "/inventory/product-list", component: <PrivateRoute permission="inventory.view" component={<ProductList />} /> },
  { path: "/inventory/add-product", component: <PrivateRoute permission="inventory.create" component={<AddProduct />} /> },
  // ✅ مسیر مهم برای ویرایش کالا (که مشکل داشت):
  { path: "/inventory/edit-product/:id", component: <PrivateRoute permission="inventory.create" component={<EditProduct />} /> },

  /* --- عملیات انبار: رسید (ورود) --- */
  { path: "/receipts", component: <PrivateRoute permission="receipt.view" component={<ReceiptsList />} /> },
  { path: "/receipt/list", component: <Navigate to="/receipts" /> },
  { path: "/receipt/form", component: <PrivateRoute permission="receipt.create" component={<ReceiptForm mode="create" />} /> },
  { path: "/receipt/form/edit/:id", component: <PrivateRoute permission="receipt.edit" component={<ReceiptForm mode="edit" />} /> },
  { path: "/receipt/view/:id", component: <PrivateRoute permission="receipt.view" component={<ReceiptForm mode="view" />} /> },

  /* --- عملیات انبار: بارگیری --- */
  { path: "/loading/create", component: <PrivateRoute permission="loading.create" component={<LoadingOrderForm />} /> },
  { path: "/loading/list", component: <PrivateRoute permission="loading.view" component={<LoadingList />} /> },
  { path: "/loading/print/:id", component: <PrivateRoute permission="loading.view" component={<LoadingPrint />} /> },

  /* --- عملیات انبار: خروج و باسکول --- */
  { path: "/exit/list", component: <PrivateRoute permission="exit.view" component={<ExitList />} /> },
  { path: "/exit/create", component: <PrivateRoute permission="exit.create" component={<ExitCreate />} /> },
  { path: "/exit/print/:id", component: <PrivateRoute permission="exit.view" component={<ExitPrint />} /> },

  /* --- ترخیص کالا --- */
  { path: "/clearances/form", component: <PrivateRoute permission="clearance.create" component={<Clearancesform />} /> },
  { path: "/clearances/report", component: <PrivateRoute permission="clearance.view" component={<ClearanceReport />} /> },
  { path: "/clearances/edit/:id", component: <PrivateRoute permission="clearance.edit" component={<ClearanceEdit />} /> },

  /* --- حسابداری --- */
  { path: "/accounting/documents", component: <PrivateRoute permission="accounting.view" component={<AccountingList />} /> },
  { path: "/accounting/coding", component: <PrivateRoute permission="accounting.create" component={<AccountingCoding />} /> },
  { path: "/accounting/new", component: <PrivateRoute permission="accounting.create" component={<AccountingCreate />} /> },
  { path: "/accounting/edit/:id", component: <PrivateRoute permission="accounting.create" component={<AccountingCreate />} /> },

  /* --- گزارشات مالی --- */
  { path: "/accounting/reports/journal", component: <PrivateRoute permission="accounting.reports" component={<JournalReport />} /> },
  { path: "/accounting/reports/customers", component: <PrivateRoute permission="accounting.reports" component={<CustomerBalance />} /> },
  { path: "/accounting/reports/ledger", component: <PrivateRoute permission="accounting.reports" component={<AccountLedger />} /> },
  { path: "/accounting/reports/comprehensive", component: <PrivateRoute permission="accounting.reports" component={<ComprehensiveLedger />} /> },

  /* --- خزانه‌داری --- */
  { path: "/accounting/list", component: <PrivateRoute permission="accounting.treasury" component={<TreasuryList />} /> },
  { path: "/accounting/treasury-form", component: <PrivateRoute permission="accounting.treasury" component={<TreasuryForm />} /> },
  { path: "/accounting/check-operations", component: <PrivateRoute permission="accounting.treasury" component={<CheckOperations />} /> },
  { path: "/accounting/definitions", component: <PrivateRoute permission="accounting.treasury" component={<TreasuryDefinitions /> }/> },

  /* --- اجاره انبار --- */
  { path: "/rent/create", component: <PrivateRoute permission="rent.create" component={<WarehouseRentCreate />} /> },
  { path: "/rent/list", component: <PrivateRoute permission="rent.list" component={<WarehouseRentList />} /> },

  /* --- پرتال مشتری (لینک‌های اختصاصی منو) --- */
  { path: "/my-contracts", component: <PrivateRoute permission="client.contracts" component={<WarehouseRentList />} /> }, // بازیافت کامپوننت
  { path: "/my-invoices", component: <PrivateRoute permission="client.invoices" component={<AccountLedger />} /> }, // بازیافت کامپوننت
  { path: "/my-inventory", component: <PrivateRoute permission="client.portal" component={<ReceiptsList />} /> }, // بازیافت کامپوننت
  { path: "/request/loading", component: <PrivateRoute permission="client.portal" component={<LoadingOrderForm />} /> }, // بازیافت کامپوننت

  /* --- روت پیش‌فرض --- */
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

// ===============================================
// 🔓 Public Routes (مسیرهای عمومی - بدون نیاز به لاگین)
// ===============================================
const publicRoutes = [
  { path: "/login", component: <Login /> },
  { path: "/register", component: <Register /> }, // اگر ثبت نام باز است
  { path: "/logout", component: <Logout /> },
];

export { authProtectedRoutes, publicRoutes };