import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("whispernet_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const isAuthEndpoint =
      url.includes("/login") ||
      url.includes("/register") ||
      url.includes("/auth/send-otp") ||
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/forgot-password/request") ||
      url.includes("/auth/forgot-password/reset");

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("whispernet_token");
      window.dispatchEvent(new CustomEvent("whispernet:session-expired"));
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
