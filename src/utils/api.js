import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Create Axios instance
const api = axios.create({
  baseURL: "http://192.168.1.205:8000/api",
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

  return config;
});

export default api;
