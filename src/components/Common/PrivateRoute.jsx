import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ component, permission }) => {
    const location = useLocation();
    const userStr = localStorage.getItem("user");

    // 1. لاگ برای دیباگ (حتما کنسول مرورگر را چک کنید)
    // console.log(`🔐 Checking Route: ${location.pathname}`);

    // 2. اگر کلاً اطلاعاتی در حافظه نیست -> برو لاگین
    if (!userStr) {
        console.warn("⛔ User not found in localStorage. Redirecting to Login.");
        // استیت from را می‌فرستیم تا بعد از لاگین برگرده همینجا
        return <Navigate to="/login" state={{ from: location }} />;
    }

    try {
        const user = JSON.parse(userStr);

        // 3. پیدا کردن نقش و دسترسی‌ها
        // ما اطلاعات را در Login.jsx طوری ذخیره کردیم که هم در ریشه باشند و هم در member_details
        // اینجا هر دو حالت را چک می‌کنیم که خطا ندهد.
        const role = user.role || user.member_details?.role;
        const userPermissions = user.permissions || user.member_details?.permissions || [];

        // console.log("👤 User Role:", role);
        // console.log("🔑 Required Permission:", permission);

        // 4. قانون طلایی: ادمین همیشه اجازه دارد
        if (role === 'admin') {
            return component;
        }

        // 5. اگر صفحه نیازی به پرمیشن خاصی ندارد (مثل داشبورد)، اجازه بده
        if (!permission) {
            return component;
        }

        // 6. بررسی دسترسی برای صفحات خاص
        if (userPermissions.includes(permission)) {
            return component;
        } else {
            console.warn(`⛔ Access Denied. Needs: ${permission}, Has: ${userPermissions}`);
            // اگر دسترسی ندارد، به داشبورد برود (نه لاگین) تا لوپ نشود
            return <Navigate to="/dashboard" />;
        }

    } catch (error) {
        console.error("❌ Error parsing user data:", error);
        // اگر جیسون خراب بود، پاکش کن و بفرست لاگین
        localStorage.removeItem("user");
        return <Navigate to="/login" />;
    }
};

export default PrivateRoute;