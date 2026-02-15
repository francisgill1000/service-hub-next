"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext(undefined);

export const ShopProvider = ({ children }) => {
    const [shop, setShop] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedShop = localStorage.getItem('shop_data') ?? localStorage.getItem('shop');
        const savedToken = localStorage.getItem('shop_token') ?? localStorage.getItem('auth_token');

        if (savedShop) setShop(JSON.parse(savedShop));
        if (savedToken) setToken(savedToken);

        if (savedShop && !localStorage.getItem('shop_data')) {
            localStorage.setItem('shop_data', savedShop);
            localStorage.removeItem('shop');
        }

        if (savedToken && !localStorage.getItem('shop_token')) {
            localStorage.setItem('shop_token', savedToken);
            localStorage.removeItem('auth_token');
        }

        setLoading(false);
    }, []);

    const loginShop = (shopData, authToken) => {
        setShop(shopData);
        setToken(authToken);
        localStorage.setItem('shop_data', JSON.stringify(shopData));
        localStorage.setItem('shop_token', authToken);
    };

    const logoutShop = () => {
        setShop(null);
        setToken(null);
        localStorage.removeItem('shop_data');
        localStorage.removeItem('shop_token');
    };

    return (
        <ShopContext.Provider value={{ shop, token, loginShop, logoutShop, loading }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error("useShop must be used within a ShopProvider");
    }
    return context;
};
