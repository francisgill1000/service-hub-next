"use client";

import React from "react";
import {
  buildWeekDays,
  buildHourRows,
  groupBookingsByDate,
  bookingBlockStyle,
  toISO,
  isSameDay,
  format,
} from "./utils";

const ROW_HEIGHT = 56;
const TIME_COL_W = 60;

const STATUS_BG = {
  Booked:    "bg-brand-primary/20 border-brand-primary/40 text-brand-primary",
  Completed: "bg-brand-success/20 border-brand-success/40 text-brand-success",
  Cancelled: "bg-brand-border/40 border-brand-border/40 text-brand-muted",
};

export default function WeekGrid({ cursorDate, bookings, onBookingClick, onSlotClick }) {
  const days  = buildWeekDays(cursorDate);
  const hours = buildHourRows();
  const byDate = groupBookingsByDate(bookings);
  const today = new Date();

  return (
    <div className="bg-brand-elevated border border-brand-border/20 rounded-xl overflow-hidden">
      <div className="grid border-b border-brand-border/20 bg-brand-hover/30" style={{ gridTemplateColumns: `${TIME_COL_W}px repeat(7, minmax(80px, 1fr))` }}>
        <div />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={toISO(d)} className="px-2 py-3 text-center border-l border-brand-border/10">
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{format(d, "EEE")}</p>
              <p className={`text-sm font-black mt-0.5 ${isToday ? "text-brand-primary" : "text-brand-text"}`}>
                {format(d, "d")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns: `${TIME_COL_W}px repeat(7, minmax(80px, 1fr))`,
            gridAutoRows: `${ROW_HEIGHT}px`,
            minWidth: TIME_COL_W + 7 * 80,
          }}
        >
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="border-r border-b border-brand-border/10 px-2 pt-1 text-right text-[10px] font-bold text-brand-muted">
                {String(h).padStart(2, "0")}:00
              </div>
              {days.map((d) => (
                <button
                  key={toISO(d) + h}
                  onClick={() => onSlotClick({ date: toISO(d), time: `${String(h).padStart(2, "0")}:00` })}
                  className="border-l border-b border-brand-border/10 hover:bg-brand-primary/5 transition-colors"
                  aria-label={`Create booking on ${toISO(d)} at ${h}:00`}
                />
              ))}
            </React.Fragment>
          ))}

          {days.map((d, dayIdx) => {
            const list = byDate.get(toISO(d)) || [];
            return list.map((b) => {
              const style = bookingBlockStyle(b, ROW_HEIGHT);
              if (!style) return null;
              const colorClass = STATUS_BG[b.status] ?? STATUS_BG.Booked;
              const customerName = b.customer?.name || b.customer_name || "Guest";
              return (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className={`absolute rounded-lg border px-2 py-1 text-left overflow-hidden hover:brightness-125 transition-all ${colorClass}`}
                  style={{
                    top: style.top,
                    height: Math.max(style.height - 2, 22),
                    left: `calc(${TIME_COL_W}px + ((100% - ${TIME_COL_W}px) / 7) * ${dayIdx} + 2px)`,
                    width: `calc((100% - ${TIME_COL_W}px) / 7 - 4px)`,
                  }}
                >
                  <p className="text-[10px] font-bold truncate">{b.start_time}</p>
                  <p className="text-[11px] font-semibold text-brand-text truncate">{customerName}</p>
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
            });
          })}
        </div>
      </div>
    </div>
  );
}
