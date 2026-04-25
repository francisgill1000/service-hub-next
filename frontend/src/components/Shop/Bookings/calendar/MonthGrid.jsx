"use client";

import React from "react";
import { buildMonthMatrix, groupBookingsByDate, toISO, isSameDay, isSameMonth, format } from "./utils";

const STATUS_DOT = {
  Booked:    "bg-[#adc6ff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({ cursorDate, bookings, onBookingClick, onMoreClick, onSlotClick }) {
  const days = buildMonthMatrix(cursorDate);
  const byDate = groupBookingsByDate(bookings);
  const today = new Date();

  return (
    <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-[#2e353f]/30 border-b border-[#414755]/20">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const iso = toISO(day);
          const dayBookings = byDate.get(iso) || [];
          const inMonth = isSameMonth(day, cursorDate);
          const isToday = isSameDay(day, today);
          const visible = dayBookings.slice(0, 3);
          const overflow = dayBookings.length - visible.length;

          const handleCellClick = () => onSlotClick({ date: iso, time: null });
          const handleMobileTap = () => {
            if (dayBookings.length > 0) onMoreClick(day);
            else onSlotClick({ date: iso, time: null });
          };

          return (
            <div
              key={iso + idx}
              onClick={handleCellClick}
              className={`hidden md:flex flex-col min-h-[112px] border-b border-r border-[#414755]/10 p-2 cursor-pointer hover:bg-[#adc6ff]/5 transition-colors group/cell ${
                inMonth ? "bg-[#19202a]" : "bg-[#151c25]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                    isToday
                      ? "bg-[#adc6ff] text-[#0d141d]"
                      : inMonth
                        ? "text-white"
                        : "text-[#8b90a0]"
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="flex items-center gap-1">
                  {dayBookings.length > 0 && (
                    <span className="text-[9px] font-bold text-[#8b90a0]">
                      {dayBookings.length}
                    </span>
                  )}
                  <span className="material-symbols-outlined text-[14px] text-[#adc6ff] opacity-0 group-hover/cell:opacity-100 transition-opacity">add_circle</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {visible.map((b) => {
                  const dotClass = STATUS_DOT[b.status] ?? STATUS_DOT.Booked;
                  const customerName = b.customer?.name || b.customer_name || "Guest";
                  return (
                    <button
                      key={b.id}
                      onClick={(e) => { e.stopPropagation(); onBookingClick(b); }}
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-[#080f17] hover:bg-[#2e353f]/40 text-left transition-colors"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                      <span className="text-[10px] font-semibold text-[#dce3f0] truncate">
                        {b.start_time ? `${b.start_time} ` : ""}{customerName}
                      </span>
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoreClick(day); }}
                    className="text-[10px] font-bold text-[#adc6ff] text-left px-1.5"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Mobile cells (separate render so the layout stays a clean 7-col grid) */}
        {days.map((day, idx) => {
          const iso = toISO(day);
          const dayBookings = byDate.get(iso) || [];
          const inMonth = isSameMonth(day, cursorDate);
          const isToday = isSameDay(day, today);

          const handleMobileTap = () => {
            if (dayBookings.length > 0) onMoreClick(day);
            else onSlotClick({ date: iso, time: null });
          };

          return (
            <button
              key={"m" + iso + idx}
              onClick={handleMobileTap}
              className={`md:hidden flex flex-col items-stretch min-h-[80px] border-b border-r border-[#414755]/10 p-1.5 text-left cursor-pointer ${
                inMonth ? "bg-[#19202a]" : "bg-[#151c25]/50"
              }`}
              aria-label={dayBookings.length > 0 ? `View ${dayBookings.length} bookings on ${iso}` : `Create booking on ${iso}`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black mb-1 ${
                  isToday
                    ? "bg-[#adc6ff] text-[#0d141d]"
                    : inMonth
                      ? "text-white"
                      : "text-[#8b90a0]"
                }`}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-1">
                {dayBookings.slice(0, 6).map((b) => (
                  <span
                    key={b.id}
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status] ?? STATUS_DOT.Booked}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
