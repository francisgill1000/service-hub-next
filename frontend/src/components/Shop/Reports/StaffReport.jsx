"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";

const aed = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function StaffReport({ shopId, from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!shopId || !from || !to) return;
    setLoading(true);
    api
      .get("/shop/reports/staff", { params: { shop_id: shopId, from, to } })
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shopId, from, to]);

  const rows = useMemo(() => {
    if (!data?.staff) return [];
    const sorted = [...data.staff].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [data, sortKey, sortDir]);

  const setSort = (k) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue || 0));

  if (loading) return <div className="text-center text-brand-muted text-sm py-12">Loading…</div>;
  if (!data) return <div className="text-center text-brand-muted text-sm py-12">Failed to load.</div>;
  if (rows.length === 0) return <div className="text-center text-brand-muted text-sm py-12">No staff bookings in this period.</div>;

  const Th = ({ k, label, right }) => (
    <th
      onClick={() => setSort(k)}
      className={`px-4 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest cursor-pointer hover:text-brand-primary ${right ? "text-right" : "text-left"}`}
    >
      {label}{sortKey === k && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Revenue bar chart */}
      <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-4">Revenue by staff</p>
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.staff_id ?? r.staff_name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-text w-32 truncate">{r.staff_name}</span>
              <div className="flex-1 h-6 bg-brand-bg rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/60 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(((r.revenue || 0) / maxRevenue) * 100, 2)}%` }}
                >
                  <span className="text-[10px] font-black text-brand-text whitespace-nowrap">{aed(r.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-staff table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden overflow-x-auto shadow-md">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-elevated border-b border-brand-border">
              <Th k="staff_name" label="Staff" />
              <Th k="total_bookings" label="Bookings" right />
              <Th k="completed" label="Done" right />
              <Th k="cancelled" label="Cancel" right />
              <Th k="revenue" label="Revenue" right />
              <Th k="avg_booking_value" label="Avg" right />
              <Th k="completion_rate" label="Done %" right />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {rows.map((r) => (
              <tr key={r.staff_id ?? r.staff_name}>
                <td className="px-4 py-3 text-sm font-bold text-brand-text">{r.staff_name}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-brand-text">{r.total_bookings}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-brand-success">{r.completed}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-brand-danger">{r.cancelled}</td>
                <td className="px-4 py-3 text-right text-sm font-black text-brand-text">{aed(r.revenue)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-brand-text">{aed(r.avg_booking_value)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-brand-text">{r.completion_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
