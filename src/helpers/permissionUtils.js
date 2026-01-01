// src/helpers/permissionUtils.js

/**
 * بررسی می‌کند آیا کاربر جاری دسترسی مورد نظر را دارد یا خیر
 * @param {string} requiredPermission - کد دسترسی مورد نیاز (مثلا 'rent.create')
 * @returns {boolean}
 */
export const hasPermission = (requiredPermission) => {
    // ۱. دریافت اطلاعات کاربر از LocalStorage
    const userStr = localStorage.getItem("user");

    // اگر کاربر اصلا وجود نداشت (لاگین نکرده)
    if (!userStr) return false;

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        return false;
    }

    // اطلاعات تکمیلی عضو (که شامل نقش و پرمیشن‌هاست)
    const member = user.member_details || {};

    // ۲. قانون طلایی: ادمین کل (role: admin) به همه جا دسترسی دارد
    if (member.role === 'admin') {
        return true;
    }

    // ۳. اگر پرمیشن خاصی مد نظر نیست (مثلا داشبورد)، اجازه بده
    if (!requiredPermission) {
        return true;
    }

    // ۴. بررسی لیست دسترسی‌ها
    // چک می‌کنیم آیا این دسترسی در آرایه permissions کاربر وجود دارد؟
    const userPermissions = member.permissions || [];

    // اگر کاربر دسترسی '*' دارد یعنی سوپر-یوزر است
    if (userPermissions.includes('*')) return true;

    // بررسی دقیق دسترسی
    return userPermissions.includes(requiredPermission);
};