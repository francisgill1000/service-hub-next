import axios from 'axios';
import { storage } from './storage';

const BASE_URL = 'https://api.eloquentservice.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple UUID v4 generator that works without polyfill
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let _deviceId = null;

const getDeviceId = async () => {
  if (_deviceId) return _deviceId;
  let id = await storage.getItem('device_id');
  if (!id) {
    id = generateUUID();
    await storage.setItem('device_id', id);
  }
  _deviceId = id;
  return id;
};

const getAuthToken = async () => {
  const shopToken = await storage.getItem('shop_token');
  if (shopToken) return shopToken;
  const legacyToken = await storage.getItem('auth_token');
  if (legacyToken) {
    await storage.setItem('shop_token', legacyToken);
    await storage.removeItem('auth_token');
    return legacyToken;
  }
  // Fall back to customer token
  const customerToken = await storage.getItem('customer_token');
  if (customerToken) return customerToken;
  return null;
};

api.interceptors.request.use(async (config) => {
  const id = await getDeviceId();
  if (id) config.headers['X-Device-Id'] = id;

  const token = await getAuthToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
