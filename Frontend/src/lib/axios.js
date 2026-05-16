import axios from "axios";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : import.meta.env.VITE_API_URL || "https://chatapp-arhc.onrender.com/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop on refresh failure
    if (originalRequest.url === '/auth/refresh') {
        return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Log out the user or trigger state clear if refresh fails
        useAuthStore.getState().setAuthUser(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Import at the top
import { useAuthStore } from "../store/useAuthStore";