import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [customerToken, setCustomerToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await storage.getJSON('customer_data');
        const savedToken = await storage.getItem('customer_token');
        if (savedUser && savedToken) {
          setCustomer(savedUser);
          setCustomerToken(savedToken);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const loginCustomer = async (userData, token) => {
    setCustomer(userData);
    setCustomerToken(token);
    await storage.setJSON('customer_data', userData);
    await storage.setItem('customer_token', token);
  };

  const logoutCustomer = async () => {
    setCustomer(null);
    setCustomerToken(null);
    await storage.removeItem('customer_data');
    await storage.removeItem('customer_token');
  };

  return (
    <CustomerContext.Provider value={{ customer, customerToken, loading, loginCustomer, logoutCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used inside CustomerProvider');
  return ctx;
}
