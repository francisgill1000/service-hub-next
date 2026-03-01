"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useShop } from '@/context/ShopContext';

export default function QrApprovePage() {
    const router = useRouter();
    const { shop, loading } = useShop();

    const [token, setToken] = useState('');
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('Tap approve to login your desktop session.');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setToken(params.get('token') || '');
    }, []);

    const handleApprove = async () => {
        if (!token || status === 'loading') return;

        try {
            setStatus('loading');
            setMessage('Approving login...');

            await api.post(`/shops/qr-login/approve/${token}`);
            setStatus('success');
            setMessage('Desktop login approved successfully. You can return to your desktop now.');
        } catch (err) {
            setStatus('error');
            setMessage(err?.response?.data?.message || 'Failed to approve QR login. Please rescan and try again.');
        }
    };

    if (loading) return null;

    if (!token) {
        return (
            <div className="min-h-screen bg-brand-dark text-white px-6 py-10 max-w-[480px] mx-auto">
                <h1 className="text-2xl font-bold">Invalid QR</h1>
                <p className="text-muted-text mt-3">QR token is missing. Please scan a fresh QR from desktop.</p>
            </div>
        );
    }

    if (!shop) {
        const redirect = encodeURIComponent(`/login/qr?token=${token}`);

        return (
            <div className="min-h-screen bg-brand-dark text-white px-6 py-10 max-w-[480px] mx-auto flex flex-col justify-center">
                <h1 className="text-2xl font-bold">Login required</h1>
                <p className="text-muted-text mt-3">Please login on mobile first, then approve desktop login.</p>
                <button
                    onClick={() => router.push(`/login?redirect=${redirect}`)}
                    className="mt-6 w-full h-12 rounded-xl bg-primary text-white font-bold"
                >
                    Continue to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-dark text-white px-6 py-10 max-w-[480px] mx-auto flex flex-col justify-center">
            <div className="bg-card-dark border border-white/10 rounded-2xl p-6">
                <h1 className="text-2xl font-bold">Approve Desktop Login</h1>
                <p className="text-muted-text mt-3 text-sm">{message}</p>

                <div className="mt-5 text-xs text-white/70">
                    Logged in as <span className="font-bold text-white">{shop?.name || 'Shop'}</span>
                </div>

                <button
                    onClick={handleApprove}
                    disabled={status === 'loading' || status === 'success'}
                    className="mt-6 w-full h-12 rounded-xl bg-primary text-white font-bold disabled:opacity-70"
                >
                    {status === 'loading' ? 'Approving...' : status === 'success' ? 'Approved' : 'Approve Login'}
                </button>
            </div>
        </div>
    );
}
