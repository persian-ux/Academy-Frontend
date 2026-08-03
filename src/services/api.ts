import axios from "axios";
import { getAuthHeaders } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (Object.keys(authHeaders).length > 0) {
      const headers = config.headers as Record<string, string | undefined>;
      headers.Authorization = authHeaders.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally (token expired / invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
    }

    if (error.response?.status === 403 && window.location.pathname !== "/access-denied") {
      window.location.href = "/access-denied";
    }
    return Promise.reject(error);
  }
);

export default api;
