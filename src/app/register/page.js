"use client";

import React, { useState } from 'react';
import ServiceSelector from '@/components/ServiceSelector';
import LogoUploader from '@/components/LogoUploader';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';
import { useRouter } from 'next/navigation';
import HeroImageUploader from '@/components/HeroImageUploader';

const App = () => {
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        category_id: 1,
        lat: null,
        lon: null,
        location: "",
        address: "",
        phone: "",
        website: "",
        is_verified: true,
        logo: null,
        hero_image: null // New Field
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Register the shop
            // Laravel saves the device_id from the header and creates the shop
            const response = await api.post("shops", form);

            // 2. Immediate Token Handling
            // If your Laravel store method returns the token (as we discussed)
            if (response.data.token && response.data.shop) {
                if (typeof window !== "undefined") {
                    const shopCode = response.data.shop.shop_code ?? "";
                    const pin = response.data.shop.pin ?? "";

                    sessionStorage.setItem(
                        "post_register_login_prefill",
                        JSON.stringify({ shopCode, pin })
                    );
                }

                await notify({
                    title: 'Welcome!',
                    text: 'Your shop profile is ready.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });

                // 3. Send them to login with prefilled credentials
                router.push('/login');
            } else {
                // Fallback: If for some reason token isn't in register response, 
                router.push('/login');
            }

        } catch (err) {
            notify({
                title: 'Registration Failed',
                text: err.response?.data?.message || "Something went wrong",
                icon: 'error',
                confirmButtonText: 'Try Again',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = "w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-white/20";
    const labelStyle = "text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] text-center mb-4 block";

    return (
        <div className="min-h-screen text-white font-sans flex justify-center items-start p-4 md:p-8">
            <div className="w-full max-w-xl space-y-12 pb-20">

                {/* Header */}
                <header className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Set up your shop</h1>
                    <p className="text-white/40 text-sm">Tell us about your business to get started.</p>
                </header>

                <div className="space-y-10">

                    {/* Basic Info Section */}
                    <section className="space-y-4">
                        <span className={labelStyle}>General Information</span>
                        <input
                            type="text"
                            placeholder="Business Name"
                            className={inputStyle}
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <ServiceSelector
                            category={form.category_id}
                            setCategory={(id) => setForm(prev => ({ ...prev, category_id: Number(id) }))}
                        />
                    </section>

                    {/* Branding & Visuals Section */}
                    <section className="space-y-8">
                        <div className="text-center">
                            <span className={labelStyle}>Identity & Brand</span>
                        </div>

                        <div className="space-y-8">
                            {/* 1. Logo - Primary Identity */}
                            <div className="flex flex-col items-center space-y-3">
                                <LogoUploader
                                    onChange={(base64) => setForm(prev => ({ ...prev, logo: base64 }))}
                                />
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                                    Business Logo
                                </p>
                            </div>

                            {/* 2. Hero/Cover Image - Visual Appeal */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                                        Cover Banner
                                    </p>
                                    <p className="text-[9px] text-white/20 italic">Recommended: 16:9 aspect ratio</p>
                                </div>

                                <div className="h-44 w-full bg-[#151921] rounded-2xl border border-white/10 overflow-hidden shadow-inner">
                                    <HeroImageUploader
                                        label="Select Cover Photo"
                                        onChange={(base64) => setForm(prev => ({ ...prev, hero_image: base64 }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="space-y-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full ${isSubmitting ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500'} active:scale-[0.99] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20`}
                    >
                        {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
                    </button>

                    <p className="text-center text-[11px] text-white/30 leading-relaxed max-w-[320px] mx-auto">
                        By registering, you agree to our <span className="text-white/60 font-medium cursor-pointer hover:underline">Terms</span> and <span className="text-white/60 font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;
