"use client";

import api from '@/utils/api';
import QRCode from 'qrcode';
import { ChevronLeft, KeyRound, Lock, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import React, { useEffect, useMemo, useState } from 'react';

const Login = () => {
    const router = useRouter();
    const { shop, loginShop, logoutShop, loading: contextLoading } = useShop();

    const [redirectTo, setRedirectTo] = useState('/shop/dashboard');

    const [loginMode, setLoginMode] = useState('qr');

    const [shopCode, setShopCode] = useState('');
    const [pin, setPin] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('code');

    const [qrToken, setQrToken] = useState(null);
    const [qrImage, setQrImage] = useState(null);
    const [qrState, setQrState] = useState('idle');
    const [qrMessage, setQrMessage] = useState('Generate a QR code to login from your mobile.');
    const [qrExpiry, setQrExpiry] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
            setRedirectTo(redirect);
        }

        const remembered = localStorage.getItem('remember_shop_login') === 'true';
        const rememberedCode = localStorage.getItem('remember_shop_code') || '';
        const rememberedPin = localStorage.getItem('remember_shop_pin') || '';

        if (remembered && rememberedCode) {
            setShopCode(rememberedCode);
            setPin(rememberedPin);
            setRememberMe(true);
            if (rememberedPin) setStep('pin');
            return;
        }

        const prefill = sessionStorage.getItem('post_register_login_prefill');
        if (prefill) {
            try {
                const obj = JSON.parse(prefill);
                if (obj.shopCode) setShopCode(obj.shopCode);
                if (obj.pin) {
                    setPin(obj.pin);
                    setStep('pin');
                }
            } catch (e) {
            }

            sessionStorage.removeItem('post_register_login_prefill');
        }
    }, []);

    const handleRememberChange = (checked) => {
        setRememberMe(checked);

        if (!checked && typeof window !== 'undefined') {
            localStorage.removeItem('remember_shop_login');
            localStorage.removeItem('remember_shop_code');
            localStorage.removeItem('remember_shop_pin');

            if (shop) logoutShop();
        }
    };

    const handleContinue = (e) => {
        e.preventDefault();

        if (!shopCode.trim()) {
            setError('Please enter your shop ID.');
            return;
        }

        setError('');
        setStep('pin');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            const response = await api.post('shops/login', {
                shop_code: shopCode,
                pin,
            });

            if (response.data.token && response.data.shop) {
                loginShop(response.data.shop, response.data.token);

                if (rememberMe) {
                    localStorage.setItem('remember_shop_login', 'true');
                    localStorage.setItem('remember_shop_code', shopCode);
                    localStorage.setItem('remember_shop_pin', pin);
                } else {
                    localStorage.removeItem('remember_shop_login');
                    localStorage.removeItem('remember_shop_code');
                    localStorage.removeItem('remember_shop_pin');
                }

                router.push(redirectTo);
            } else {
                setError('Invalid response from server.');
            }
        } catch (err) {
            console.error('Login API error:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestQrCode = async () => {
        try {
            setQrState('loading');
            setQrMessage('Generating QR code...');
            setError('');

            const response = await api.post('/shops/qr-login/request');
            const token = response?.data?.token;
            const expiresIn = Number(response?.data?.expires_in || 120);

            if (!token) {
                throw new Error('Failed to generate QR token.');
            }

            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const scanUrl = `${origin}/login/qr?token=${encodeURIComponent(token)}`;
            const image = await QRCode.toDataURL(scanUrl, { width: 260, margin: 1 });

            setQrToken(token);
            setQrImage(image);
            setQrExpiry(Date.now() + expiresIn * 1000);
            setQrState('pending');
            setQrMessage('Scan this QR code using your logged-in mobile.');
        } catch (err) {
            console.error('QR request failed', err);
            setQrState('error');
            setQrMessage('Unable to generate QR. Please try again.');
        }
    };

    useEffect(() => {
        if (loginMode !== 'qr') return;
        requestQrCode();
    }, [loginMode]);

    useEffect(() => {
        if (loginMode !== 'qr' || !qrToken || qrState !== 'pending') return;

        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/shops/qr-login/status/${qrToken}`);
                const status = response?.data?.status;

                if (status === 'approved' && response?.data?.token && response?.data?.shop) {
                    loginShop(response.data.shop, response.data.token);
                    setQrState('approved');
                    setQrMessage('Login approved. Redirecting...');
                    router.push(redirectTo);
                }
            } catch (err) {
                const statusCode = err?.response?.status;

                if (statusCode === 410) {
                    setQrState('expired');
                    setQrMessage('QR expired. Tap refresh to generate a new one.');
                    return;
                }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [loginMode, qrToken, qrState, loginShop, router, redirectTo]);

    useEffect(() => {
        if (loginMode !== 'qr' || !qrExpiry || qrState !== 'pending') return;

        const timer = setInterval(() => {
            if (Date.now() >= qrExpiry) {
                setQrState('expired');
                setQrMessage('QR expired. Tap refresh to generate a new one.');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [loginMode, qrExpiry, qrState]);

    const qrSecondsLeft = qrExpiry && qrState === 'pending'
        ? Math.max(0, Math.floor((qrExpiry - Date.now()) / 1000))
        : 0;

    if (contextLoading) return null;

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-brand-dark max-w-[480px] mx-auto overflow-x-hidden shadow-2xl px-8 pt-14 pb-10 font-display">
            <div className="mb-8 grid grid-cols-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                <button
                    type="button"
                    onClick={() => setLoginMode('qr')}
                    className={`h-11 rounded-xl text-sm font-bold transition ${loginMode === 'qr' ? 'bg-primary text-white' : 'text-muted-text'}`}
                >
                    Scan QR
                </button>
                <button
                    type="button"
                    onClick={() => setLoginMode('manual')}
                    className={`h-11 rounded-xl text-sm font-bold transition ${loginMode === 'manual' ? 'bg-primary text-white' : 'text-muted-text'}`}
                >
                    ID & PIN
                </button>
            </div>

            {loginMode === 'qr' ? (
                <div className="flex-1 flex flex-col">
                    <div className="text-center mb-7">
                        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                            <QrCode size={38} className="text-primary" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white mb-3">Login with QR</h1>
                        <p className="text-muted-text text-sm px-4">Open Service Hub on your mobile, scan this code, then confirm login.</p>
                    </div>

                    <div className="bg-card-dark border border-white/10 rounded-3xl p-6 flex flex-col items-center">
                        <div className="w-[260px] h-[260px] rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                            {qrImage ? (
                                <img src={qrImage} alt="login-qr" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-slate-500 text-sm px-4">Preparing QR...</div>
                            )}
                        </div>

                        <div className="mt-5 text-center">
                            <p className="text-sm text-white">{qrMessage}</p>
                            {qrState === 'pending' && (
                                <p className="text-xs text-muted-text mt-2">Expires in {qrSecondsLeft}s</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={requestQrCode}
                            className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition"
                        >
                            <RefreshCw size={14} />
                            Refresh QR
                        </button>
                    </div>

                    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-muted-text">
                        <div className="flex items-center gap-2 text-white mb-2">
                            <Smartphone size={16} />
                            <span className="font-bold">How to scan</span>
                        </div>
                        <p>1) Open Service Hub on your phone and login.</p>
                        <p>2) Scan this QR code from your phone camera/browser.</p>
                        <p>3) Tap “Approve login” on phone.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center mb-10">
                        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 border border-primary/20">
                            <KeyRound size={38} className="text-primary" />
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-text font-bold">Service Hub</div>
                    </div>

                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-extrabold text-white mb-3">
                            {step === 'code' ? 'Enter your shop ID' : 'Enter your PIN'}
                        </h1>
                        <p className="text-muted-text text-sm leading-relaxed px-4">
                            {step === 'code'
                                ? 'Use your shop code to continue.'
                                : 'Verify your PIN to access your shop dashboard.'}
                        </p>
                    </div>

                    {step === 'code' ? (
                        <form onSubmit={handleContinue} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                                    Shop ID
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                                        <KeyRound size={20} />
                                    </span>
                                    <input
                                        value={shopCode}
                                        onChange={(e) => {
                                            setShopCode(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        placeholder="Enter shop code"
                                        type="text"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Continue
                                <span className="material-symbols-outlined text-xl">arrow_forward</span>
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setStep('code');
                                    setError('');
                                }}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-muted-text hover:text-white transition-colors"
                            >
                                <ChevronLeft size={14} />
                                Change Shop ID
                            </button>

                            <div className="bg-card-dark border border-white/10 rounded-2xl px-4 py-3 text-sm">
                                <div className="text-muted-text text-[10px] uppercase tracking-widest mb-1">Current Shop ID</div>
                                <div className="font-bold text-white">{shopCode}</div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-muted-text font-bold ml-1">
                                    PIN
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-primary transition-colors">
                                        <Lock size={20} />
                                    </span>
                                    <input
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value);
                                            setError('');
                                        }}
                                        className="w-full h-14 bg-card-dark border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        placeholder="Enter your PIN"
                                        type={showPin ? 'text' : 'password'}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPin((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                                        aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                                    >
                                        {showPin ? 'Hide' : 'Show'}
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
                                    onChange={(e) => handleRememberChange(e.target.checked)}
                                    className="size-4 accent-primary"
                                />
                                <span className="text-xs text-muted-text">Remember ID &amp; PIN</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
                                {!isSubmitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                            </button>
                        </form>
                    )}
                </>
            )}

            <div className="mt-auto pt-8 text-center">
                <button
                    onClick={() => router.push('/register')}
                    className="inline-flex items-center gap-2 text-muted-text hover:text-white transition-colors group cursor-pointer"
                >
                    <span className="text-sm font-semibold tracking-wide">Create Account</span>
                </button>
            </div>

            <div className="absolute -top-24 -left-24 size-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute top-1/2 -right-32 size-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>
    );
};

export default Login;
