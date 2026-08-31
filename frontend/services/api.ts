import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("access_token");

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
        hasToken: Boolean(Cookies.get("access_token")),
      });

      // Don't automatically redirect here until
      // we confirm your login/logout flow.
    }

    return Promise.reject(error);
  },
);

export default api;