"use client";

import React from "react";
import {
  buildHourRows,
  groupBookingsByDate,
  bookingBlockStyle,
  toISO,
} from "./utils";

const ROW_HEIGHT = 64;
const TIME_COL_W = 60;

const STATUS_BG = {
  Booked:    "bg-[#4b8eff]/20 border-[#4b8eff]/40 text-[#4b8eff]",
  Completed: "bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]",
  Cancelled: "bg-[#414755]/40 border-[#414755]/40 text-[#8b90a0]",
};

export default function DayGrid({ cursorDate, bookings, onBookingClick, onSlotClick }) {
  const hours = buildHourRows();
  const byDate = groupBookingsByDate(bookings);
  const list = byDate.get(toISO(cursorDate)) || [];

  return (
    <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateColumns: `${TIME_COL_W}px 1fr`,
          gridAutoRows: `${ROW_HEIGHT}px`,
        }}
      >
        {hours.map((h) => (
          <React.Fragment key={h}>
            <div className="border-r border-b border-[#414755]/10 px-2 pt-1 text-right text-[10px] font-bold text-[#8b90a0]">
              {String(h).padStart(2, "0")}:00
            </div>
            <button
              onClick={() => onSlotClick({ date: toISO(cursorDate), time: `${String(h).padStart(2, "0")}:00` })}
              className="border-l border-b border-[#414755]/10 hover:bg-[#4b8eff]/5 transition-colors"
              aria-label={`Create booking at ${h}:00`}
            />
          </React.Fragment>
        ))}

        {list.map((b) => {
          const style = bookingBlockStyle(b, ROW_HEIGHT);
          if (!style) return null;
          const colorClass = STATUS_BG[b.status] ?? STATUS_BG.Booked;
          const customerName = b.customer?.name || b.customer_name || "Guest";
          const services = b.services?.map(s => s.title || s.name).join(", ") || "";
          return (
            <button
              key={b.id}
              onClick={() => onBookingClick(b)}
              className={`absolute rounded-lg border px-3 py-2 text-left overflow-hidden hover:brightness-125 transition-all ${colorClass}`}
              style={{
                top: style.top,
                height: Math.max(style.height - 2, 28),
                left: `calc(${TIME_COL_W}px + 4px)`,
                right: 4,
              }}
            >
              <p className="text-[10px] font-bold">{b.start_time}{b.charges ? ` · AED ${b.charges}` : ""}</p>
              <p className="text-sm font-bold text-white truncate">{customerName}</p>
              {services && <p className="text-[10px] text-white/70 truncate">{services}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
