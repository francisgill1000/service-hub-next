"use client";
import React from 'react';
import Link from 'next/link';

export default function ProvidersPage() {
    return (
        <>
            {/* <section className="px-4 py-4">
                <div className="relative w-full aspect-[21/10] rounded-2xl overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-center bg-no-repeat bg-cover"
                        data-alt="Map view showing nearby service provider locations"
                        style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuCpYAtIt8BPyRxjK3rK4_QcHkxmDqvXNTusmE4wzgL6HVcDVgqQbOSbkXhy6pb8QnQMRTB9Ws7C_T6bdUjX23BsVM6uYP22uDc606gJVmp6I_8Yolif32atPheIkqURbwX2NgWPEpI50WVNAV-cEddHLhJFtVzhUxr6SE4yMGTtz-lOyHYFzoBJpFE2eOANG923livpRBn1mckS0md_z2aP51JpJCBsg9bOSKILAOStf6eGhzPmAtIUqATGZ07fM5YL-jLK-VQquxyG)` }}
                    >
                    </div>
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2">
                        <span
                            className="material-symbols-outlined text-primary text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] fill-1">location_on</span>
                    </div>
                    <div className="absolute top-1/4 right-1/4">
                        <span
                            className="material-symbols-outlined text-primary text-2xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] fill-1">location_on</span>
                    </div>
                    <div
                        className="absolute bottom-3 left-3 flex items-center gap-2 bg-background-dark/90 ios-blur px-3 py-1.5 rounded-full border border-white/10">
                        <span className="material-symbols-outlined text-primary text-sm fill-1">near_me</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Nearby Area</span>
                    </div>
                    <button
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-lg">
                        <span className="material-symbols-outlined text-lg">open_in_full</span>
                    </button>
                </div>
            </section> */}
            <section className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
                <button
                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary px-5 text-white shadow-lg shadow-primary/30">
                    <span className="text-xs font-bold uppercase tracking-wider">Top Rated</span>
                </button>
                <button
                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-navy-accent px-5 text-slate-300 border border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider">Available Now</span>
                </button>
                <button
                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-navy-accent px-5 text-slate-300 border border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider">Price</span>
                </button>
                <button
                    className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-navy-accent px-5 text-slate-300 border border-white/5">
                    <span className="text-xs font-bold uppercase tracking-wider">Distance</span>
                </button>
            </section>
            <main className="flex-1 px-4 space-y-4 pt-4 pb-28">
                <div
                    className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all">
                    <div className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                        data-alt="Interior of a professional plumbing shop"
                        style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuDe6NsGQMcVFXgcWCm3BmiWljgtgH--yDq5x-K3ZYKeEA1yGWWUwStpGQDlbQsuftK3QE28XDQdJw51k5OFzMomh0h5kWLV9LaGbPdsRU78A1faoF4b8qTu2OqJZQvmxhjRUyNMqTestnsojzsH7-1YjWLUeVzr-HP781-x_GYiwaR72L6aGEhYls7qjLGV2j1No4u5n_IGfe4XBMKIDYxiQZioG4IdVOgAAPc9r4YztTrFE2Suk2ubqv5tgd7_6bWRsjntcYAzvNpT)` }}>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Open
                                    Now</span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-base fill-1">star</span>
                                    <span className="text-sm font-bold">4.9</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold leading-tight mt-0.5 tracking-tight">Precision Plumbing Co.</h3>
                            <div className="flex items-center gap-2 mt-1 text-slate-400">
                                <span className="text-[11px] font-semibold">120 reviews</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-[11px] font-semibold">0.8 km</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-black text-white">$45<span
                                className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></p>
                            <button
                                className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-primary/20">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all">
                    <div className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                        data-alt="Professional plumber tools and equipment"
                        style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuBrFqg8Crpc-4wZAWZf3WkZovNCX04Cf1v_IMPWxMMvLPzd6yVl02jdJnY_GJodgi7yydnl4igXdq4tcPInz4rgt67ihtUv8SXnC67eQkeQQRWQF5nWzegzDXkp9tYyDQU6rOXTdNWqV_Zljd1n_cUvyq3Ie3YhP0aWhbJDBnDQEftj9MyxcLeQdRp0TAe4K7WKLNjXyNddjPCyv7c_dP3tnlaINvCAOFi1ELa7E-JFirzXea4im-JfcZpjZHwZJ-f5s7BqbruoJhrY)` }}>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">Closing
                                    Soon</span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-base fill-1">star</span>
                                    <span className="text-sm font-bold">4.7</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold leading-tight mt-0.5 tracking-tight">FlowMaster Repairs</h3>
                            <div className="flex items-center gap-2 mt-1 text-slate-400">
                                <span className="text-[11px] font-semibold">85 reviews</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-[11px] font-semibold">1.2 km</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-black text-white">$38<span
                                className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></p>
                            <button
                                className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-primary/20">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all">
                    <div className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                        data-alt="Modern sink repair service display"
                        style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuAuUPZtVsHpBOyp1jIIrjjb9mgeW5FIqtDDy-S3itsQF-x-Q7B7mhVttw0Nj0VlKJ6AC-BuEnqGASylsmreu6vKxbsIf5k2qrKrXi1ITv9WvC4oV4eSTSwrcrwd4zYiKahJuO1ks9HuDZ2qfhga2g3ptX-AqaAqzXBdii63Rz9Z4P-QVUKF3gE50FApLPkQwq_yDJCfKsgImfWdgktexqfMb_myGmQ9WQ8fYbrDZOtlXJFVT5i9PC2SsQEqGQdv08dkHcb7P9OZA-N1)` }}>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Open
                                    Now</span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-base fill-1">star</span>
                                    <span className="text-sm font-bold">4.8</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold leading-tight mt-0.5 tracking-tight">Elite Pipe Solutions</h3>
                            <div className="flex items-center gap-2 mt-1 text-slate-400">
                                <span className="text-[11px] font-semibold">210 reviews</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-[11px] font-semibold">1.5 km</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-black text-white">$55<span
                                className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></p>
                            <button
                                className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-primary/20">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all">
                    <div className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                        data-alt="Pipe maintenance and fitting service"
                        style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuDWPUohY8DDPAbtl3RDo4mzzONChEzP_Vke-DI3ASWQczHsyLQtumAhDEm0afzmg6Lzq6kfKLNUvU0hACUMCHXmp7C1ilMvC9UhxU-ykFapxz9eTuqspJZkWu70qkd72OTCzOuCkDvgopD9Ku3vtOhwjKbycL8E8XkIEUg-DjEona5_QOHL_DtvfjV7RcITXj64mcGNWK-BpJOVFCPFtAkWmZsXGnnTgJ9QI4WMdkEUBPLBY9cZ1-Xf0UWSD9uxAwNyiaGMIGttgFYy)` }}>
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Open
                                    Now</span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-yellow-500 text-base fill-1">star</span>
                                    <span className="text-sm font-bold">4.6</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold leading-tight mt-0.5 tracking-tight">Reliable Rooters</h3>
                            <div className="flex items-center gap-2 mt-1 text-slate-400">
                                <span className="text-[11px] font-semibold">45 reviews</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span className="text-[11px] font-semibold">2.1 km</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-lg font-black text-white">$40<span
                                className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span></p>
                            <button
                                className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-primary/20">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}