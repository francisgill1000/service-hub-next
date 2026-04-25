"use client";

import React, { useEffect, useState } from "react";
import MonthGrid from "./calendar/MonthGrid";
import WeekGrid from "./calendar/WeekGrid";
import DayGrid from "./calendar/DayGrid";
import BookingQuickActionModal from "./BookingQuickActionModal";
import CreateBookingModal from "@/components/Shop/CreateBookingModal";
import { shiftCursor, cursorLabel, groupBookingsByDate, toISO, format } from "./calendar/utils";

const SUB_VIEWS = [
  { value: "month", label: "Month" },
  { value: "week",  label: "Week" },
  { value: "day",   label: "Day" },
];

const SUBVIEW_KEY = "rezzy.bookings.calendarSubView";

export default function BookingsCalendarView({ bookings, shopId, onCreated, onUpdated }) {
  const [subView, setSubView] = useState("month");
  const [cursorDate, setCursorDate] = useState(new Date());
  const [quickBooking, setQuickBooking] = useState(null);
  const [createSlot, setCreateSlot] = useState(null);
  const [daySheet, setDaySheet] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SUBVIEW_KEY);
      if (saved === "month" || saved === "week" || saved === "day") setSubView(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SUBVIEW_KEY, subView); } catch {}
  }, [subView]);

  const goPrev   = () => setCursorDate((d) => shiftCursor(d, subView, "prev"));
  const goNext   = () => setCursorDate((d) => shiftCursor(d, subView, "next"));
  const goToday  = () => setCursorDate(new Date());

  const handleBookingClick = (b) => setQuickBooking(b);
  const handleSlotClick    = (slot) => setCreateSlot(slot);
  const handleMonthMore    = (date) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDaySheet(date);
    } else {
      setSubView("day");
      setCursorDate(date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#151c25] rounded-xl p-3 md:p-4 border border-[#414755]/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="size-9 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[#dce3f0] hover:text-[#adc6ff] flex items-center justify-center transition-all"
            aria-label="Previous"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            onClick={goToday}
            className="h-9 px-3 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[11px] font-black text-[#dce3f0] hover:text-[#adc6ff] uppercase tracking-widest transition-all"
          >
            Today
          </button>
          <button
            onClick={goNext}
            className="size-9 rounded-xl bg-[#080f17] border border-[#414755]/40 hover:border-[#adc6ff]/40 text-[#dce3f0] hover:text-[#adc6ff] flex items-center justify-center transition-all"
            aria-label="Next"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <p className="ml-2 text-sm md:text-base font-black text-white">{cursorLabel(cursorDate, subView)}</p>
        </div>

        <div className="inline-flex bg-[#080f17] border border-[#414755]/40 rounded-xl p-1 self-start md:self-auto">
          {SUB_VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => setSubView(v.value)}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                subView === v.value
                  ? "bg-[#adc6ff] text-[#0d141d]"
                  : "text-[#8b90a0] hover:text-white"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {subView === "month" && (
        <MonthGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onMoreClick={handleMonthMore}
          onSlotClick={handleSlotClick}
        />
      )}
      {subView === "week" && (
        <WeekGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}
      {subView === "day" && (
        <DayGrid
          cursorDate={cursorDate}
          bookings={bookings}
          onBookingClick={handleBookingClick}
          onSlotClick={handleSlotClick}
        />
      )}

      <BookingQuickActionModal
        booking={quickBooking}
        open={!!quickBooking}
        onClose={() => setQuickBooking(null)}
        onUpdated={onUpdated}
      />

      <CreateBookingModal
        open={!!createSlot}
        onClose={() => setCreateSlot(null)}
        shopId={shopId}
        initialDate={createSlot?.date}
        initialSlot={createSlot?.time}
        onCreated={() => {
          setCreateSlot(null);
          onCreated?.();
        }}
      />

      {daySheet && (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setDaySheet(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[70vh] flex flex-col bg-[#151c25] rounded-t-2xl border-t border-[#414755]/30"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#414755]/30">
              <div>
                <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Bookings</p>
                <h3 className="text-base font-black text-white tracking-tight">{format(daySheet, "EEEE, MMM d")}</h3>
              </div>
              <button
                onClick={() => setDaySheet(null)}
                className="size-9 rounded-xl bg-[#19202a] hover:bg-[#242a34] text-[#8b90a0] hover:text-white flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {(groupBookingsByDate(bookings).get(toISO(daySheet)) || []).map((b) => {
                const customerName = b.customer?.name || b.customer_name || "Guest";
                return (
                  <button
                    key={b.id}
                    onClick={() => { setDaySheet(null); setQuickBooking(b); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl bg-[#080f17] border border-[#414755]/30 hover:border-[#adc6ff]/40 transition-all text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{b.start_time || "—"} · {customerName}</p>
                      <p className="text-[10px] text-[#8b90a0] mt-0.5 font-semibold">{b.booking_reference} · {b.status}</p>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-[#8b90a0]">chevron_right</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
