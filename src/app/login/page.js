"use client";
import api from '@/utils/api';
import { Key, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import React, { useEffect, useState } from 'react';


const Login = () => {
    const router = useRouter();
    const { shop, loginShop, loading: contextLoading } = useShop();

    // 1. Local State
    const [shopCode, setShopCode] = useState("");
    const [pin, setPin] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // 2. Sync State with Context (On Load)
    useEffect(() => {
        if (!contextLoading && shop) {
            setShopCode(shop.shop_code || "");
            // We usually don't pre-fill PINs for security, 
            // but including it as per your requirement:
            setPin(shop.pin || "");
        }
    }, [contextLoading, shop]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // One-time prefill after registration
        const postRegisterPrefill = sessionStorage.getItem("post_register_login_prefill");
        if (postRegisterPrefill) {
            try {
                const parsed = JSON.parse(postRegisterPrefill);
                if (parsed?.shopCode) setShopCode(String(parsed.shopCode));
                if (parsed?.pin) setPin(String(parsed.pin));
            } finally {
                sessionStorage.removeItem("post_register_login_prefill");
            }
        }

        // Remember-me prefill
        const rememberEnabled = localStorage.getItem("remember_shop_login") === "true";
        if (rememberEnabled) {
            setRememberMe(true);
            const savedShopCode = localStorage.getItem("remember_shop_code") || "";
            const savedPin = localStorage.getItem("remember_shop_pin") || "";
            if (savedShopCode) setShopCode(savedShopCode);
            if (savedPin) setPin(savedPin);
        }
    }, []);

    // 3. Handle Form Submission
    const handleLogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError("");

        const payload = {
            shop_code: shopCode,
            pin: pin
        };

        try {
            const response = await api.post('shops/login', payload);

            if (response.data.token && response.data.shop) {
                // Update Global Context (handles localStorage internally)
                loginShop(response.data.shop, response.data.token);

                if (rememberMe) {
                    localStorage.setItem("remember_shop_login", "true");
                    localStorage.setItem("remember_shop_code", shopCode);
                    localStorage.setItem("remember_shop_pin", pin);
                } else {
                    localStorage.removeItem("remember_shop_login");
                    localStorage.removeItem("remember_shop_code");
                    localStorage.removeItem("remember_shop_pin");
                }
                
                // Navigate to dashboard
                router.push('/shop/dashboard');
            } else {
                setError("Invalid response from server.");
            }
        } catch (err) {
            console.error("Login API error:", err);
            setError(err.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prevent rendering if context is still determining auth status
    if (contextLoading) return null;

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden shadow-2xl px-8 pt-20 pb-10 font-display">

            {/* --- Logo Section --- */}
            <div className="flex flex-col items-center mb-10">
                <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-5xl [fontVariationSettings:'FILL'_1]">handyman</span>
                </div>
            </div>

            {/* --- Text Content --- */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-white mb-3">Login</h1>
                <p className="text-muted-text text-sm leading-relaxed px-4">
                    Welcome back! Please enter your credentials to access your account.
                </p>
            </div>

            {/* --- Form Section --- */}
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        ID
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                            <Key size={20} />
                        </span>
                        <input
                            value={shopCode}
                            onChange={(e) => setShopCode(e.target.value)}
                            className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            placeholder="123456"
                            type="text"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        Pin
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                            <Lock size={20} />
                        </span>
                        <input
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            placeholder="••••"
                            type={showPin ? "text" : "password"}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPin((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                            aria-label={showPin ? "Hide PIN" : "Show PIN"}
                        >
                            {showPin ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="button"
                        onClick={() => router.push('/forgot-password')}
                        className="text-[10px] uppercase tracking-widest text-blue-500 font-bold hover:underline"
                    >
                        Forgot Pin?
                    </button>
                </div>

                <label className="flex items-center gap-3 select-none">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 accent-primary"
                    />
                    <span className="text-xs text-muted-text">Remember ID &amp; PIN</span>
                </label>

                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>{isSubmitting ? "Logging in..." : "Login"}</span>
                    {!isSubmitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                </button>
            </form>

            {/* --- Footer Link --- */}
            <div className="mt-auto pt-10 text-center">
                <button
                    onClick={() => router.push('/register')}
                    className="inline-flex items-center gap-2 text-muted-text hover:text-white transition-colors group cursor-pointer"
                >
                    <span className="text-sm font-semibold tracking-wide">Create Account</span>
                </button>
            </div>

            {/* --- Decorative Background Glows --- */}
            <div className="absolute -top-24 -left-24 size-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-1/2 -right-32 size-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
    );
};

export default Login;
