"use client";

import React, { useState } from 'react';
import GPSTracker from '@/components/GPSTracker';
import ServiceSelector from '@/components/ServiceSelector';
import LogoUploader from '@/components/LogoUploader';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';
import { useRouter } from 'next/navigation';

const App = () => {

    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        category_id: 1,
        lat: null,
        lon: null,
        location: "",
        is_verified: true,

        logo: null
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        try {
            
            await api.post("shops", form);

            await notify({
                title: 'Shop Created!',
                text: 'Congrations your shop has been created.',
                icon: 'success',
                confirmButtonText: 'Ok',
                background: 'dark:bg-slate-800 text-white rounded-2xl',
            });

            router.push(`login`)

        } catch ({ response }) {

            notify({
                title: 'Shop Cannot Created!',
                text: response?.data?.message,
                icon: 'error',
                confirmButtonText: 'Ok',
                background: 'dark:bg-slate-800 text-white rounded-2xl',
            });

        }
    }




    return (
        <div className="min-h-screen  text-white font-sans flex justify-center items-start p-4 md:p-8">
            <div className="w-full max-w-md space-y-8 pb-12">

                {/* Header */}
                <header className="flex items-center justify-center mb-8">
                    <h1 className="text-xl font-semibold tracking-tight">Register Your Business</h1>
                </header>

                {/* Brand Section */}
                <section className="space-y-6">
                    <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] text-center">
                        Identity & Brand
                    </h2>

                    <div className="flex flex-col items-center">
                        <LogoUploader
                            onChange={(base64) =>
                                setForm(prev => ({ ...prev, logo: base64 }))
                            }
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Business Name"
                                value={form.name}
                                onChange={(e) =>
                                    setForm(prev => ({ ...prev, name: e.target.value }))
                                } className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-white/20"
                            />
                        </div>

                        {/* Reusable Service Component */}
                        <ServiceSelector
                            category={form.category_id}
                            setCategory={(id) =>
                                setForm(prev => ({ ...prev, category_id: Number(id) }))
                            }
                        />

                    </div>
                </section>

                <section className='space-y-4'>
                    <div className="mb-5">
                        <h3 className="text-xl font-semibold mb-1">Location</h3>
                        <p className="text-white/40 text-sm">Pinpoint your shop for local customers.</p>
                    </div>

                    <GPSTracker
                        setError={setError}
                        onSuccess={(data) => {
                            setForm(prev => ({
                                ...prev,
                                lat: data.lat,
                                lon: data.lon,
                                location: data.address,
                                is_verified: true,
                            }));
                        }}
                    />


                </section>

                {error && (
                    <p className="text-red-400 text-xs bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">{error}</p>
                )}


                <footer className="pt-8 space-y-4">
                    <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20">
                        Register My Business
                    </button>

                    <p className="text-center text-[11px] text-white/30 leading-relaxed max-w-[280px] mx-auto">
                        By registering, you agree to our <span className="text-white/60 font-medium cursor-pointer hover:underline">Terms of Service</span> and <span className="text-white/60 font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;