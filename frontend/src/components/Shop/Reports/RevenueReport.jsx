"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";

const aed = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Kpi({ label, value, sub, color = "#1F2937" }) {
  return (
    <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="text-xl font-black text-brand-text mt-1.5">{value}</p>
      {sub && <p className="text-[11px] text-brand-muted font-semibold mt-1">{sub}</p>}
    </div>
  );
}

function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-brand-muted text-sm py-8">No daily data.</div>;
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const fmtDay = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  return (
    <div>
      <div className="flex items-end gap-2 px-1" style={{ height: "180px" }}>
        {data.map((d) => {
          // Cap at 85% so there's headroom for the value chip on hover
          const h = Math.max((d.revenue / max) * 85, d.revenue > 0 ? 6 : 2);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar min-w-[20px] max-w-[60px]">
              <span className="text-[10px] font-black text-brand-text opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                {aed(d.revenue)}
              </span>
              <div
                className="w-full rounded-t-md bg-brand-primary group-hover/bar:bg-brand-primary/80 transition-colors"
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 px-1">
        {data.map((d) => (
          <span
            key={`l-${d.date}`}
            className="flex-1 text-center text-[10px] text-brand-muted font-bold min-w-[20px] max-w-[60px] truncate"
          >
            {fmtDay(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RevenueReport({ shopId, from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId || !from || !to) return;
    setLoading(true);
    api
      .get("/shop/reports/revenue", { params: { shop_id: shopId, from, to } })
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shopId, from, to]);

  if (loading) return <div className="text-center text-brand-muted text-sm py-12">Loading…</div>;
  if (!data) return <div className="text-center text-brand-muted text-sm py-12">Failed to load.</div>;

  const k = data.kpis;
  const inv = data.invoices;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Gross revenue" value={aed(k.gross_revenue)} sub="Excl. cancelled" />
        <Kpi label="Bookings" value={k.total_bookings} sub={`${k.completed} done · ${k.cancelled} cancelled`} />
        <Kpi label="Avg booking value" value={aed(k.avg_booking_value)} />
        <Kpi
          label="Invoices paid"
          value={aed(inv.paid_total)}
          sub={`${inv.paid_count} paid · ${inv.issued_count} unpaid`}
        />
      </div>

      {/* Daily trend chart */}
      <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-4">Daily revenue trend</p>
        <DailyTrendChart data={data.daily_trend} />
      </div>

      {/* Top services */}
      <div className="bg-brand-elevated border border-brand-border/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-brand-border/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Top services by revenue</p>
        </div>
        {data.top_services.length === 0 ? (
          <p className="text-center text-brand-muted text-sm py-8">No services in range.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-hover/30">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-brand-muted uppercase tracking-widest">Service</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-brand-muted uppercase tracking-widest">Count</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-brand-muted uppercase tracking-widest">Revenue</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-brand-muted uppercase tracking-widest">Avg price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {data.top_services.map((s) => (
                <tr key={s.title}>
                  <td className="px-5 py-3 text-sm font-bold text-brand-text">{s.title}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-brand-text">{s.count}</td>
                  <td className="px-5 py-3 text-right text-sm font-black text-brand-text">{aed(s.revenue)}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-brand-text">{aed(s.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
