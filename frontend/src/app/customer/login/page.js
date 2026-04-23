"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';
import api from '@/utils/api';

const CustomerLogin = () => {
    const router = useRouter();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const remembered = localStorage.getItem('remember_customer_login') === 'true';
        if (remembered) {
            setRememberMe(true);
            setPhone(localStorage.getItem('remember_customer_phone') || '');
            setPassword(localStorage.getItem('remember_customer_password') || '');
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (!phone.trim()) { setError('Please enter your mobile number.'); return; }
        if (!password) { setError('Please enter your password.'); return; }

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', { phone: phone.trim(), password });

            if (res.data?.token && res.data?.user) {
                if (rememberMe) {
                    localStorage.setItem('remember_customer_login', 'true');
                    localStorage.setItem('remember_customer_phone', phone.trim());
                    localStorage.setItem('remember_customer_password', password);
                } else {
                    localStorage.removeItem('remember_customer_login');
                    localStorage.removeItem('remember_customer_phone');
                    localStorage.removeItem('remember_customer_password');
                }

                localStorage.setItem('customer_token', res.data.token);
                localStorage.setItem('customer_user', JSON.stringify(res.data.user));

                router.back();
            } else {
                setError('Invalid response from server.');
            }
        } catch (err) {
            console.error('Customer login error:', err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors?.phone?.[0] ||
                'Login failed. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden shadow-2xl px-8 pt-14 pb-10 font-display">
            <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-1 text-muted-text hover:text-white transition-colors mb-8 cursor-pointer"
            >
                <ChevronLeft size={20} />
                <span className="text-sm">Back</span>
            </button>

            <div className="flex flex-col items-center mb-8">
                <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 border border-primary/20">
                    <User size={38} className="text-primary" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-muted-text font-bold">Rezzy</div>
                <div className="text-[9px] text-muted-text/60 tracking-wider mt-1">powered by Eloquent</div>
            </div>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-white mb-3">Welcome Back</h1>
                <p className="text-muted-text text-sm leading-relaxed px-4">
                    Sign in to view your bookings and favourites.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        Mobile Number
                    </label>
                    <input
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setError(''); }}
                        className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="e.g. 0501234567"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 pr-16 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            placeholder="Your password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                <label className="flex items-center gap-3 select-none">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 accent-primary"
                    />
                    <span className="text-xs text-muted-text">Remember me</span>
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                    {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
            </form>

            <div className="mt-auto pt-10 text-center">
                <button
                    type="button"
                    onClick={() => router.push('/customer/register')}
                    className="inline-flex items-center gap-2 text-muted-text hover:text-white transition-colors cursor-pointer"
                >
                    <span className="text-sm">
                        Don't have an account? <span className="text-primary font-semibold">Register</span>
                    </span>
                </button>
            </div>

            <div className="absolute -top-24 -left-24 size-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-1/2 -right-32 size-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
    );
};

export default CustomerLogin;
