import axios from "axios";
import { API_BASE as API } from "../helpers/api_helper.jsx";


// ========================================
// 🔐 Authentication
// ========================================

export async function login(mobile, password) {
    try {
        const res = await axios.post(`${API}/auth/login`, {
            mobile,
            password,
        });
        return res.data;
    } catch (err) {
        throw err.response?.data?.error || "Login error";
    }
}

// 🔥 درخواست OTP
export async function requestOtp(mobile) {
    try {
        const res = await axios.post(`${API}/auth/request-otp`, {
            mobile,
        });
        return res.data;
    } catch (err) {
        throw err.response?.data?.error || "خطا در ارسال کد";
    }
}

// 🔥 تایید OTP
export async function verifyOtp(mobile, otp) {
    try {
        const res = await axios.post(`${API}/auth/verify-otp`, {
            mobile,
            otp,
        });
        return res.data;
    } catch (err) {
        throw err.response?.data?.error || "کد صحیح نیست";
    }
}

// ========================================
// 👤 Members
// ========================================

// 🔥 دریافت اطلاعات کامل member
export async function getMemberById(memberId, token) {
    try {
        const res = await axios.get(`${API}/members/${memberId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (err) {
        throw err.response?.data?.error || "خطا در دریافت اطلاعات";
    }
}

// ========================================
// 📦 Export API base for other uses
// ========================================
export { API as API_BASE };