import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://api.eloquentservice.com/api";


// Create Axios instance
const api = axios.create({
  baseURL: baseURL,
  // baseURL: "https://api.eloquentservice.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to safely get global search
const getGlobalSearch = () => {
  if (typeof window === "undefined") return null;
  return window.globalDebouncedSearch || null;
};

// Function to safely get device ID
const getDeviceId = () => {
  if (typeof window === "undefined") return null;

  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;

  const shopToken = localStorage.getItem("shop_token");
  if (shopToken) return shopToken;

  const legacyToken = localStorage.getItem("auth_token");
  if (!legacyToken) return null;

  localStorage.setItem("shop_token", legacyToken);
  localStorage.removeItem("auth_token");
  return legacyToken;
};

// Axios request interceptor
api.interceptors.request.use((config) => {
  const search = getGlobalSearch();

  if (search?.length > 3) {
    config.params = {
      ...config.params, // keep existing params
      search,
    };
  }

  const deviceId = getDeviceId();

  if (deviceId) {
    config.headers["X-Device-Id"] = deviceId;
  }

  const token = getAuthToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
