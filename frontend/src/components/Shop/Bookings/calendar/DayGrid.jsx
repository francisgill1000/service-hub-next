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
  Booked:    "bg-brand-primary/20 border-brand-primary/40 text-brand-primary",
  Completed: "bg-brand-success/20 border-brand-success/40 text-brand-success",
  Cancelled: "bg-brand-border/40 border-brand-border/40 text-brand-muted",
};

export default function DayGrid({ cursorDate, bookings, onBookingClick, onSlotClick }) {
  const hours = buildHourRows();
  const byDate = groupBookingsByDate(bookings);
  const list = byDate.get(toISO(cursorDate)) || [];

  return (
    <div className="bg-brand-elevated border border-brand-border/20 rounded-xl overflow-hidden">
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
            <div className="border-r border-b border-brand-border/10 px-2 pt-1 text-right text-[10px] font-bold text-brand-muted">
              {String(h).padStart(2, "0")}:00
            </div>
            <button
              onClick={() => onSlotClick({ date: toISO(cursorDate), time: `${String(h).padStart(2, "0")}:00` })}
              className="border-l border-b border-brand-border/10 hover:bg-brand-primary/5 transition-colors"
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
              <p className="text-sm font-bold text-brand-text truncate">{customerName}</p>
              {services && <p className="text-[10px] text-brand-muted truncate">{services}</p>}
              {b.staff?.name && (
                <span className="block text-[10px] font-bold opacity-80 truncate">
                  <span className="material-symbols-outlined text-[10px] align-middle">person</span>
                  {b.staff.name}
                </span>
              )}
              {b.staff_id == null && (
                <span className="inline-block mt-0.5 px-1 py-0.5 rounded bg-brand-warning/30 text-brand-warning font-black text-[8px] uppercase tracking-wider">
                  Queued
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
