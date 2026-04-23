"use client";

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { Camera } from 'lucide-react';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';
import compressImage from '@/utils/image';

export default function ShopProfile() {
    const router = useRouter();
    const { shop, loading, loginShop, token } = useShop();
    const [isSaving, setIsSaving] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [message, setMessage] = useState('');
    const [form, setForm] = useState({
        name: '',
        location: '',
        lat: '',
        lon: '',
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
            lat: shop.lat ?? '',
            lon: shop.lon ?? '',
            logo: null,
            hero_image: null,
        });
    }, [shop]);

    const qrTarget = shop?.id ? `https://eloquent-services-hub.netlify.app/detail?id=${shop.id}` : '';

    const googleQrUrl = qrTarget
        ? `https://chart.googleapis.com/chart?cht=qr&chs=600x600&chl=${encodeURIComponent(qrTarget)}`
        : '';

    const [qrDataUrl, setQrDataUrl] = useState(null);

    useEffect(() => {
        if (!qrTarget) {
            setQrDataUrl(null);
            return;
        }

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

    if (loading || !shop) return null;

    const hero = shop.hero_image || shop.cover_image || shop.hero || null;
    const logo = shop.logo || shop.avatar || null;

    const handleChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleImageUpload = async (key, file, options = {}) => {
        if (!file) {
            return;
        }

        if (!file.type?.startsWith('image/')) {
            await notify({
                icon: 'error',
                title: 'Invalid file',
                text: 'Please select an image file.',
            });
            return;
        }

        try {
            const compressed = await compressImage(
                file,
                options.maxWidth ?? 1600,
                options.maxHeight ?? 1600,
                options.quality ?? 0.8
            );

            handleChange(key, compressed);
        } catch (error) {
            console.error('Image compression failed', error);
            await notify({
                icon: 'error',
                title: 'Upload failed',
                text: 'Could not process selected image. Please try another image.',
            });
        }
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

            if (form.lat !== '') {
                payload.lat = Number(form.lat);
            }

            if (form.lon !== '') {
                payload.lon = Number(form.lon);
            }

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

    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation || isLocating) {
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = Number(position.coords.latitude.toFixed(7));
                const longitude = Number(position.coords.longitude.toFixed(7));

                let readableLocation = null;

                try {
                    const response = await api.get('/location', {
                        params: {
                            lat: latitude,
                            lon: longitude,
                        },
                    });

                    console.log(response);
                    

                    if (response?.data?.address) {
                        readableLocation = response.data.address;
                    }
                } catch (error) {
                    console.error('Reverse geocoding failed, using coordinates fallback', error);
                }

                setForm(prev => ({
                    ...prev,
                    lat: latitude,
                    lon: longitude,
                    location: readableLocation,
                }));

                handleChange('location', readableLocation);

                setIsLocating(false);
            },
            async (error) => {
                setIsLocating(false);

                await notify({
                    icon: 'error',
                    title: 'Location Error',
                    text: error?.message || 'Unable to fetch your current location.',
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

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
        <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
            <div className="w-full px-4 md:px-6 pt-6 md:pt-8">

                {/* Page heading */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white tracking-tight">Shop Profile</h2>
                    <p className="text-[#8b90a0] font-semibold mt-1 text-sm">Manage your shop identity and public information.</p>
                </div>

                {/* Hero / Cover */}
                <div className="relative rounded-xl overflow-visible mb-14">
                    <label className="relative block cursor-pointer group h-48 w-full bg-[#151c25] rounded-xl overflow-hidden">
                        {form.hero_image ? (
                            <>
                                <img src={form.hero_image} alt="cover preview" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute top-3 left-4 bg-black/40 text-[11px] px-2 py-1 rounded-lg backdrop-blur-sm text-white">Preview</div>
                            </>
                        ) : hero ? (
                            <img src={hero} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8b90a0]">
                                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                                <span className="text-xs font-semibold">Click to upload cover image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 bg-[#4b8eff] hover:bg-[#adc6ff] p-2.5 rounded-xl shadow-lg transition-all">
                            <Camera size={18} className="text-[#002e69]" />
                        </div>
                        <input type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                await handleImageUpload('hero_image', file, { maxWidth: 1920, maxHeight: 1080, quality: 0.75 });
                            }}
                        />
                    </label>

                    {/* Logo */}
                    <label className="absolute -bottom-12 left-6 w-24 h-24 rounded-full bg-[#19202a] border-4 border-[#0d141d] z-30 shadow-2xl cursor-pointer block">
                        {form.logo ? (
                            <img src={form.logo} alt="logo preview" className="absolute inset-0 w-full h-full object-cover rounded-full" />
                        ) : logo ? (
                            <img src={logo} alt={`${shop.name || 'shop'} logo`} className="absolute inset-0 w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="absolute inset-0 rounded-full bg-[#4b8eff]/20 flex items-center justify-center">
                                <span className="text-[10px] text-[#adc6ff] font-bold uppercase tracking-wider">Logo</span>
                            </div>
                        )}
                        <div className="absolute bottom-1 right-1 z-40 bg-[#4b8eff] p-1.5 rounded-full shadow-lg border-2 border-[#0d141d]">
                            <Camera size={12} className="text-white" />
                        </div>
                        <input type="file" accept="image/*" className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                await handleImageUpload('logo', file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                            }}
                        />
                    </label>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Form fields */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-[#151c25] rounded-xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white">Basic Information</h3>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-2">Business Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-[#080f17] border border-[#414755]/40 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all"
                                    placeholder="Enter business name"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-2">Location</label>
                                <input
                                    value={form.location}
                                    onChange={(e) => handleChange('location', e.target.value || "")}
                                    className="w-full bg-[#080f17] border border-[#414755]/40 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all"
                                    placeholder="Business address or area"
                                />
                                <button
                                    type="button"
                                    onClick={handleUseCurrentLocation}
                                    disabled={isLocating}
                                    className="mt-2 flex items-center gap-2 w-full bg-[#19202a] hover:bg-[#242a34] border border-[#414755]/30 py-2.5 px-4 rounded-xl text-sm font-semibold text-[#c1c6d7] disabled:opacity-50 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px] text-[#adc6ff]">my_location</span>
                                    {isLocating ? 'Fetching location...' : 'Use Current Location'}
                                </button>
                                {form.lat !== '' && form.lon !== '' && (
                                    <p className="mt-2 text-[11px] text-[#8b90a0] font-medium">
                                        Lat: {form.lat}, Lon: {form.lon}
                                    </p>
                                )}
                            </div>
                        </div>

                        {message && (
                            <div className="text-sm text-[#dce3f0] bg-[#151c25] border border-[#414755]/30 rounded-xl px-4 py-3">
                                {message}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-[#adc6ff] to-[#4b8eff] text-[#002e69] font-black py-3 rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-[#adc6ff]/10 text-sm uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => router.push('/shop/dashboard')}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#19202a] hover:bg-[#242a34] border border-[#414755]/30 text-[#c1c6d7] font-semibold py-3 rounded-xl transition-all text-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                Back to Dashboard
                            </button>
                        </div>
                    </div>

                    {/* Right: Credentials + QR */}
                    <div className="space-y-4">
                        {/* Shop Code */}
                        <div className="bg-[#151c25] rounded-xl p-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-3">Shop Code</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-black text-2xl text-white tracking-widest">{shop.shop_code || '—'}</span>
                                <div className="w-10 h-10 rounded-xl bg-[#adc6ff]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-[#adc6ff]">tag</span>
                                </div>
                            </div>
                        </div>

                        {/* PIN */}
                        <div className="bg-[#151c25] rounded-xl p-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-3">Access PIN</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-black text-2xl text-white tracking-widest">{shop.pin || '—'}</span>
                                <div className="w-10 h-10 rounded-xl bg-[#adc6ff]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[20px] text-[#adc6ff]">pin</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="bg-[#151c25] rounded-xl p-6 flex flex-col items-center text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-4">Shop QR Code</p>
                            <div className="p-3 bg-white rounded-xl shadow-lg shadow-black/30 mb-4">
                                <img src={qrImageUrl} alt="shop-qr" className="w-40 h-40 object-contain" />
                            </div>
                            <div className="w-full flex gap-2">
                                <button
                                    onClick={downloadQr}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#19202a] hover:bg-[#242a34] border border-[#414755]/30 text-[#c1c6d7] text-xs font-bold py-2.5 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-[#adc6ff]">download</span>
                                    Download
                                </button>
                                <button
                                    onClick={printQr}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#19202a] hover:bg-[#242a34] border border-[#414755]/30 text-[#c1c6d7] text-xs font-bold py-2.5 rounded-xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-[16px] text-[#adc6ff]">print</span>
                                    Print
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
