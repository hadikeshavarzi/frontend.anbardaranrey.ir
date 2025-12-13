import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://portal.anbardaranrey.ir/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// اگر توکن عضویت رو تو localStorage ذخیره می‌کنی:
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("member_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
