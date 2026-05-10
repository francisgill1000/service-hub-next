"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import api from "@/utils/api";

const STATUS_CHIP = {
  booked:    "bg-brand-primary/15 text-brand-primary border border-brand-primary/20",
  queued:    "bg-brand-warning/15 text-brand-warning border border-brand-warning/20",
  completed: "bg-brand-success/15 text-brand-success border border-brand-success/20",
  cancelled: "bg-brand-border/40 text-brand-muted border border-brand-border/30",
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

const formatTime = (t) => {
  if (!t) return "";
  try {
    const safe = t.length === 5 ? `${t}:00` : t;
    const d = new Date(`1970-01-01T${safe}`);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return t;
  }
};

export default function FindBookingModal({ open, onClose, bookings, onUpdated }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Reset query when modal toggles closed.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Filter + sort: today/upcoming first, then by date + start time.
  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const todayISO = new Date().toISOString().slice(0, 10);

    const matches = (b) => {
      if (!trimmed) return false; // empty query → no results (forces typing)
      const name = (b.customer?.name || b.customer_name || "").toLowerCase();
      const phone = String(b.customer_whatsapp || "").replace(/\D+/g, "");
      const ref = String(b.booking_reference || "").toLowerCase();
      const digits = trimmed.replace(/\D+/g, "");
      return (
        name.includes(trimmed) ||
        ref.includes(trimmed) ||
        (digits.length >= 3 && phone.includes(digits))
      );
    };

    const list = (bookings || []).filter(matches);
    // Sort: today first, then by date asc then start_time asc.
    list.sort((a, b) => {
      const aToday = (a.date || "") === todayISO ? 0 : 1;
      const bToday = (b.date || "") === todayISO ? 0 : 1;
      if (aToday !== bToday) return aToday - bToday;
      const ad = (a.date || "") + " " + (a.start_time || "");
      const bd = (b.date || "") + " " + (b.start_time || "");
      return ad.localeCompare(bd);
    });
    return list.slice(0, 20);
  }, [bookings, query]);

  const updateStatus = async (booking, nextStatus) => {
    const verb = nextStatus === "Completed" ? "mark complete" : "cancel";
    const confirm = await Swal.fire({
      icon: nextStatus === "Cancelled" ? "warning" : "question",
      title: `${verb.charAt(0).toUpperCase() + verb.slice(1)} this booking?`,
      html: `<div class="text-sm">${booking.customer?.name || booking.customer_name || "Guest"} · ${formatDate(booking.date)} ${formatTime(booking.start_time) || ""}</div>`,
      showCancelButton: true,
      confirmButtonText: nextStatus === "Cancelled" ? "Cancel booking" : "Mark complete",
      confirmButtonColor: nextStatus === "Cancelled" ? "#C0392B" : "#1D9E75",
    });
    if (!confirm.isConfirmed) return;

    setBusyId(booking.id);
    try {
      await api.put(`/booking/${booking.id}`, { status: nextStatus });
      await Swal.fire({
        icon: "success",
        title: nextStatus === "Completed" ? "Marked complete" : "Booking cancelled",
        timer: 1300,
        showConfirmButton: false,
      });
      onUpdated?.();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Could not update booking",
        text: e?.response?.data?.message || e.message,
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full md:w-[640px] max-h-[95vh] md:max-h-[85vh] flex flex-col bg-brand-surface md:rounded-2xl rounded-t-2xl border border-brand-border/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-brand-border/30">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h3 className="text-lg font-black text-brand-primary tracking-tight">Find a booking</h3>
              <p className="text-[11px] text-brand-muted font-semibold mt-0.5">
                Search by phone, name, or reference. Mark complete from here.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="size-9 rounded-xl bg-brand-elevated hover:bg-brand-hover text-brand-muted hover:text-brand-primary flex items-center justify-center transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder="Phone number, name, or reference"
              className="w-full h-12 bg-brand-bg border border-brand-border/40 rounded-xl pl-11 pr-10 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-hover flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-brand-border/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-brand-muted">search</span>
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text">Type to find a booking</p>
                <p className="text-[11px] text-brand-muted font-semibold mt-1">
                  Customer just walked in? Type the last 4 digits of their phone.
                </p>
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-elevated border border-brand-border/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-brand-muted">search_off</span>
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text">No bookings found</p>
                <p className="text-[11px] text-brand-muted font-semibold mt-1">
                  Try a different number or name.
                </p>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <ul className="space-y-2.5">
              {results.map((b) => {
                const customerName = b.customer?.name || b.customer_name || "Guest";
                const services = b.services?.map((s) => s.title || s.name).join(", ") || "—";
                const statusKey = String(b.status || "Booked").toLowerCase();
                const chip = STATUS_CHIP[statusKey] ?? STATUS_CHIP.booked;
                const isToday = (b.date || "") === todayISO;
                const isPast = !isToday && (b.date || "") < todayISO;
                const isFinalised = statusKey === "completed" || statusKey === "cancelled";
                const busy = busyId === b.id;

                return (
                  <li
                    key={b.id}
                    className="bg-brand-elevated border border-brand-border/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-brand-text truncate">{customerName}</p>
                        {b.customer_whatsapp && (
                          <p className="text-[11px] font-semibold text-brand-muted mt-0.5 truncate">
                            {b.customer_whatsapp}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${chip}`}>
                        {b.status || "Booked"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${isToday ? "bg-brand-primary/15 text-brand-primary" : isPast ? "bg-brand-border/40 text-brand-muted" : "bg-brand-success/15 text-brand-success"}`}>
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {formatDate(b.date)}
                        {b.start_time && <span>· {formatTime(b.start_time)}</span>}
                      </span>
                      <span className="text-brand-muted truncate">{services}</span>
                      <span className="ml-auto text-sm font-black text-brand-text">AED {b.charges || "0"}</span>
                    </div>

                    {b.staff?.name && (
                      <p className="text-[11px] font-semibold text-brand-muted">
                        <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                        Staff: {b.staff.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {!isFinalised && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateStatus(b, "Completed")}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-success hover:bg-brand-success/90 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">task_alt</span>
                          {busy ? "Saving…" : "Mark complete"}
                        </button>
                      )}
                      {!isFinalised && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateStatus(b, "Cancelled")}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-danger/10 hover:bg-brand-danger/20 border border-brand-danger/30 text-brand-danger text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onClose?.();
                          router.push(`/shop/bookings/action?id=${b.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand-elevated hover:bg-brand-hover border border-brand-border/40 text-brand-text text-[11px] font-black uppercase tracking-widest transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        Details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
