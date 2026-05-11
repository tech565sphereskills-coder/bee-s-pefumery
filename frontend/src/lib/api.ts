import axios from "axios";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/",
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    if (config.headers.set) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoggedOut = !useAuth.getState().token;
      if (!isLoggedOut) {
        toast.error("Session Expired", {
          description: "Your session has expired. Please log in again.",
        });
        useAuth.getState().logout();
        // Redirect to login if on admin path
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
