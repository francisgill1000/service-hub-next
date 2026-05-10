"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "@/utils/api";

const toISO = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const STEPS = [
    { id: 1, label: "Customer",  icon: "person",       subtitle: "Tell us who's booking." },
    { id: 2, label: "Services",  icon: "design_services", subtitle: "Pick the services to book." },
    { id: 3, label: "Schedule",  icon: "event",        subtitle: "Choose date and time." },
];

export default function CreateBookingModal({ open, onClose, shopId, onCreated, initialDate, initialSlot }) {
    const [step, setStep] = useState(1);
    const [date, setDate] = useState(initialDate || toISO(new Date()));
    const [slot, setSlot] = useState("");
    const [selectedServices, setSelectedServices] = useState([]);
    const [chargesOverride, setChargesOverride] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [customerWhatsapp, setCustomerWhatsapp] = useState("");
    const [customerLookup, setCustomerLookup] = useState({ status: "idle", match: null });
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

    const dateOptions = useMemo(() => {
        const arr = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            arr.push({
                iso: toISO(d),
                day: d.getDate(),
                label: d.toLocaleDateString("en-US", { weekday: "short" }),
            });
        }
        return arr;
    }, []);

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
            setStep(1);
            if (initialDate) setDate(initialDate);
        } else {
            setDate(initialDate || toISO(new Date()));
            setSlot("");
            setSelectedServices([]);
            setChargesOverride(null);
            setCustomerName("");
            setCustomerWhatsapp("");
            setCustomerLookup({ status: "idle", match: null });
        }
    }, [open, initialDate]);

    // Debounced lookup of existing walk-in customers by WhatsApp number.
    // Auto-fills the name when a returning customer is matched.
    useEffect(() => {
        if (!open || !shopId) return;

        const digits = customerWhatsapp.replace(/\D+/g, "");
        if (digits.length < 7) {
            setCustomerLookup({ status: "idle", match: null });
            return;
        }

        let cancelled = false;
        setCustomerLookup((s) => ({ status: "searching", match: s.match }));

        const t = setTimeout(async () => {
            try {
                const { data } = await api.get(`/shops/${shopId}/customers/lookup`, {
                    params: { whatsapp: customerWhatsapp },
                });
                if (cancelled) return;
                if (data?.found) {
                    setCustomerLookup({ status: "found", match: data });
                    setCustomerName((prev) => (prev.trim() === "" ? data.name || "" : prev));
                } else {
                    setCustomerLookup({ status: "none", match: null });
                }
            } catch {
                if (!cancelled) setCustomerLookup({ status: "none", match: null });
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [customerWhatsapp, open, shopId]);

    const toggleService = (id) => {
        setSelectedServices((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const canAdvanceFrom1 = customerName.trim().length > 0 && customerWhatsapp.trim().length > 0;
    const canAdvanceFrom2 = selectedServices.length > 0;
    const canSubmit       = !!date && !!slot && canAdvanceFrom1 && canAdvanceFrom2;

    const handleNext = () => {
        if (step === 1 && !canAdvanceFrom1) {
            return Swal.fire({ icon: "warning", title: "Enter customer details" });
        }
        if (step === 2 && !canAdvanceFrom2) {
            return Swal.fire({ icon: "warning", title: "Select at least one service" });
        }
        setStep((s) => Math.min(3, s + 1));
    };

    const handleBack = () => setStep((s) => Math.max(1, s - 1));

    const submit = async () => {
        if (!canSubmit) {
            if (!slot) return Swal.fire({ icon: "warning", title: "Pick a time slot" });
            if (!date) return Swal.fire({ icon: "warning", title: "Pick a date" });
        }

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

    const selectedCatalogs = catalogs.filter((c) => selectedServices.includes(c.id));
    const currentStep = STEPS[step - 1];

    return (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
            <div className="w-full md:w-[640px] max-h-[95vh] md:max-h-[90vh] flex flex-col bg-brand-surface md:rounded-2xl rounded-t-2xl border border-brand-border/30 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-brand-border/30 bg-gradient-to-b from-brand-elevated to-brand-surface">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-brand-text tracking-tight">New booking</h3>
                            <p className="text-[11px] text-brand-muted font-semibold mt-0.5">
                                {currentStep.subtitle}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-9 rounded-xl bg-brand-elevated hover:bg-brand-hover text-brand-muted hover:text-brand-primary flex items-center justify-center transition-all shrink-0"
                            aria-label="Close"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Stepper */}
                    <Stepper step={step} />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {step === 1 && (
                        <CustomerStep
                            customerName={customerName}
                            setCustomerName={setCustomerName}
                            customerWhatsapp={customerWhatsapp}
                            setCustomerWhatsapp={setCustomerWhatsapp}
                            customerLookup={customerLookup}
                        />
                    )}

                    {step === 2 && (
                        <ServicesStep
                            loading={loading}
                            catalogs={catalogs}
                            selectedServices={selectedServices}
                            toggleService={toggleService}
                        />
                    )}

                    {step === 3 && (
                        <ScheduleStep
                            dateOptions={dateOptions}
                            date={date}
                            setDate={setDate}
                            loading={loading}
                            slots={slots}
                            slot={slot}
                            setSlot={setSlot}
                            charges={charges}
                            chargesOverride={chargesOverride}
                            setChargesOverride={setChargesOverride}
                            autoTotal={autoTotal}
                            selectedCatalogs={selectedCatalogs}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-brand-border/30 flex items-center justify-between gap-3 bg-brand-elevated md:rounded-b-2xl">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                            {step === 3 ? "Total" : `${selectedServices.length} service${selectedServices.length === 1 ? "" : "s"}`}
                        </p>
                        <p className="text-lg font-black text-brand-text truncate">
                            AED {Number(charges || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="h-11 px-4 rounded-xl bg-brand-elevated hover:bg-brand-hover text-sm font-bold text-brand-text transition-all"
                            >
                                Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-11 px-4 rounded-xl bg-brand-elevated hover:bg-brand-hover text-sm font-bold text-brand-text transition-all"
                            >
                                Cancel
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={(step === 1 && !canAdvanceFrom1) || (step === 2 && !canAdvanceFrom2)}
                                className="h-11 px-5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={submit}
                                disabled={submitting || !canSubmit}
                                className="h-11 px-5 rounded-xl bg-brand-success hover:bg-brand-success/90 text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Creating…" : "Create booking"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────── Sub-components ─────────────── */

function Stepper({ step }) {
    return (
        <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
                const active = s.id === step;
                const done = s.id < step;
                return (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className={`size-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                    active
                                        ? "bg-brand-primary text-white"
                                        : done
                                        ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40"
                                        : "bg-brand-elevated text-brand-muted border border-brand-border/40"
                                }`}
                            >
                                {done ? (
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                ) : (
                                    <span className="text-xs font-black">{s.id}</span>
                                )}
                            </div>
                            <span
                                className={`text-[11px] font-black uppercase tracking-widest hidden sm:inline truncate ${
                                    active ? "text-white" : done ? "text-brand-primary" : "text-brand-muted"
                                }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-px ${done ? "bg-brand-primary/40" : "bg-brand-border/40"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function CustomerStep({ customerName, setCustomerName, customerWhatsapp, setCustomerWhatsapp, customerLookup }) {
    const lookupStatus = customerLookup?.status || "idle";
    const match = customerLookup?.match;

    return (
        <div className="space-y-5">
            <div className="text-center pb-2">
                <div className="size-14 mx-auto rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px] text-brand-primary">person_add</span>
                </div>
                <h4 className="text-base font-black text-brand-text">Who's booking?</h4>
                <p className="text-[11px] text-brand-muted font-semibold mt-1">
                    Enter the walk-in customer's contact details.
                </p>
            </div>

            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                    WhatsApp number
                </label>
                <div className="mt-2 relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-success text-[18px] pointer-events-none">
                        chat
                    </span>
                    <input
                        type="tel"
                        inputMode="tel"
                        value={customerWhatsapp}
                        onChange={(e) => setCustomerWhatsapp(e.target.value)}
                        placeholder="+971 5X XXX XXXX"
                        autoFocus
                        className="w-full h-12 bg-brand-bg border border-brand-border/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-success/20 focus:border-brand-success/40 outline-none transition-all"
                    />
                </div>

                {lookupStatus === "searching" && (
                    <p className="text-[10px] font-semibold text-brand-muted mt-1.5">
                        Checking past bookings…
                    </p>
                )}
                {lookupStatus === "found" && match && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-brand-success/10 border border-brand-success/30 px-3 py-2">
                        <span className="material-symbols-outlined text-[16px] text-brand-success">how_to_reg</span>
                        <p className="text-[11px] font-bold text-brand-success truncate">
                            Returning customer: {match.name || "Unnamed"} · {match.bookings_count} past booking{match.bookings_count === 1 ? "" : "s"}
                        </p>
                    </div>
                )}
                {lookupStatus === "none" && (
                    <p className="text-[10px] font-semibold text-brand-muted mt-1.5">
                        New customer — we'll save their name with this booking.
                    </p>
                )}
                {lookupStatus === "idle" && (
                    <p className="text-[10px] font-semibold text-brand-muted mt-1.5">
                        We'll use this to confirm the booking.
                    </p>
                )}
            </div>

            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                    Customer name
                </label>
                <div className="mt-2 relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-[18px] pointer-events-none">
                        person
                    </span>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full name"
                        className="w-full h-12 bg-brand-bg border border-brand-border/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
}

function ServicesStep({ loading, catalogs, selectedServices, toggleService }) {
    if (loading) {
        return (
            <div className="text-brand-muted text-sm font-semibold py-12 text-center">
                Loading services…
            </div>
        );
    }

    if (catalogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-brand-border/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] text-brand-muted">
                        inventory_2
                    </span>
                </div>
                <p className="text-sm font-bold text-brand-muted">No services in your catalog yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {catalogs.map((c) => {
                const active = selectedServices.includes(c.id);
                const initials = String(c.title || "S")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                return (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleService(c.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all ${
                            active
                                ? "bg-brand-primary/10 border-brand-primary/50 shadow-[inset_0_0_0_1px_rgba(75,142,255,0.18)]"
                                : "bg-brand-bg border-brand-border/30 hover:border-brand-border/60"
                        }`}
                    >
                        <div className="w-14 h-14 rounded-xl bg-brand-elevated border border-brand-border/30 overflow-hidden flex items-center justify-center shrink-0">
                            {c.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-black text-brand-text">{initials}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-brand-text truncate">{c.title}</p>
                            <p className="text-[11px] text-brand-muted font-semibold truncate mt-0.5">
                                {c.description || "No description"}
                            </p>
                            <p className="text-sm font-black text-brand-success mt-1">
                                AED {Number(c.price || 0).toFixed(0)}
                            </p>
                        </div>
                        <div
                            className={`size-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                                active
                                    ? "bg-brand-primary text-white"
                                    : "bg-brand-elevated text-brand-muted border border-brand-border/30"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {active ? "check" : "add"}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function ScheduleStep({
    dateOptions,
    date,
    setDate,
    loading,
    slots,
    slot,
    setSlot,
    charges,
    chargesOverride,
    setChargesOverride,
    autoTotal,
    selectedCatalogs,
}) {
    return (
        <div className="space-y-5">
            {/* Date chips */}
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                    Appointment date
                </label>
                <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    {dateOptions.map((d) => {
                        const active = d.iso === date;
                        return (
                            <button
                                key={d.iso}
                                type="button"
                                onClick={() => setDate(d.iso)}
                                className={`shrink-0 w-[72px] py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                    active
                                        ? "bg-brand-primary border-brand-primary text-white"
                                        : "bg-brand-bg border-brand-border/30 text-brand-text hover:border-brand-primary/40"
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {d.label}
                                </span>
                                <span className="text-xl font-black leading-none">{d.day}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time slots */}
            <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                    Time slot
                </label>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {loading && (
                        <div className="col-span-full text-brand-muted text-xs font-semibold py-4 text-center">
                            Loading slots…
                        </div>
                    )}
                    {!loading && slots.length === 0 && (
                        <div className="col-span-full text-brand-muted text-xs font-semibold py-4 text-center">
                            No slots available on this date.
                        </div>
                    )}
                    {slots.map((s) => {
                        const active = slot === s;
                        return (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSlot(s)}
                                className={`h-11 rounded-xl border text-xs font-black transition-all ${
                                    active
                                        ? "bg-brand-primary border-brand-primary text-white"
                                        : "bg-brand-bg border-brand-border/30 text-brand-text hover:border-brand-primary/40 hover:text-brand-primary"
                                }`}
                            >
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Summary */}
            {selectedCatalogs.length > 0 && (
                <div className="bg-brand-bg border border-brand-border/30 rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-3">
                        Order summary
                    </p>
                    <div className="space-y-2">
                        {selectedCatalogs.map((c) => (
                            <div key={c.id} className="flex items-center justify-between text-xs">
                                <span className="text-brand-text font-semibold truncate pr-2">
                                    {c.title}
                                </span>
                                <span className="text-brand-text font-black shrink-0">
                                    AED {Number(c.price || 0).toFixed(0)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-border/30 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">
                            Subtotal
                        </span>
                        <span className="text-sm font-black text-brand-text">
                            AED {Number(autoTotal || 0).toFixed(2)}
                        </span>
                    </div>

                    {/* Custom override */}
                    <div className="mt-3 pt-3 border-t border-brand-border/30">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                                Custom charges
                            </label>
                            {chargesOverride !== null && chargesOverride !== autoTotal && (
                                <button
                                    type="button"
                                    onClick={() => setChargesOverride(null)}
                                    className="text-[10px] font-black text-brand-text hover:underline"
                                >
                                    Reset to subtotal
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-[18px] pointer-events-none">
                                payments
                            </span>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={charges}
                                onChange={(e) =>
                                    setChargesOverride(
                                        e.target.value === "" ? null : Number(e.target.value)
                                    )
                                }
                                className="w-full h-11 bg-brand-surface border border-brand-border/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
