import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_UR,
  timeout: 80000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  },
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage (if you're using JWT)
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      if(error.response.status===500) {
        console.error("SErver error. Please try again later")
      }
    } else if(error.code==="ECONNABORTED") {
        console.error("Request timeout. Please try again")
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;