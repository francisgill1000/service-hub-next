"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { notify } from "@/utils/alerts";

const STATUS_CHIP = {
  Booked:    "bg-brand-primary/15 text-brand-primary border border-brand-primary/20",
  Completed: "bg-brand-success/15 text-brand-success border border-brand-success/20",
  Cancelled: "bg-brand-border/40 text-brand-muted border border-brand-border/30",
};
const STATUS_DOT = {
  Booked:    "bg-brand-primary",
  Completed: "bg-brand-success",
  Cancelled: "bg-brand-muted",
};

export default function BookingQuickActionModal({ booking, open, onClose, onUpdated }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [reassignTo, setReassignTo] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (!open || !booking?.shop_id) return;
    api.get(`/shops/${booking.shop_id}/staff`)
      .then(({ data }) => setStaffList((data.data || []).filter((s) => s.is_active)))
      .catch(() => setStaffList([]));
  }, [open, booking?.shop_id]);

  if (!open || !booking) return null;

  const customerName = booking.customer?.name || booking.customer_name || "Guest";
  const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
  const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
  const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;
  const isBooked  = booking.status === "Booked";
  const isQueued  = booking.status === "Queued";
  const canAssign = isBooked || isQueued;

  const changeStatus = async (status) => {
    setError(null);
    setBusy(status);
    try {
      await api.put(`/booking/${booking.id}`, { status });
      await notify({
        title: "Updated",
        text: `Booking marked ${status.toLowerCase()}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      onUpdated?.();
      onClose?.();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Could not update booking.");
    } finally {
      setBusy(null);
    }
  };

  const reassign = async () => {
    if (!reassignTo) return;
    setError(null);
    setReassigning(true);
    try {
      await api.post(`/booking/${booking.id}/reassign`, { staff_id: Number(reassignTo) });
      await notify({
        title: "Reassigned",
        text: "Staff updated.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      onUpdated?.();
      onClose?.();
    } catch (e) {
      if (e?.response?.status === 409) {
        setError("That staff is already booked at this slot.");
      } else {
        setError(e?.response?.data?.message || e.message || "Could not reassign.");
      }
    } finally {
      setReassigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:w-[460px] bg-brand-surface md:rounded-2xl rounded-t-2xl border border-brand-border/30 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border/30">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{booking.booking_reference}</p>
            <h3 className="text-lg font-black text-brand-text tracking-tight mt-0.5">{customerName}</h3>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-xl bg-brand-elevated hover:bg-brand-hover text-brand-muted hover:text-brand-primary flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
              {booking.status}
            </span>
            <p className="text-base font-black text-brand-text">AED {booking.charges || "0"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date</p>
              <p className="font-semibold text-brand-text mt-0.5">{booking.show_date || booking.date || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Time</p>
              <p className="font-semibold text-brand-text mt-0.5">{booking.start_time || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Services</p>
            <p className="text-sm font-semibold text-brand-text mt-1">{services}</p>
          </div>

          {booking.customer_whatsapp && (
            <div>
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">WhatsApp</p>
              <p className="text-sm font-semibold text-brand-success mt-1">{booking.customer_whatsapp}</p>
            </div>
          )}

          {canAssign && staffList.length > 0 && (
            <div className="bg-brand-surface rounded-xl p-3 border border-brand-border/20">
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2">
                {isQueued ? "Manually assign staff" : "Reassign staff"}
              </p>
              <div className="flex gap-2">
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="flex-1 h-9 bg-brand-bg border border-brand-border/40 rounded-lg px-3 text-sm font-semibold text-brand-text outline-none [color-scheme:dark]"
                >
                  <option value="">Pick a staff…</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id} disabled={s.id === booking.staff_id}>
                      {s.name}{s.id === booking.staff_id ? " (current)" : ""}
                    </option>
                  ))}
                </select>
                <button
                  onClick={reassign}
                  disabled={!reassignTo || reassigning}
                  className="h-9 px-4 rounded-lg bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-[11px] font-black text-white"
                >
                  {reassigning ? "Saving…" : (isQueued ? "Assign" : "Reassign")}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-brand-border/30 flex flex-col sm:flex-row gap-2">
          {isBooked && (
            <>
              <button
                onClick={() => changeStatus("Completed")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-brand-success hover:bg-brand-success/90 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {busy === "Completed" ? "Saving…" : "Mark Completed"}
              </button>
              <button
                onClick={() => changeStatus("Cancelled")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-brand-border/40 hover:bg-brand-border/60 text-white text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
              >
                {busy === "Cancelled" ? "Saving…" : "Mark Cancelled"}
              </button>
            </>
          )}
          <button
            onClick={() => { onClose?.(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
            className="flex-1 h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center"
          >
            View full details
          </button>
        </div>
      </div>
    </div>
  );
}
