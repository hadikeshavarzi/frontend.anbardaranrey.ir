/* =====================================================================================
   📌 API Helper – Fixed Version
===================================================================================== */

import axios from "axios";

/* ------------------------------------------------------------------
   🔗 Base URL – شامل /api
------------------------------------------------------------------ */
export const API_BASE = "https://cms.anbardaranrey.ir/api";

/* ------------------------------------------------------------------
   🔐 Axios Instance
------------------------------------------------------------------ */
const axiosApi = axios.create({
  baseURL: API_BASE,
});

/* ------------------------------------------------------------------
   🟦 Request Interceptor - برای ست کردن token در هر request
------------------------------------------------------------------ */
axiosApi.interceptors.request.use(
  (config) => {
    // ✅ هربار که request میفرستی، token رو از localStorage میگیره
    const token = localStorage.getItem("authToken");
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    console.log("🔑 Token:", token ? "✅ موجود" : "❌ ندارد");
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
    return Promise.reject(error);
  }
);

/* =====================================================================================
   📌 CRUD (Payload-Compatible)
===================================================================================== */

export async function get(url, config = {}) {
  return axiosApi.get(url, config).then((res) => res.data);
}

export async function post(url, data = {}, config = {}) {
  return axiosApi.post(url, data, config).then((res) => res.data);
}

export async function put(url, data = {}, config = {}) {
  return axiosApi.put(url, data, config).then((res) => res.data);
}

export async function patch(url, data = {}, config = {}) {
  return axiosApi.patch(url, data, config).then((res) => res.data);
}

export async function del(url, config = {}) {
  return axiosApi.delete(url, config).then((res) => res.data);
}

/* =====================================================================================
   🔥 OTP SYSTEM – بدون Authorization
===================================================================================== */

export async function requestOtp(mobile) {
  try {
    const res = await axios.post(`${API_BASE}/auth/request-otp`, {
      mobile,
    });
    return res.data;
  } catch (error) {
    if (error.response) {
      throw (
        error.response.data?.error ||
        error.response.data?.message ||
        `خطای سرور: ${error.response.status}`
      );
    }
    throw "ارتباط با سرور برقرار نشد";
  }
}

export async function verifyOtp(mobile, otp) {
  try {
    const res = await axios.post(`${API_BASE}/auth/verify-otp`, {
      mobile,
      otp,
    });
    
    // ✅ ذخیره token در localStorage
    if (res.data?.token) {
      localStorage.setItem("authToken", res.data.token);
      console.log("✅ Token ذخیره شد:", res.data.token.substring(0, 20) + "...");
    }
    
    return res.data;
  } catch (error) {
    if (error.response) {
      throw (
        error.response.data?.error ||
        error.response.data?.message ||
        `خطای سرور: ${error.response.status}`
      );
    }
    throw "ارتباط با سرور برقرار نشد";
  }
}

/* =====================================================================================
   📦 Get Member by ID (with Token)
===================================================================================== */

export async function getMemberById(memberId, authToken) {
  try {
    const res = await axios.get(`${API_BASE}/members/${memberId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return res.data;
  } catch (error) {
    if (error.response) {
      throw (
        error.response.data?.error ||
        error.response.data?.message ||
        `خطای سرور: ${error.response.status}`
      );
    }
    throw "ارتباط با سرور برقرار نشد";
  }
}

export default axiosApi;