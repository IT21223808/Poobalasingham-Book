import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    let token =
      Cookies.get("access_token") ||
      Cookies.get("accessToken") ||
      Cookies.get("token");

    if (!token && typeof window !== "undefined") {
      token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token") ||
        undefined;
    }

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("JWT authentication failed:", {
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  },
);

export default api;