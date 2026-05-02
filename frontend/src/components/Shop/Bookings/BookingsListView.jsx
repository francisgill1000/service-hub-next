"use client";

import React from "react";
import { useRouter } from "next/navigation";

const STATUS_CHIP = {
  Booked:    "bg-[#4b8eff]/15 text-[#4b8eff] border border-[#4b8eff]/20",
  Completed: "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20",
  Cancelled: "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30",
};
const STATUS_DOT = {
  Booked:    "bg-[#4b8eff]",
  Completed: "bg-[#4edea3]",
  Cancelled: "bg-[#8b90a0]",
};

export default function BookingsListView({ bookings, totalCount }) {
  const router = useRouter();

  return (
    <>
      {/* Desktop — table */}
      <div className="hidden md:block bg-[#19202a] rounded-xl overflow-hidden border border-[#414755]/20 shadow-xl shadow-black/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2e353f]/30 border-b border-[#414755]/20">
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Customer</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Service</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date & Time</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Status</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Amount</th>
              <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#414755]/10">
            {bookings.map((booking) => {
              const customerName = booking.customer?.name || booking.customer_name || "Guest";
              const initials = customerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
              const services = booking.services?.map(s => s.title || s.name).join(", ") || "—";
              const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP.Booked;
              const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT.Booked;

              return (
                <tr
                  key={booking.id}
                  className="hover:bg-[#2e353f]/20 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#2e353f] flex items-center justify-center font-bold text-xs text-[#4b8eff] shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#4b8eff] transition-colors">{customerName}</p>
                        <p className="text-[10px] text-[#8b90a0] font-medium">
                          {booking.booking_reference}
                          {booking.customer_whatsapp && (
                            <span className="ml-2 text-[#4edea3]">· {booking.customer_whatsapp}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#8b90a0] font-medium mt-0.5">
                          {booking.staff?.name ? (
                            <span>
                              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                              <span className="align-middle">{booking.staff.name}</span>
                            </span>
                          ) : booking.staff_id == null && booking.status !== "Booked" ? null : booking.staff_id == null ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold text-[9px] uppercase tracking-wider">
                              Queued — no staff
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#dce3f0] max-w-[180px] truncate">{services}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-[#dce3f0]">{booking.show_date || booking.date || "—"}</p>
                    {booking.start_time && (
                      <p className="text-[11px] text-[#8b90a0] font-medium mt-0.5">{booking.start_time}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-white">AED {booking.charges || "0"}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4b8eff]/10 hover:bg-[#4b8eff]/20 text-[#4b8eff] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
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

        <div className="px-5 py-3 border-t border-[#414755]/20 bg-[#151c25]">
          <p className="text-[11px] font-semibold text-[#8b90a0]">
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
              className="bg-[#151c25] rounded-xl p-4 border border-[#414755]/20 hover:border-[#414755]/50 cursor-pointer transition-all active:scale-[0.98] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{booking.booking_reference}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {booking.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-bold text-white">{customerName}</p>
                {booking.customer_whatsapp && (
                  <p className="text-[11px] text-[#4edea3] mt-0.5 font-semibold">{booking.customer_whatsapp}</p>
                )}
                <p className="text-[10px] text-[#8b90a0] font-medium mt-0.5">
                  {booking.staff?.name ? (
                    <span>
                      <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">person</span>
                      <span className="align-middle">{booking.staff.name}</span>
                    </span>
                  ) : booking.staff_id == null && booking.status !== "Booked" ? null : booking.staff_id == null ? (
                    <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] font-bold text-[9px] uppercase tracking-wider">
                      Queued — no staff
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[#8b90a0] mt-0.5 font-medium">{services}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#414755]/20">
                <div>
                  <p className="text-[10px] text-[#8b90a0] uppercase tracking-widest font-bold">Date</p>
                  <p className="text-xs font-semibold text-[#dce3f0] mt-0.5">
                    {booking.show_date || booking.date || "—"}{booking.start_time ? ` · ${booking.start_time}` : ""}
                  </p>
                </div>
                <p className="text-base font-black text-white">AED {booking.charges || "0"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
