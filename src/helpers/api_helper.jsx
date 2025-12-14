/* =====================================================================================
   📌 API Helper – FINAL + DEBUG (برای پیدا کردن PUT اشتباه)
===================================================================================== */

import axios from "axios";

/* ------------------------------------------------------------------
   🔗 Base URL from .env
------------------------------------------------------------------ */
export const API_BASE = import.meta.env.VITE_API_BASE;
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE;

if (!API_BASE) {
    console.error("❌ VITE_API_BASE is missing in .env file");
}

/* ------------------------------------------------------------------
   🔐 Axios Instance
------------------------------------------------------------------ */
const axiosApi = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

/* ------------------------------------------------------------------
   🟦 Request Interceptor (LOG + TRACE)
------------------------------------------------------------------ */
axiosApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");

        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        const method = config.method?.toUpperCase();
        const url = config.url;

        /* ---------- LOG BASIC ---------- */
        console.log(`📤 ${method} ${url}`);

        /* ---------- 🔥 DEBUG PUT RECEIPTS ---------- */
        if (method === "PUT" && url?.includes("/receipts/")) {
            console.group("🚨🚨 DETECTED PUT /receipts 🚨🚨");
            console.log("URL:", url);
            console.log("DATA:", config.data);
            console.trace("📍 CALL STACK (WHO CALLED THIS PUT?)");
            console.groupEnd();
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------
   🟦 Response Interceptor (ERROR LOGGING)
------------------------------------------------------------------ */
axiosApi.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toUpperCase();
        const url = response.config.url;

        console.log(`✅ ${method} ${url}`, response.status);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const method = error.config?.method?.toUpperCase();

        console.group("❌ API RESPONSE ERROR");
        console.error("METHOD:", method);
        console.error("URL:", url);
        console.error("STATUS:", status);
        console.error("DATA:", error.response?.data);
        console.groupEnd();

        // 🔐 اگر توکن منقضی شد
        if (status === 401) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

/* =====================================================================================
   📌 CRUD Methods
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
   🔥 OTP APIs (NO TOKEN)
===================================================================================== */

export async function requestOtp(mobile) {
    const res = await axios.post(`${API_BASE}/auth/request-otp`, { mobile });
    return res.data;
}

export async function verifyOtp(mobile, otp) {
    const res = await axios.post(`${API_BASE}/auth/verify-otp`, { mobile, otp });

    if (res.data?.token) {
        localStorage.setItem("authToken", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res.data;
}

export default axiosApi;
