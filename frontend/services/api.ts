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

  // 1. Cookies
  const cookieToken =
    Cookies.get("authToken") ||
    Cookies.get("access_token") ||
    Cookies.get("accessToken") ||
    Cookies.get("token");

  if (cookieToken) {
    return cookieToken;
  }

  // 2. localStorage
  const localToken =
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  if (localToken) {
    return localToken;
  }

  // 3. sessionStorage
  const sessionToken =
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token");

  if (sessionToken) {
    return sessionToken;
  }

  return undefined;
}

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      console.log("🔐 API Request:", {
        url: config.url,
        method: config.method,
        hasToken: true,
      });
    } else {
      console.warn("⚠️ API Request WITHOUT JWT:", {
        url: config.url,
        method: config.method,
      });
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
  (response) => {
    return response;
  },

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.error("❌ JWT authentication failed:", {
        url: error.config?.url,
        method: error.config?.method,
        hasAuthorizationHeader:
          !!error.config?.headers?.Authorization,
      });
    }

    return Promise.reject(error);
  },
);

export default api;