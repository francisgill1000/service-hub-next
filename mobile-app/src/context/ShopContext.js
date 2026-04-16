import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [shop, setShop] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedShop = await storage.getJSON('shop_data');
        const savedToken = await storage.getItem('shop_token');
        if (savedShop && savedToken) {
          setShop(savedShop);
          setToken(savedToken);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loginShop = async (shopData, authToken) => {
    setShop(shopData);
    setToken(authToken);
    await storage.setJSON('shop_data', shopData);
    await storage.setItem('shop_token', authToken);
  };

  const logoutShop = async () => {
    setShop(null);
    setToken(null);
    await storage.removeItem('shop_data');
    await storage.removeItem('shop_token');
  };

  return (
    <ShopContext.Provider value={{ shop, token, loading, loginShop, logoutShop }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
