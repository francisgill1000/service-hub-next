"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { notify } from "@/utils/alerts";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tomorrowLabel() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function buildMessage(booking, shopName) {
  const time = booking.start_time ? booking.start_time.toString().slice(0, 5) : "";
  const customer = booking.customer_name || "there";
  const services =
    booking.services && booking.services.length
      ? booking.services.map((s) => s.title || s.name).join(", ")
      : null;
  const lines = [
    `Hi ${customer}!`,
    `Friendly reminder: your appointment at ${shopName || "us"} is *tomorrow* at ${time || "your booked time"}.`,
  ];
  if (services) lines.push(`Service: ${services}`);
  lines.push(`Booking ref: ${booking.booking_reference || ""}`);
  lines.push(`See you then!`);
  return lines.join("\n");
}

export default function RemindersList() {
  const { shop } = useShop();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const tomorrow = useMemo(() => tomorrowISO(), []);
  const label = useMemo(() => tomorrowLabel(), []);

  useEffect(() => {
    if (shop?.id) fetchBookings();
  }, [shop?.id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/shop/all-bookings", {
        params: { shop_id: shop.id, status: "booked" },
      });
      const all = data.data || data || [];
      setBookings(
        all.filter((b) => (b.date || b.booking_date) === tomorrow)
      );
    } catch (e) {
      console.error("Error fetching bookings:", e);
      await notify({ icon: "error", title: "Error", text: "Failed to load bookings" });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (booking) => {
    if (!booking.customer_whatsapp) {
      await notify({
        icon: "warning",
        title: "No WhatsApp number",
        text: "This customer doesn't have a WhatsApp number on file.",
      });
      return;
    }
    setBusyId(booking.id);
    try {
      const num = String(booking.customer_whatsapp).replace(/\D/g, "");
      const msg = encodeURIComponent(buildMessage(booking, shop?.name));
      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");

      // Mark as reminded
      await api.post(`/booking/${booking.id}/mark-reminder-sent`);
      setBookings((arr) =>
        arr.map((b) => (b.id === booking.id ? { ...b, reminder_sent_at: new Date().toISOString() } : b))
      );
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not mark as reminded",
      });
    } finally {
      setBusyId(null);
    }
  };

  const remindAll = async () => {
    const pending = bookings.filter((b) => !b.reminder_sent_at && b.customer_whatsapp);
    if (pending.length === 0) {
      await notify({
        icon: "info",
        title: "Nothing to send",
        text: "All bookings with WhatsApp numbers have already been reminded.",
      });
      return;
    }

    const result = await notify({
      icon: "warning",
      title: `Send ${pending.length} reminders?`,
      text: `WhatsApp will open ${pending.length} tab${pending.length !== 1 ? "s" : ""} — one per customer. Allow popups for this site if prompted.`,
      showCancelButton: true,
      confirmButtonText: "Send all",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    for (const booking of pending) {
      const num = String(booking.customer_whatsapp).replace(/\D/g, "");
      const msg = encodeURIComponent(buildMessage(booking, shop?.name));
      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
      try {
        await api.post(`/booking/${booking.id}/mark-reminder-sent`);
      } catch {}
    }

    // Refresh state from server
    fetchBookings();
  };

  const pendingCount = bookings.filter((b) => !b.reminder_sent_at && b.customer_whatsapp).length;
  const sentCount = bookings.filter((b) => b.reminder_sent_at).length;

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Reminders</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              Tomorrow · {label}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-[#151c25] border border-[#414755]/30 rounded-xl text-[11px] font-bold text-[#c1c6d7]">
              {bookings.length} bookings
            </span>
            <span className="px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl text-[11px] font-bold text-[#f59e0b]">
              {pendingCount} to send
            </span>
            <span className="px-3 py-1.5 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl text-[11px] font-bold text-[#4edea3]">
              {sentCount} reminded
            </span>
            <button
              onClick={remindAll}
              disabled={pendingCount === 0}
              className="h-9 px-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-black text-white inline-flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              Remind all
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-[#19202a] rounded-xl border border-[#414755]/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#8b90a0] text-sm font-semibold">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#414755]">event_available</span>
              <p className="mt-3 text-[#8b90a0] text-sm font-semibold">No bookings tomorrow.</p>
              <p className="mt-1 text-[#414755] text-xs">Enjoy the day off.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#414755]/10">
              {bookings
                .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
                .map((b) => {
                  const customerName = b.customer_name || b.customer?.name || "Guest";
                  const initials = customerName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const services =
                    b.services?.map((s) => s.title || s.name).join(", ") || "—";
                  const time = b.start_time ? String(b.start_time).slice(0, 5) : "—";
                  const reminded = !!b.reminder_sent_at;
                  const noPhone = !b.customer_whatsapp;
                  return (
                    <li key={b.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#2e353f] flex items-center justify-center font-bold text-sm text-[#4b8eff] shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate">{customerName}</p>
                          <span className="text-[10px] font-bold text-[#8b90a0]">{b.booking_reference}</span>
                        </div>
                        <p className="text-[11px] text-[#8b90a0] font-medium mt-0.5 truncate">{services}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#8b90a0]">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {time}
                          </span>
                          {b.customer_whatsapp && (
                            <span className="inline-flex items-center gap-1 text-[#4edea3]">
                              <span className="material-symbols-outlined text-[12px]">chat</span>
                              {b.customer_whatsapp}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {noPhone ? (
                          <span className="px-3 py-1.5 rounded-lg bg-[#414755]/40 text-[#8b90a0] font-bold text-[10px] uppercase tracking-wider">
                            No WhatsApp
                          </span>
                        ) : reminded ? (
                          <button
                            onClick={() => sendReminder(b)}
                            disabled={busyId === b.id}
                            title="Send again"
                            className="h-9 px-3 rounded-lg bg-[#4edea3]/15 hover:bg-[#4edea3]/25 border border-[#4edea3]/30 text-[#4edea3] font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Reminded · Resend
                          </button>
                        ) : (
                          <button
                            onClick={() => sendReminder(b)}
                            disabled={busyId === b.id}
                            className="h-9 px-3 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 disabled:opacity-40 text-white font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">send</span>
                            {busyId === b.id ? "…" : "Send"}
                          </button>
                        )}
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
