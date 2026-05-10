"use client";

import React from "react";
import { useRouter } from "next/navigation";

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

export default function BookingsListView({ bookings, totalCount }) {
  const router = useRouter();

  return (
    <>
      {/* Desktop — table */}
      <div className="hidden md:block bg-brand-elevated rounded-xl overflow-hidden border border-brand-border/20 shadow-xl shadow-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-hover/30 border-b border-brand-border/20">
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Customer</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Service</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Staff</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date & Time</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Amount</th>
              <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/10">
            {bookings.map((booking) => {
              const customerName = booking.customer?.name || booking.customer_name || "Guest";
              const initials = customerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
              const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
              const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
              const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;

              return (
                <tr
                  key={booking.id}
                  className="hover:bg-brand-hover/20 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-hover flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors">{customerName}</p>
                        <p className="text-[10px] text-brand-muted font-medium">
                          {booking.booking_reference}
                          {booking.customer_whatsapp && (
                            <span className="ml-2 text-brand-success">· {booking.customer_whatsapp}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-brand-muted font-medium mt-0.5">
                          {booking.staff?.name ? (
                            <span>
                              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                              <span className="align-middle">{booking.staff.name}</span>
                            </span>
                          ) : booking.staff_id == null && booking.status !== "Booked" ? null : booking.staff_id == null ? (
                            <span className="px-1.5 py-0.5 rounded bg-brand-warning/20 text-brand-warning font-bold text-[9px] uppercase tracking-wider">
                              Queued — no staff
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-brand-text max-w-[180px] truncate">{services}</p>
                  </td>
                  <td className="px-5 py-4">
                    {booking.staff?.name ? (
                      <div className="inline-flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-hover flex items-center justify-center font-bold text-[11px] text-brand-primary">
                          {booking.staff.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-brand-text">{booking.staff.name}</p>
                      </div>
                    ) : booking.staff_id == null && booking.status === "Queued" ? (
                      <span className="px-2 py-1 rounded-lg bg-brand-warning/15 text-brand-warning border border-brand-warning/20 font-black text-[10px] uppercase tracking-wider">
                        Waiting
                      </span>
                    ) : (
                      <span className="text-brand-muted text-sm font-semibold">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-brand-text">{booking.show_date || booking.date || "—"}</p>
                    {booking.start_time && (
                      <p className="text-[11px] text-brand-muted font-medium mt-0.5">{booking.start_time}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-brand-text">AED {booking.charges || "0"}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      View
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-brand-border/20 bg-brand-surface">
          <p className="text-[11px] font-semibold text-brand-muted">
            Showing {bookings.length} of {totalCount} bookings
          </p>
        </div>
      </div>

      {/* Mobile — cards */}
      <div className="md:hidden space-y-3">
        {bookings.map((booking) => {
          const customerName = booking.customer?.name || booking.customer_name || "Guest";
          const services    = booking.services?.map(s => s.title || s.name).join(", ") || "—";
          const chipClass   = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
          const dotClass    = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;

          return (
            <div
              key={booking.id}
              onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
              className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 hover:border-brand-border/50 cursor-pointer transition-all active:scale-[0.98] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{booking.booking_reference}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {booking.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-brand-text">{customerName}</p>
                {booking.customer_whatsapp && (
                  <p className="text-[11px] text-brand-success mt-0.5 font-semibold">{booking.customer_whatsapp}</p>
                )}
                <p className="text-[10px] text-brand-muted font-medium mt-0.5">
                  {booking.staff?.name ? (
                    <span>
                      <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                      <span className="align-middle">{booking.staff.name}</span>
                    </span>
                  ) : booking.staff_id == null && booking.status !== "Booked" ? null : booking.staff_id == null ? (
                    <span className="px-1.5 py-0.5 rounded bg-brand-warning/20 text-brand-warning font-bold text-[9px] uppercase tracking-wider">
                      Queued — no staff
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-brand-muted mt-0.5 font-medium">{services}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-brand-border/20">
                <div>
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Date</p>
                  <p className="text-xs font-semibold text-brand-text mt-0.5">
                    {booking.show_date || booking.date || "—"}{booking.start_time ? ` · ${booking.start_time}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Staff</p>
                  <p className="text-xs font-semibold text-brand-text mt-0.5">
                    {booking.staff?.name ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] align-middle">person</span>
                        {booking.staff.name}
                      </span>
                    ) : booking.staff_id == null && booking.status === "Queued" ? (
                      <span className="text-brand-warning font-black uppercase tracking-wider text-[10px]">Waiting</span>
                    ) : (
                      <span className="text-brand-muted">—</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end pt-2 border-t border-brand-border/20">
                <p className="text-base font-black text-brand-text">AED {booking.charges || "0"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
