import axios from "axios";

/* ------------------------------------------------------------------
   🔗 تنظیم آدرس‌های پایه
------------------------------------------------------------------ */
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ✅ اضافه شد تا خطای ProfileMenu برطرف شود
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || API_BASE;

// ساخت نمونه Axios
const axiosApi = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

/* ------------------------------------------------------------------
   🟦 اینترسپتور درخواست (Request Interceptor)
------------------------------------------------------------------ */
axiosApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");

        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        // اطمینان از ارسال فرمت JSON
        if (!config.headers["Content-Type"]) {
            config.headers["Content-Type"] = "application/json";
        }

        // لاگ در محیط توسعه
        if (import.meta.env.MODE === "development") {
            console.log(`📤 [${config.method?.toUpperCase()}] Sending to: ${config.url}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------
   🟦 اینترسپتور پاسخ (Response Interceptor)
------------------------------------------------------------------ */
axiosApi.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const data = error.response?.data;
        const url = error.config?.url;

        // 🚨 نمایش دقیق خطا در کنسول (بسیار مهم برای دیباگ)
        console.group("❌ API ERROR DETAILS");
        console.error("URL:", url);
        console.error("STATUS:", status);
        console.error("MESSAGE:", data?.message || data?.error || "خطای ناشناخته");
        console.error("FULL DATA:", data);
        console.groupEnd();

        // 🔐 مدیریت خطای ۴۰۱
        if (status === 401) {
            /* 🔴 تغییر مهم برای دیباگ:
               این خط پایین را موقتاً کامنت کردم تا وقتی دیتابیس ارور دسترسی می‌دهد
               شما را از سیستم بیرون ناندازد و بتوانید ارور را بخوانید.
            */

            // window.location.href = "/login"; // <--- فعلاً غیرفعال برای دیدن ارور RLS

            console.warn("⚠️ خطای ۴۰۱ دریافت شد. ریدایرکت موقتاً غیرفعال است.");
        }

        return Promise.reject(error);
    }
);

/* =====================================================================================
   📌 متدهای اصلی CRUD
===================================================================================== */

export const get = (url, config = {}) =>
    axiosApi.get(url, config).then((res) => res.data);

export const post = (url, data = {}, config = {}) =>
    axiosApi.post(url, data, config).then((res) => res.data);

export const put = (url, data = {}, config = {}) =>
    axiosApi.put(url, data, config).then((res) => res.data);

export const patch = (url, data = {}, config = {}) =>
    axiosApi.patch(url, data, config).then((res) => res.data);

export const del = (url, config = {}) =>
    axiosApi.delete(url, config).then((res) => res.data);

/* =====================================================================================
   🔥 متدهای احراز هویت (OTP)
===================================================================================== */

export async function requestOtp(mobile) {
    const res = await axios.post(`${API_BASE}/auth/request-otp`, { mobile });
    return res.data;
}

export async function verifyOtp(mobile, otp) {
    const res = await axios.post(`${API_BASE}/auth/verify-otp`, { mobile, otp });

    if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
        }
    }

    return res.data;
}

export default axiosApi;