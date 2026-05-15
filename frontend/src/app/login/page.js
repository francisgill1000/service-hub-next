"use client";

import api from '@/utils/api';
import QRCode from 'qrcode';
import { KeyRound, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import React, { useEffect, useMemo, useState } from 'react';

const Login = () => {
    const router = useRouter();
    const { shop, loginShop, logoutShop, loading: contextLoading } = useShop();

    const [redirectTo, setRedirectTo] = useState('/shop/dashboard');

    const [loginMode, setLoginMode] = useState('manual');

    const [shopCode, setShopCode] = useState('');
    const [pin, setPin] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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
            return;
        }

        const prefill = sessionStorage.getItem('post_register_login_prefill');
        if (prefill) {
            try {
                const obj = JSON.parse(prefill);
                if (obj.shopCode) setShopCode(obj.shopCode);
                if (obj.pin) setPin(obj.pin);
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

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!shopCode.trim()) {
            setError('Please enter your Business ID.');
            return;
        }
        if (!pin.trim()) {
            setError('Please enter your PIN.');
            return;
        }

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
        <div className="relative flex min-h-screen w-full flex-col bg-brand-bg text-brand-text max-w-[480px] mx-auto overflow-x-hidden px-8 pt-14 pb-10 font-display">
            <div className="mb-8 grid grid-cols-2 bg-brand-elevated border border-brand-border rounded-2xl p-1">
                <button
                    type="button"
                    onClick={() => setLoginMode('qr')}
                    className={`h-11 rounded-xl text-sm font-bold transition ${loginMode === 'qr' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'}`}
                >
                    Scan QR
                </button>
                <button
                    type="button"
                    onClick={() => setLoginMode('manual')}
                    className={`h-11 rounded-xl text-sm font-bold transition ${loginMode === 'manual' ? 'bg-brand-primary text-white' : 'text-brand-muted hover:text-brand-text'}`}
                >
                    ID & PIN
                </button>
            </div>

            {loginMode === 'qr' ? (
                <div className="flex-1 flex flex-col">
                    <div className="text-center mb-7">
                        <div className="size-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-brand-primary/20">
                            <QrCode size={38} className="text-brand-primary" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-brand-text mb-3">Login with QR</h1>
                        <p className="text-brand-muted text-sm px-4">Open Rezzy on your mobile, scan this code, then confirm login.</p>
                    </div>

                    <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 flex flex-col items-center">
                        <div className="w-[260px] h-[260px] rounded-2xl bg-white flex items-center justify-center overflow-hidden">
                            {qrImage ? (
                                <img src={qrImage} alt="login-qr" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-brand-muted text-sm px-4">Preparing QR...</div>
                            )}
                        </div>

                        <div className="mt-5 text-center">
                            <p className="text-sm text-brand-text">{qrMessage}</p>
                            {qrState === 'pending' && (
                                <p className="text-xs text-brand-muted mt-2">Expires in {qrSecondsLeft}s</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={requestQrCode}
                            className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-primary hover:opacity-80 transition"
                        >
                            <RefreshCw size={14} />
                            Refresh QR
                        </button>
                    </div>

                    <div className="mt-6 bg-brand-elevated border border-brand-border rounded-2xl p-4 text-sm text-brand-muted">
                        <div className="flex items-center gap-2 text-brand-text mb-2">
                            <Smartphone size={16} />
                            <span className="font-bold">How to scan</span>
                        </div>
                        <p>1) Open Rezzy on your phone and login.</p>
                        <p>2) Scan this QR code from your phone camera/browser.</p>
                        <p>3) Tap “Approve login” on phone.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center mb-10">
                        <div className="size-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-4 border border-brand-primary/20">
                            <KeyRound size={38} className="text-brand-primary" />
                        </div>
                        <div className="text-[11px] uppercase tracking-[0.25em] text-brand-muted font-bold">Rezzy</div>
                        <div className="text-[9px] text-brand-muted/60 tracking-wider mt-1">powered by Eloquent</div>
                    </div>

                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-extrabold text-brand-text mb-3">
                            Sign in to your account
                        </h1>
                        <p className="text-brand-muted text-sm leading-relaxed px-4">
                            Enter your Business ID and PIN to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs py-3 px-4 rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold ml-1">
                                Business ID
                            </label>
                            <input
                                value={shopCode}
                                onChange={(e) => {
                                    setShopCode(e.target.value);
                                    setError('');
                                }}
                                className="w-full bg-brand-surface border border-brand-border rounded-xl px-5 py-4 text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all"
                                placeholder="Enter business code"
                                type="text"
                                autoFocus={!shopCode}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-brand-muted font-bold ml-1">
                                PIN
                            </label>
                            <div className="relative">
                                <input
                                    value={pin}
                                    onChange={(e) => {
                                        setPin(e.target.value);
                                        setError('');
                                    }}
                                    className="w-full bg-brand-surface border border-brand-border rounded-xl px-5 py-4 pr-16 text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/40 transition-all"
                                    placeholder="Enter your PIN"
                                    type={showPin ? 'text' : 'password'}
                                    autoFocus={!!shopCode && !pin}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors text-[10px] font-bold uppercase tracking-widest"
                                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                                >
                                    {showPin ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => handleRememberChange(e.target.checked)}
                                    className="size-4 accent-brand-primary"
                                />
                                <span className="text-xs text-brand-muted">Remember ID &amp; PIN</span>
                            </label>

                            <button
                                type="button"
                                onClick={() => router.push('/forgot-password')}
                                className="text-[10px] uppercase tracking-widest text-brand-primary font-bold hover:underline"
                            >
                                Forgot Pin?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>{isSubmitting ? 'Logging in...' : 'Login'}</span>
                            {!isSubmitting && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                        </button>
                    </form>
                </>
            )}

            <div className="mt-auto pt-8 text-center">
                <button
                    onClick={() => router.push('/register')}
                    className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors group cursor-pointer"
                >
                    <span className="text-sm font-semibold tracking-wide">Create Account</span>
                </button>
            </div>

        </div>
    );
};

export default Login;
