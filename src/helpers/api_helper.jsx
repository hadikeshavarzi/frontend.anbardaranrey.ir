/* =====================================================================================
   📌 API Helper – Stable Version (WORKING)
   ✔ OTP بدون مشکل
   ✔ CRUD صحیح
   ✔ Authorization صحیح
   ✔ بدون خطای "ارتباط با سرور برقرار نشد"
===================================================================================== */

import axios from "axios";
import accessToken from "./jwt-token-access/accessToken";

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
   🟦 Authorization Header
------------------------------------------------------------------ */
const token = accessToken;
if (token) {
  axiosApi.defaults.headers.common["Authorization"] = token;
}

/* ------------------------------------------------------------------
   🟦 Error Interceptor
------------------------------------------------------------------ */
axiosApi.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(error)
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
