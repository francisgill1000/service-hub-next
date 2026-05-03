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
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    const invoicePdfUrl = bookingDetails?.id ? `${apiBase}/booking/${bookingDetails.id}/invoice/pdf` : null;

    const handleMarkInvoicePaid = async () => {
        if (!bookingDetails?.invoice?.id) return;
        setMarkingPaid(true);
        try {
            const { data } = await api.post(`/invoice/${bookingDetails.invoice.id}/mark-paid`);
            setBookingDetails((prev) => ({ ...prev, invoice: { ...prev.invoice, ...data.data } }));
            await notify({
                title: 'Marked Paid',
                text: 'Invoice updated.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (e) {
            await notify({
                icon: 'error',
                title: 'Error',
                text: e?.response?.data?.message || 'Could not mark paid',
            });
        } finally {
            setMarkingPaid(false);
        }
    };

    const sendInvoiceWhatsApp = () => {
        if (!bookingDetails?.customer_whatsapp || !invoicePdfUrl) return;
        const num = String(bookingDetails.customer_whatsapp).replace(/\D/g, '');
        const msg = encodeURIComponent(
            `Your invoice ${bookingDetails.invoice.invoice_number} from ${bookingDetails.shop?.name || 'us'}: ${invoicePdfUrl}`
        );
        window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    };

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

    useEffect(() => {
        const sId = bookingDetails?.shop_id || bookingDetails?.shop?.id;
        if (!sId) return;
        api.get(`/shops/${sId}/staff`)
            .then(({ data }) => setStaffList((data.data || []).filter((s) => s.is_active)))
            .catch(() => setStaffList([]));
    }, [bookingDetails?.shop_id, bookingDetails?.shop?.id]);

    const assignStaff = async () => {
        if (!selectedStaff) return;
        setAssignError(null);
        setAssigning(true);
        try {
            const { data } = await api.post(`/booking/${bookingDetails?.id}/reassign`, {
                staff_id: Number(selectedStaff),
            });
            setBookingDetails((prev) => ({ ...prev, ...data.data, staff: staffList.find((s) => s.id === Number(selectedStaff)) }));
            setSelectedStaff("");
            await notify({
                title: "Assigned",
                text: "Staff has been set for this booking.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (e) {
            if (e?.response?.status === 409) {
                setAssignError("That staff is already booked at this slot.");
            } else {
                setAssignError(e?.response?.data?.message || e.message || "Could not assign staff.");
            }
        } finally {
            setAssigning(false);
        }
    };

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


                {/* Staff Section */}
                {(bookingDetails?.status === "Booked" || bookingDetails?.status === "Queued") && (
                    <div className="w-full mt-8">
                        <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                            <span className="w-1 h-5 bg-[#137fec] rounded-full mr-3"></span>
                            Staff
                        </h3>
                        <div className="w-full rounded-2xl p-5 shadow-xl border border-[#1E293B] space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-gray-400 text-sm font-medium">Currently assigned</p>
                                <p className="text-sm font-bold text-right">
                                    {bookingDetails?.staff?.name ? (
                                        <span className="inline-flex items-center gap-2 text-white">
                                            <span className="w-7 h-7 rounded-full bg-[#137fec]/20 flex items-center justify-center font-bold text-xs text-[#137fec]">
                                                {bookingDetails.staff.name.charAt(0).toUpperCase()}
                                            </span>
                                            {bookingDetails.staff.name}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-lg bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30 font-black text-[10px] uppercase tracking-widest">
                                            Waiting — no staff
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="border-t border-[#1E293B] pt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {bookingDetails?.staff_id ? "Reassign to a different staff" : "Manually assign a staff"}
                                </p>
                                {staffList.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No active staff. Add staff in the Staff page first.</p>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedStaff}
                                            onChange={(e) => setSelectedStaff(e.target.value)}
                                            className="flex-1 h-11 bg-[#0B121E] border border-[#1E293B] rounded-xl px-3 text-sm font-semibold text-white outline-none [color-scheme:dark]"
                                        >
                                            <option value="">Pick a staff…</option>
                                            {staffList.map((s) => (
                                                <option
                                                    key={s.id}
                                                    value={s.id}
                                                    disabled={s.id === bookingDetails?.staff_id}
                                                >
                                                    {s.name}{s.id === bookingDetails?.staff_id ? " (current)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={assignStaff}
                                            disabled={!selectedStaff || assigning}
                                            className="h-11 px-5 rounded-xl bg-[#137fec] hover:bg-[#137fec]/90 disabled:opacity-50 text-sm font-black text-white"
                                        >
                                            {assigning ? "Saving…" : (bookingDetails?.staff_id ? "Reassign" : "Assign")}
                                        </button>
                                    </div>
                                )}
                                {assignError && (
                                    <p className="text-xs text-red-400 mt-2">{assignError}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Invoice Section */}
                {bookingDetails?.invoice && (
                    <div className="w-full mt-8">
                        <h3 className="text-white text-lg font-bold mb-4 flex items-center">
                            <span className="w-1 h-5 bg-[#137fec] rounded-full mr-3"></span>
                            Invoice
                        </h3>
                        <div className="w-full rounded-2xl p-5 shadow-xl border border-[#1E293B] space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Invoice</p>
                                    <p className="text-base font-black text-white">{bookingDetails.invoice.invoice_number}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${
                                    bookingDetails.invoice.status === 'paid'
                                        ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                                        : bookingDetails.invoice.status === 'cancelled'
                                            ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                                            : 'bg-[#137fec]/15 text-[#137fec] border border-[#137fec]/30'
                                }`}>
                                    {bookingDetails.invoice.status}
                                </span>
                            </div>
                            <div className="border-t border-[#1E293B] pt-3 flex justify-between text-sm">
                                <span className="text-gray-400">Total</span>
                                <span className="font-black text-white">AED {Number(bookingDetails.invoice.total).toFixed(2)}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <a
                                    href={invoicePdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-[#137fec]/10 hover:bg-[#137fec]/20 border border-[#137fec]/30 text-[#137fec] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">download</span>
                                    Download PDF
                                </a>

                                {bookingDetails.invoice.status === 'issued' && (
                                    <button
                                        onClick={handleMarkInvoicePaid}
                                        disabled={markingPaid}
                                        className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">paid</span>
                                        {markingPaid ? 'Saving…' : 'Mark Paid'}
                                    </button>
                                )}

                                {bookingDetails.customer_whatsapp && (
                                    <button
                                        onClick={sendInvoiceWhatsApp}
                                        className="flex-1 min-w-[120px] h-11 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">share</span>
                                        Send via WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Persistent Footer Actions */}
            <footer className="px-6 pt-6 pb-12 bg-[#0B121E]/95 backdrop-blur-xl border-t border-[#1E293B]/50 space-y-4 max-w-lg mx-auto w-full">
                <button
                    onClick={() => handleBookingUpdate("Completed")}
                    disabled={isCompleting}
                    className="w-full bg-[#4b8eff] hover:bg-[#4b8eff]/90 active:scale-[0.98] text-white font-bold h-[60px] rounded-2xl transition-all flex items-center justify-center"
                >
                    {isCompleting ? "Marking Complete..." : "Mark as Complete"}
                </button>

                <button
                    onClick={() => handleBookingUpdate("Cancelled")}
                    disabled={isCancelling}
                    className="w-full bg-[#EF4444] hover:bg-red-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold h-[60px] rounded-2xl transition-all flex items-center justify-center"
                >
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