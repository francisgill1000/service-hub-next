"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';

const ConfirmationPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();

    const shopId = searchParams.get("id");

    const [isVisible, setIsVisible] = useState(false);

    const [bookingDetails, setBookingDetails] = useState(null);

    useEffect(() => {
        api.get(`/booking/${shopId}`).then((response) => {
            console.log("Booking Details:", response.data);
            setBookingDetails(response.data);

        }).catch((error) => {
            console.error("Error fetching booking details:", error);
        });

        setTimeout(() => {
            // Trigger visibility after a short delay for animation
            setIsVisible(true);
        }, 100);
    }, []);


    return (
        <div className="bg-[#0B121E] text-white font-sans min-h-screen flex flex-col selection:bg-[#137fec]/30 overflow-x-hidden">

            {/* Main Content Scrollable Area */}
            <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">

                {/* Updated Success Icon (Filled Version to match Material design) */}
                <div className={`relative mb-10 flex items-center justify-center transition-all duration-700 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                    <div className="absolute w-32 h-32 bg-[#137fec]/30 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute w-24 h-24 bg-[#137fec]/20 rounded-full blur-xl"></div>
                    <div className="relative w-24 h-24 bg-[#137fec]/10 border-2 border-[#137fec]/50 rounded-full flex items-center justify-center shadow-2xl shadow-[#137fec]/20">
                        {/* Custom SVG for Filled Check Circle - Matching the Material Symbol design exactly */}
                        <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-[#137fec] w-16 h-16 drop-shadow-[0_0_15px_rgba(19,127,236,0.5)]"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                </div>

                {/* Hero Text */}
                <div className="text-center mb-6">

                    <h1 className="text-white tracking-tight text-3xl font-extrabold leading-tight mb-2">
                        Booking Confirmed!
                    </h1>

                    <p className="text-gray-400 text-base max-w-[280px] mx-auto">
                        Your service provider is scheduled and ready to help you out.
                    </p>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center px-5 py-1.5 rounded-full bg-[#137fec]/10 border border-[#137fec]/30 mb-10 transition-all hover:bg-[#137fec]/20 cursor-default">
                    <div className="w-2 h-2 rounded-full bg-[#137fec] mr-2 shadow-[0_0_8px_rgba(19,127,236,0.8)] animate-pulse"></div>
                    <span className="text-[#137fec] text-xs font-bold tracking-widest uppercase">Confirmed</span>
                </div>

                {/* Provider Visual Card */}
                <div className="w-full mb-6 group">
                    <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-[#1E293B] relative transition-transform duration-300 hover:scale-[1.01]">
                        <div
                            className="w-full h-full bg-center bg-no-repeat bg-cover flex items-end p-5 bg-gradient-to-t from-[#0B121E] via-[#0B121E]/40 to-transparent"
                            style={{ backgroundImage: `url(${bookingDetails?.shop?.hero_image})` }}                        >
                        </div>
                    </div>
                </div>

                {/* Booking Details Card */}
                <div className="w-full bg-[#151F2D] rounded-2xl p-6 shadow-xl border border-[#1E293B]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Booking Reference</p>
                            <p className={`text-sm font-bold text-right`}>
                                <span>BK{String(bookingDetails?.id).padStart(5, '0')}</span>
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Shop</p>
                            <p className={`text-sm font-bold text-right`}>
                                {bookingDetails?.shop?.name}
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Date</p>
                            <p className={`text-sm font-bold text-right`}>
                                {bookingDetails?.date}
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Time</p>
                            <p className={`text-sm font-bold text-right`}>
                                {bookingDetails?.start_time} - {bookingDetails?.end_time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Support Text */}
                <p className="mt-8 text-gray-500 text-xs text-center px-6 leading-relaxed">
                    A confirmation email has been sent to your inbox. You can manage this booking anytime in your activity tab.
                </p>
            </main>

            {/* Persistent Footer Actions */}
            <footer className="px-6 pt-6 pb-12 bg-[#0B121E]/95 backdrop-blur-xl border-t border-[#1E293B]/50 space-y-4 max-w-lg mx-auto w-full">
                <button onClick={() => router.push(`/`)} className="w-full bg-[#137fec] hover:bg-[#137fec]/90 active:scale-[0.98] text-white font-bold h-[60px] rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#137fec]/20 group">
                    Book Again
                </button>
            </footer>

            <div className="h-4 bg-[#0B121E]"></div>
        </div>
    );
};

export default ConfirmationPage;