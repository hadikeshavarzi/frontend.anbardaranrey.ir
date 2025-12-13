/* =====================================================================================
   📌 API Helper – FINAL (اصلاح شده)
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
});

/* ------------------------------------------------------------------
   🟦 Request Interceptor
------------------------------------------------------------------ */
axiosApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");

        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        console.log("📤 Request:", config.method?.toUpperCase(), config.url);
        console.log("🔑 Token:", token ? "✅ موجود" : "❌ ندارد");

        return config;
    },
    (error) => Promise.reject(error)
);

/* ------------------------------------------------------------------
   🟦 Response Interceptor
------------------------------------------------------------------ */
axiosApi.interceptors.response.use(
    (response) => {
        console.log("✅ Response:", response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error("❌ Response Error:", error.response?.status, error.config?.url);
        console.error("📋 Error Data:", error.response?.data);

        // اگر 401 بود، logout کن
        if (error.response?.status === 401) {
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
   🔥 OTP APIs (no token needed)
===================================================================================== */

export async function requestOtp(mobile) {
    try {
        const res = await axios.post(`${API_BASE}/auth/request-otp`, { mobile });
        console.log("📨 OTP Request:", res.data);
        return res.data;
    } catch (error) {
        console.error("❌ OTP Request Error:", error);
        throw error;
    }
}

export async function verifyOtp(mobile, otp) {
    try {
        const res = await axios.post(`${API_BASE}/auth/verify-otp`, { mobile, otp });

        console.log("🔍 Response structure:", res);
        console.log("🔍 Response data:", res.data);

        // ✅ اصلاح: res.data شامل { success, token, user } است
        if (res.data && res.data.token) {
            localStorage.setItem("authToken", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            console.log("✅ Token saved:", res.data.token.slice(0, 30) + "...");
            console.log("✅ User saved:", res.data.user.full_name);
        } else {
            console.error("⚠️ No token in response:", res.data);
        }

        return res.data;

    } catch (error) {
        console.error("❌ OTP Verify Error:", error);
        throw error;
    }
}

export default axiosApi;