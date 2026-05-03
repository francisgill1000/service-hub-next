"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";

const aed = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Kpi({ label, value, sub, color = "#4b8eff" }) {
  return (
    <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">{label}</p>
      <p className="text-xl font-black text-white mt-1.5">{value}</p>
      {sub && <p className="text-[11px] text-[#8b90a0] font-semibold mt-1">{sub}</p>}
    </div>
  );
}

function DailyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-[#8b90a0] text-sm py-8">No daily data.</div>;
  }
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: "180px" }}>
        {data.map((d) => {
          const h = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 6 : 2);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group/bar min-w-[12px]">
              <span className="text-[9px] font-black text-[#dce3f0] opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                {aed(d.revenue)}
              </span>
              <div className="w-full" style={{ height: `${h}%` }}>
                <div className="w-full h-full rounded-t-md bg-gradient-to-t from-[#4b8eff]/40 to-[#4b8eff] hover:from-[#4b8eff]/60" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-[#8b90a0] font-bold">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
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

  if (loading) return <div className="text-center text-[#8b90a0] text-sm py-12">Loading…</div>;
  if (!data) return <div className="text-center text-[#8b90a0] text-sm py-12">Failed to load.</div>;

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
      <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] mb-4">Daily revenue trend</p>
        <DailyTrendChart data={data.daily_trend} />
      </div>

      {/* Top services */}
      <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#414755]/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">Top services by revenue</p>
        </div>
        {data.top_services.length === 0 ? (
          <p className="text-center text-[#8b90a0] text-sm py-8">No services in range.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#2e353f]/30">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Service</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Count</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Revenue</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Avg price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#414755]/10">
              {data.top_services.map((s) => (
                <tr key={s.title}>
                  <td className="px-5 py-3 text-sm font-bold text-white">{s.title}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-[#dce3f0]">{s.count}</td>
                  <td className="px-5 py-3 text-right text-sm font-black text-white">{aed(s.revenue)}</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-[#dce3f0]">{aed(s.avg_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
