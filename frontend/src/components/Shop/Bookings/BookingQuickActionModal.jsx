"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { notify } from "@/utils/alerts";

const STATUS_CHIP = {
  Booked:    "bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/20",
  Completed: "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20",
  Cancelled: "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30",
};
const STATUS_DOT = {
  Booked:    "bg-[#adc6ff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

export default function BookingQuickActionModal({ booking, open, onClose, onUpdated }) {
  const router = useRouter();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (!open || !booking) return null;

  const customerName = booking.customer?.name || booking.customer_name || "Guest";
  const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
  const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
  const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;
  const isBooked  = booking.status === "Booked";

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

  return (
    <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:w-[460px] bg-[#151c25] md:rounded-2xl rounded-t-2xl border border-[#414755]/30 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#414755]/30">
          <div>
            <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{booking.booking_reference}</p>
            <h3 className="text-lg font-black text-white tracking-tight mt-0.5">{customerName}</h3>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all"
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
            <p className="text-base font-black text-white">AED {booking.charges || "0"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date</p>
              <p className="font-semibold text-[#dce3f0] mt-0.5">{booking.show_date || booking.date || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Time</p>
              <p className="font-semibold text-[#dce3f0] mt-0.5">{booking.start_time || "—"}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Services</p>
            <p className="text-sm font-semibold text-[#dce3f0] mt-1">{services}</p>
          </div>

          {booking.customer_whatsapp && (
            <div>
              <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">WhatsApp</p>
              <p className="text-sm font-semibold text-[#4edea3] mt-1">{booking.customer_whatsapp}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#414755]/30 flex flex-col sm:flex-row gap-2">
          {isBooked && (
            <>
              <button
                onClick={() => changeStatus("Completed")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-[#4edea3] hover:bg-[#4edea3]/90 text-[#0d141d] text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {busy === "Completed" ? "Saving…" : "Mark Completed"}
              </button>
              <button
                onClick={() => changeStatus("Cancelled")}
                disabled={busy !== null}
                className="flex-1 h-11 rounded-xl bg-[#414755]/40 hover:bg-[#414755]/60 text-[#dce3f0] text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                {busy === "Cancelled" ? "Saving…" : "Mark Cancelled"}
              </button>
            </>
          )}
          <button
            onClick={() => { onClose?.(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
            className="flex-1 h-11 rounded-xl bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#0d141d] text-xs font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            View full details
          </button>
        </div>
      </div>
    </div>
  );
}
