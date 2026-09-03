import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   GET AUTH TOKEN
========================================================= */

function getAuthToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  let token =
    Cookies.get("authToken") ||
    Cookies.get("access_token") ||
    Cookies.get("accessToken") ||
    Cookies.get("token");

  if (!token) {
    token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("accessToken") ||
      sessionStorage.getItem("access_token") ||
      sessionStorage.getItem("token") ||
      undefined;
  }

  return token || undefined;
}

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "JWT authentication failed:",
        {
          url: error.config?.url,
          method: error.config?.method,
        },
      );
    }

    return Promise.reject(error);
  },
);

export default api;
