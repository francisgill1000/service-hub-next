"use client";
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

const Login = ({ }) => {
    const router = useRouter();
    const [email, setEmail] = useState("example@email.com");
    const [password, setPassword] = useState("12345678");

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden shadow-2xl px-8 pt-20 pb-10 font-display">

            {/* --- Logo Section --- */}
            <div className="flex flex-col items-center mb-10">
                <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-5xl [fontVariationSettings:'FILL'_1]">handyman</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-2xl font-extrabold tracking-tight text-white">
                        Service<span className="text-primary">Hub</span>
                    </span>
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
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        Email or Phone Number
                    </label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                            alternate_email
                        </span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            placeholder="example@email.com"
                            type="text"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                            lock
                        </span>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                            type="password"
                        />
                    </div>
                </div>

                <label className="flex justify-end text-[10px] uppercase tracking-widest text-blue-500 font-bold ml-1">
                    <button onClick={() => router.push('/forgot-password')}>
                        Forgot Password?
                    </button>
                </label>

                <button className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <span>Login</span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </div>

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