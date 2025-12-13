import { apiPost, apiGet } from "./api";

export function requestOtp(mobile) {
  return apiPost("/auth/request-otp", { mobile });
}

export function verifyOtp(mobile, otp) {
  return apiPost("/auth/verify-otp", { mobile, otp }).then(res => {
    if (res.token) localStorage.setItem("token", res.token);
    return res;
  });
}

export function getMe() {
  const token = localStorage.getItem("token");
  return apiGet("/me", token);
}
