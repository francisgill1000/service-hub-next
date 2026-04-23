"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, UserCircle2 } from 'lucide-react';

const Account = () => {
    const router = useRouter();
    const [customer, setCustomer] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('customer_token');
        const raw = localStorage.getItem('customer_user');
        if (token && raw) {
            try {
                setCustomer(JSON.parse(raw));
            } catch {
                setCustomer(null);
            }
        }
        setLoaded(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');
        setCustomer(null);
    };

    if (!loaded) return null;

    if (customer) {
        return (
            <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden px-6 pt-10 pb-28 font-display">
                <div className="flex flex-col items-center mb-8">
                    <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                        <UserCircle2 size={52} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white">{customer.name || 'Customer'}</h1>
                    {customer.phone && (
                        <p className="text-muted-text text-sm mt-1">{customer.phone}</p>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => router.push('/bookings')}
                        className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-sm text-white text-left hover:bg-white/5 transition"
                    >
                        My Bookings
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push('/favourites')}
                        className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-sm text-white text-left hover:bg-white/5 transition"
                    >
                        Favourites
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-5 py-4 text-sm font-semibold hover:bg-red-500/20 transition"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden px-8 pt-16 pb-28 font-display items-center justify-center">
            <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mb-5 border border-white/10">
                <UserCircle2 size={42} className="text-muted-text" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3 text-center">Sign In</h1>
            <p className="text-muted-text text-sm leading-relaxed text-center mb-8 px-4">
                Log in to track your bookings and save favourites to your account.
            </p>

            <button
                type="button"
                onClick={() => router.push('/customer/login')}
                className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
                Sign In
            </button>
            <button
                type="button"
                onClick={() => router.push('/customer/register')}
                className="w-full h-14 mt-3 border border-white/10 text-muted-text font-semibold rounded-2xl hover:text-white hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer"
            >
                Create Account
            </button>

            <div className="flex items-center gap-3 w-full mt-8 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-muted-text text-xs font-semibold">Are you a business owner?</span>
                <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
                type="button"
                onClick={() => router.push('/login')}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 text-primary font-bold text-sm hover:bg-primary/20 transition-all cursor-pointer"
            >
                <Store size={18} />
                Business Login
            </button>
        </div>
    );
};

export default Account;
