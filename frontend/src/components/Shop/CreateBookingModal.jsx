"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "@/utils/api";

const toISO = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const fromISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

export default function CreateBookingModal({ open, onClose, shopId, onCreated, initialDate, initialSlot }) {
    const [date, setDate] = useState(initialDate || toISO(new Date()));
    const [slot, setSlot] = useState("");
    const [selectedServices, setSelectedServices] = useState([]);
    const [chargesOverride, setChargesOverride] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [customerWhatsapp, setCustomerWhatsapp] = useState("");
    const [catalogs, setCatalogs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const autoTotal = useMemo(
        () =>
            catalogs
                .filter((c) => selectedServices.includes(c.id))
                .reduce((sum, c) => sum + Number(c.price || 0), 0),
        [catalogs, selectedServices]
    );

    const charges = chargesOverride ?? autoTotal;

    useEffect(() => {
        if (!open) return;
        setSlot("");
        if (!date || !shopId) return;

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/shops/${shopId}`, { params: { date } });
                if (cancelled) return;
                setCatalogs(data?.catalogs || []);
                setSlots(data?.slots || []);
                if (initialSlot && (data?.slots || []).includes(initialSlot)) {
                    setSlot(initialSlot);
                }
            } catch (e) {
                if (!cancelled) {
                    setCatalogs([]);
                    setSlots([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, date, shopId, initialSlot]);

    useEffect(() => {
        if (open) {
            if (initialDate) setDate(initialDate);
        } else {
            setDate(initialDate || toISO(new Date()));
            setSlot("");
            setSelectedServices([]);
            setChargesOverride(null);
            setCustomerName("");
            setCustomerWhatsapp("");
        }
    }, [open, initialDate]);

    const toggleService = (id) => {
        setSelectedServices((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const submit = async () => {
        if (!date) return Swal.fire({ icon: "warning", title: "Pick a date" });
        if (!slot) return Swal.fire({ icon: "warning", title: "Pick a time slot" });
        if (!customerName.trim()) return Swal.fire({ icon: "warning", title: "Enter customer name" });
        if (!customerWhatsapp.trim()) return Swal.fire({ icon: "warning", title: "Enter WhatsApp number" });

        const payload = {
            date,
            start_time: slot,
            charges: Number(charges) || 0,
            services: catalogs
                .filter((c) => selectedServices.includes(c.id))
                .map((c) => ({ id: c.id, title: c.title, price: Number(c.price || 0) })),
            customer_name: customerName.trim(),
            customer_whatsapp: customerWhatsapp.trim(),
        };

        try {
            setSubmitting(true);
            const { data } = await api.post(`/shops/${shopId}/book`, payload);
            await Swal.fire({
                icon: "success",
                title: "Booking created",
                text: data?.data?.booking_reference
                    ? `Reference: ${data.data.booking_reference}`
                    : undefined,
                timer: 1800,
                showConfirmButton: false,
            });
            onCreated?.(data?.data);
            onClose?.();
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "Could not create booking",
                text: e?.response?.data?.message || e.message,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
            <div className="w-full md:w-[560px] max-h-[92vh] md:max-h-[85vh] flex flex-col bg-[#151c25] md:rounded-2xl rounded-t-2xl border border-[#414755]/30 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#414755]/30">
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">New booking</h3>
                        <p className="text-[11px] text-[#8b90a0] font-semibold mt-0.5">
                            Create a booking on behalf of a walk-in customer.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                    {/* Customer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Customer name</label>
                            <div className="mt-2 relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">person</span>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">WhatsApp number</label>
                            <div className="mt-2 relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4edea3] text-[18px] pointer-events-none">chat</span>
                                <input
                                    type="tel"
                                    inputMode="tel"
                                    value={customerWhatsapp}
                                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                                    placeholder="+971 5X XXX XXXX"
                                    className="w-full h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#4edea3]/20 focus:border-[#4edea3]/40 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Date</label>
                        <div className="mt-2 relative booking-range-picker">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none z-10">calendar_today</span>
                            <DatePicker
                                selected={fromISO(date)}
                                onChange={(d) => setDate(toISO(d))}
                                minDate={new Date()}
                                dateFormat="yyyy-MM-dd"
                                calendarClassName="booking-range-cal"
                                popperPlacement="bottom-start"
                            />
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Services</label>
                            {selectedServices.length > 0 && (
                                <span className="text-[10px] font-bold text-[#adc6ff]">
                                    {selectedServices.length} selected
                                </span>
                            )}
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {loading && (
                                <div className="col-span-full text-[#8b90a0] text-xs font-semibold py-4 text-center">Loading services…</div>
                            )}
                            {!loading && catalogs.length === 0 && (
                                <div className="col-span-full text-[#8b90a0] text-xs font-semibold py-4 text-center">No services in your catalog.</div>
                            )}
                            {catalogs.map((c) => {
                                const active = selectedServices.includes(c.id);
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => toggleService(c.id)}
                                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${active
                                                ? "bg-[#adc6ff]/15 border-[#adc6ff]/40 text-white"
                                                : "bg-[#080f17] border-[#414755]/30 text-[#dce3f0] hover:border-[#414755]/60"
                                            }`}
                                    >
                                        <span className="text-sm font-semibold truncate">{c.title}</span>
                                        <span className={`text-xs font-black ${active ? "text-[#adc6ff]" : "text-[#8b90a0]"}`}>
                                            AED {Number(c.price || 0).toFixed(0)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Slots */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Time slot</label>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {loading && (
                                <div className="col-span-full text-[#8b90a0] text-xs font-semibold py-4 text-center">Loading slots…</div>
                            )}
                            {!loading && slots.length === 0 && (
                                <div className="col-span-full text-[#8b90a0] text-xs font-semibold py-4 text-center">No slots available on this date.</div>
                            )}
                            {slots.map((s) => {
                                const active = slot === s;
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSlot(s)}
                                        className={`h-10 rounded-xl border text-xs font-bold transition-all ${active
                                                ? "bg-[#adc6ff] border-[#adc6ff] text-[#0d141d]"
                                                : "bg-[#080f17] border-[#414755]/30 text-[#dce3f0] hover:border-[#adc6ff]/40 hover:text-[#adc6ff]"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Charges */}
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Charges (AED)</label>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">payments</span>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={charges}
                                    onChange={(e) =>
                                        setChargesOverride(e.target.value === "" ? null : Number(e.target.value))
                                    }
                                    className="w-full h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all"
                                />
                            </div>
                            {chargesOverride !== null && chargesOverride !== autoTotal && (
                                <button
                                    type="button"
                                    onClick={() => setChargesOverride(null)}
                                    className="h-11 px-3 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[11px] font-bold text-[#8b90a0] hover:text-white transition-all"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] font-semibold text-[#8b90a0] mt-1.5">
                            Auto-calculated from selected services. Edit to override.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-[#414755]/30 flex items-center justify-between gap-3 bg-[#0f151e] md:rounded-b-2xl">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">Total</p>
                        <p className="text-lg font-black text-white">AED {Number(charges || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-4 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-sm font-bold text-[#8b90a0] hover:text-white transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={submit}
                            disabled={submitting || !slot || !date}
                            className="h-11 px-5 rounded-xl bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-sm font-black text-[#0d141d] transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        >
                            {submitting ? "Creating…" : "Create booking"}
                            {!submitting && <span className="material-symbols-outlined text-[16px]">check</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
