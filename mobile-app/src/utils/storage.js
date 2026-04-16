import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
  async getJSON(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  async setJSON(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
