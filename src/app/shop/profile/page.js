"use client";

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { Image, Camera } from 'lucide-react';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';

export default function ShopProfile() {
    const router = useRouter();
    const { shop, loading, loginShop, token } = useShop();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({
        name: '',
        location: '',
        pin: '',
        logo: null,
        hero_image: null,
    });

    useEffect(() => {
        if (!loading && !shop) router.push('/login');
    }, [loading, shop]);

    useEffect(() => {
        if (!shop) return;
        setForm({
            name: shop.name || '',
            location: shop.location || '',
            logo: null,
            hero_image: null,
        });
    }, [shop]);

    if (loading || !shop) return null;

    const hero = shop.hero_image || shop.cover_image || shop.hero || null;
    const logo = shop.logo || shop.avatar || null;

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!shop?.id || isSaving) return;
        setIsSaving(true);
        setMessage('');

        try {
            const payload = {
                name: form.name,
                location: form.location,
            };

            // Only include logo if it was changed
            if (form.logo) {
                payload.logo = form.logo;
            }

            // Only include hero_image if it was changed
            if (form.hero_image) {
                payload.hero_image = form.hero_image;
            }

            console.log('Sending payload:', payload);
            const response = await api.put(`/shops/${shop.id}`, payload);
            console.log('API Response:', response?.data);

            // Prefer API response; fallback to merging old shop with payload
            let updatedShop;
            if (response?.data?.shop) {
                updatedShop = response.data.shop;
            } else if (response?.data?.data) {
                updatedShop = response.data.data;
            } else if (response?.data) {
                updatedShop = { ...shop, ...response.data };
            } else {
                updatedShop = { ...shop, ...payload };
            }


            loginShop(updatedShop, token);

            await notify({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully.'
            });


            // Reset image uploads after success
            setForm(prev => ({ ...prev, logo: null, hero_image: null }));
        } catch (e) {

            await notify({
                icon: 'error',
                title: 'Error!',
                text: e?.response?.data?.message || 'Failed to update profile.'
            });

        } finally {
            setIsSaving(false);
        }
    };

    const qrTarget = `https://eloquent-services-hub.netlify.app/detail?id=${shop.id}`;

    const googleQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=600x600&chl=${encodeURIComponent(qrTarget)}`;

    const [qrDataUrl, setQrDataUrl] = useState(null);

    useEffect(() => {
        let mounted = true;
        const gen = async () => {
            try {
                const dataUrl = await QRCode.toDataURL(qrTarget, { width: 600 });
                if (mounted) setQrDataUrl(dataUrl);
            } catch (err) {
                console.error('Local QR generation failed, falling back to Google API', err);
                if (mounted) setQrDataUrl(null);
            }
        };
        gen();
        return () => { mounted = false };
    }, [qrTarget]);

    const qrImageUrl = qrDataUrl || googleQrUrl;

    const downloadQr = async () => {
        try {
            if (qrDataUrl) {
                const res = await fetch(qrDataUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(shop.name || 'shop').replace(/\s+/g, '_')}_qr.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } else {
                const res = await fetch(googleQrUrl);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(shop.name || 'shop').replace(/\s+/g, '_')}_qr.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to download QR', err);
        }
    };

    const printQr = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<img src="${qrImageUrl}" style="width:400px;height:400px;display:block;margin:40px auto"/>`);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <div className="min-h-screen bg-[#0b0f14] text-white pb-28">
            <div className="max-w-md mx-auto">
                {/* Hero / Cover */}

                <div className="relative mt-10">
                    {/* Hero — clickable to update */}
                    <label className="relative block cursor-pointer group h-56 w-full bg-gradient-to-r from-slate-800 via-slate-900 to-black rounded-b-3xl overflow-hidden">
                        {form.hero_image ? (
                            <>
                                <img src={form.hero_image} alt="cover preview" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute top-3 left-4 bg-white/10 text-[11px] px-2 py-1 rounded backdrop-blur-sm">Preview</div>
                            </>
                        ) : hero ? (
                            <img src={hero} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                        ) : null}

                        {/* overlay for visual effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

                        {/* Edit Button - Always Visible */}
                        <div className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-500 p-3 rounded-full shadow-lg transition-all">
                            <Camera size={20} className="text-white" />
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        handleChange('hero_image', reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>

                    {/* Logo — clickable to update */}
                    <label className="absolute -bottom-14 left-6 w-28 h-28 rounded-full bg-[#0f1720] border-4 border-white/10 ring-4 ring-white/10 ring-offset-2 ring-offset-[#0b0f14] z-30 shadow-2xl cursor-pointer group block transition-all">
                        {form.logo ? (
                            <>
                                <img src={form.logo} alt="logo preview" className="absolute inset-0 w-full h-full object-cover rounded-full" />
                                <div className="absolute top-1 left-1 bg-white/10 text-[10px] px-2 py-1 rounded-full">Preview</div>
                            </>
                        ) : logo ? (
                            <img src={logo} alt={`${shop.name || 'shop'} logo`} className="absolute inset-0 w-full h-full object-cover rounded-full" />
                        ) : null}

                        {/* Fallback bg if no logo */}
                        {!logo && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                <span className="text-xs text-white font-semibold">Logo</span>
                            </div>
                        )}

                        {/* Edit Button - Always Visible */}
                        <div className="absolute bottom-2 right-2 z-40 bg-blue-600 hover:bg-blue-500 p-2 rounded-full shadow-lg border-2 border-[#0f1720] transition-all">
                            <Camera size={14} className="text-white" />
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        handleChange('logo', reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>

                <div className="px-6 pt-20">
                    {/* Form Fields */}
                    <div className="space-y-3 mb-6">
                        <div>
                            <label className="text-xs text-white/60">Shop Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                placeholder="Shop name"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-white/60">Location</label>
                            <input
                                value={form.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none"
                                placeholder="Location"
                            />
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <div className="text-xs text-white/60">Shop Code</div>
                                <div className="font-mono font-bold text-lg">{shop.shop_code || '—'}</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <div className="text-xs text-white/60">PIN</div>
                                <div className="font-mono font-bold text-lg">{shop.pin || '—'}</div>
                            </div>
                        </div>
                        {/* QR Code */}

                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center max-w-sm">
                            {/* Header */}
                            <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Shop QR Code
                            </span>

                            {/* QR Code Container */}
                            <div className="my-6 p-3 bg-white rounded-xl shadow-lg shadow-black/20">
                                <img
                                    src={qrImageUrl}
                                    alt="shop-qr"
                                    className="w-40 h-40 object-contain"
                                />
                            </div>

                            {/* Action Button */}
                            <div className="w-full">
                                <button
                                    onClick={downloadQr}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download PNG
                                </button>
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                            {message}
                        </div>
                    )}

                    <div className="mt-6">
                        <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 py-3 rounded-xl font-bold disabled:opacity-70 mb-3">
                            {isSaving ? 'Updating...' : 'Update Profile'}
                        </button>

                        <button onClick={() => router.push('/shop/dashboard')} className="w-full bg-white/10 py-3 rounded-xl font-bold">Back to Dashboard</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
