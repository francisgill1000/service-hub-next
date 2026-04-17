"use client"
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';

const BookingLoader = () => (
    <div className="bg-[#0B121E] text-white font-sans min-h-screen flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-primary rounded-full mb-4"></div>
            <p className="text-gray-400 text-sm">Loading booking details...</p>
        </div>
    </div>
);

const ConfirmationPageContent = () => {

    const router = useRouter();
    const searchParams = useSearchParams();

    const shopId = searchParams.get("id");

    const [isVisible, setIsVisible] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

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
    }, [shopId]);

    const handleBookingUpdate = async (status = "Completed") => {
        if (status === "Completed") {
            setIsCompleting(true);
        } else if (status === "Cancelled") {
            setIsCancelling(true);
        }
        try {
            await api.put(`/booking/${bookingDetails?.id}`, { status });

            // Update local state
            setBookingDetails(prev => ({
                ...prev,
                status: status
            }));


            await notify({
                title: 'Welcome!',
                text: `Booking has been ${status.toLowerCase()}.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error("Error updating booking status:", error);
        } finally {
            setIsCompleting(false);
            setIsCancelling(false);
        }
    };

    return (
        <div className="bg-[#0B121E] text-white font-sans min-h-screen flex flex-col selection:bg-[#137fec]/30 overflow-x-hidden">
            {/* Main Content Scrollable Area */}
            <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
                <section className="flex flex-col items-center mb-10">
                    <div className={`relative my-10 flex items-center justify-center transition-all duration-700 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
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
                    <h2 className="text-2xl font-bold tracking-tight mb-1">Booking Info </h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Details mentioned below</p>

                    <div className={`inline-flex items-center px-5 py-1.5 rounded-full border mb-10 transition-all ${bookingDetails?.status === "Completed"
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-[#137fec]/10 border-[#137fec]/30"
                        } cursor-default`}>
                        <div className={`w-2 h-2 rounded-full mr-2 shadow-lg animate-pulse ${bookingDetails?.status === "Completed"
                            ? "bg-green-500 shadow-green-500"
                            : "bg-[#137fec] shadow-[#137fec]"
                            }`}></div>
                        <span className={`text-xs font-bold tracking-widest uppercase ${bookingDetails?.status === "Completed"
                            ? "text-green-500"
                            : "text-[#137fec]"
                            }`}>{bookingDetails?.status || "Booked"}</span>
                    </div>
                    {/* <div className="flex gap-4 w-full">
                        <button
                            className="flex-1 flex items-center justify-center gap-2 h-12 bg-white/5 rounded-xl text-sm font-bold border border-white/10 active:bg-white/10">
                            <span className="material-symbols-outlined text-lg">mail</span> Message
                        </button>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 h-12 bg-white/5 rounded-xl text-sm font-bold border border-white/10 active:bg-white/10">
                            <span className="material-symbols-outlined text-lg">call</span> Call
                        </button>
                    </div> */}
                </section>
                {/* Booking Details Card */}
                <div className="w-full rounded-2xl p-6 shadow-xl border border-[#1E293B]">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Booking Reference</p>
                            <p className={`text-sm font-bold text-right`}>
                                <span>{bookingDetails?.booking_reference}</span>
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Date</p>
                            <p className={`text-sm font-bold text-right`}>
                                {bookingDetails?.show_date}
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Time</p>
                            <p className={`text-sm font-bold text-right`}>
                                {bookingDetails?.start_time} - {bookingDetails?.end_time}
                            </p>
                        </div>
                        <div className="flex justify-between items-center gap-x-6">
                            <p className="text-gray-400 text-sm font-medium">Total Charges</p>
                            <p className={`text-sm font-bold text-right`}>
                                AED {bookingDetails?.charges}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Services Section */}
                <div className="w-full mt-8">
                    <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                        <span className="w-1 h-5 bg-[#137fec] rounded-full mr-3"></span>
                        Services Booked
                    </h3>

                    <div className="w-full mb-3 rounded-2xl shadow-xl border border-[#1E293B] divide-y divide-[#1E293B]">
                        {bookingDetails?.services.map((item) => (
                            <div key={item.id} className="p-5 flex justify-between items-center group hover:bg-[#1E293B]/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                                <div className="flex flex-col">
                                    <span className="text-gray-200 font-semibold">{item.title}</span>
                                    <span className="text-gray-500 text-xs uppercase tracking-wider">{item.description}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#137fec] font-bold">AED {item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Persistent Footer Actions */}
            <footer className="px-6 pt-6 pb-12 bg-[#0B121E]/95 backdrop-blur-xl border-t border-[#1E293B]/50 space-y-4 max-w-lg mx-auto w-full">
                <button
                    onClick={() => handleBookingUpdate("Completed")}
                    disabled={isCompleting}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold h-[60px] rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                    <span className="material-symbols-outlined">check_circle</span>
                    {isCompleting ? "Marking Complete..." : "Mark as Complete"}
                </button>

                <button
                    onClick={() => handleBookingUpdate("Cancelled")}
                    disabled={isCancelling}
                    className="w-full bg-[#EF4444] hover:bg-red-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold h-[60px] rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                >
                    <span className="material-symbols-outlined">cancel</span>
                    {isCancelling ? "Marking Cancelled..." : "Mark as Cancelled"}
                </button>
            </footer>

            <div className="h-4 bg-[#0B121E]"></div>
        </div>
    );
};

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<BookingLoader />}>
            <ConfirmationPageContent />
        </Suspense>
    );
}