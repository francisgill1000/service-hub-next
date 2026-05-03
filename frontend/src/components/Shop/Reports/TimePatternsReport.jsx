"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";

const aed = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function shade(v, max) {
  if (max === 0 || v === 0) return "transparent";
  const alpha = Math.max(0.1, Math.min(0.9, v / max));
  return `rgba(75, 142, 255, ${alpha})`;
}

export default function TimePatternsReport({ shopId, from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId || !from || !to) return;
    setLoading(true);
    api
      .get("/shop/reports/time-patterns", { params: { shop_id: shopId, from, to } })
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shopId, from, to]);

  if (loading) return <div className="text-center text-[#8b90a0] text-sm py-12">Loading…</div>;
  if (!data) return <div className="text-center text-[#8b90a0] text-sm py-12">Failed to load.</div>;

  const totalBookings = data.by_day.reduce((s, d) => s + d.count, 0);
  if (totalBookings === 0) {
    return <div className="text-center text-[#8b90a0] text-sm py-12">No bookings in this period.</div>;
  }

  const maxCell = Math.max(...data.grid.flat());
  const maxByDay = Math.max(1, ...data.by_day.map((d) => d.count));
  const maxByHour = Math.max(1, ...data.by_hour.map((h) => h.count));

  // Find busiest day + hour for headlines
  const busiestDayIdx = data.by_day.reduce((max, d, i) => (d.count > data.by_day[max].count ? i : max), 0);
  const busiestHour = data.by_hour.reduce((max, h, i) => (h.count > data.by_hour[max].count ? i : max), 0);

  return (
    <div className="space-y-6">
      {/* Insight cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">Busiest day</p>
          <p className="text-xl font-black text-white mt-1.5">{data.day_labels[busiestDayIdx]}</p>
          <p className="text-[11px] text-[#8b90a0] font-semibold mt-1">{data.by_day[busiestDayIdx].count} bookings</p>
        </div>
        <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">Busiest hour</p>
          <p className="text-xl font-black text-white mt-1.5">{String(busiestHour).padStart(2, "0")}:00</p>
          <p className="text-[11px] text-[#8b90a0] font-semibold mt-1">{data.by_hour[busiestHour].count} bookings</p>
        </div>
        <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">Total bookings</p>
          <p className="text-xl font-black text-white mt-1.5">{totalBookings}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-5 overflow-x-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] mb-4">Heatmap (day × hour)</p>
        <table className="border-collapse text-[10px]" style={{ minWidth: "560px" }}>
          <thead>
            <tr>
              <th className="text-left pr-2 text-[#8b90a0] font-bold">Day</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="px-1 py-1 text-center text-[#8b90a0] font-bold" style={{ width: "22px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.day_labels.map((label, dow) => (
              <tr key={label}>
                <td className="pr-2 py-1 font-bold text-[#dce3f0]">{label}</td>
                {Array.from({ length: 24 }, (_, h) => {
                  const v = data.grid[dow][h] || 0;
                  return (
                    <td
                      key={h}
                      title={`${label} ${h}:00 — ${v} booking${v !== 1 ? "s" : ""}`}
                      className="text-center text-[10px] font-black text-white"
                      style={{
                        background: shade(v, maxCell),
                        height: "26px",
                        border: "1px solid rgba(65,71,85,0.15)",
                      }}
                    >
                      {v > 0 ? v : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By day + by hour */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#414755]/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">By day of week</p>
          </div>
          <div className="p-4 space-y-2">
            {data.day_labels.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#dce3f0] w-12">{label}</span>
                <div className="flex-1 h-5 bg-[#080f17] rounded-md overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4b8eff] to-[#4b8eff]/60"
                    style={{ width: `${Math.max((data.by_day[i].count / maxByDay) * 100, data.by_day[i].count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-[#dce3f0] w-12 text-right">{data.by_day[i].count}</span>
                <span className="text-[10px] text-[#8b90a0] font-semibold w-16 text-right">{aed(data.by_day[i].revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#414755]/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0]">By hour of day</p>
          </div>
          <div className="p-4 space-y-1.5 max-h-80 overflow-y-auto">
            {data.by_hour.map((h, i) =>
              h.count > 0 ? (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#dce3f0] w-12">{String(i).padStart(2, "0")}:00</span>
                  <div className="flex-1 h-5 bg-[#080f17] rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4edea3] to-[#4edea3]/60"
                      style={{ width: `${Math.max((h.count / maxByHour) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#dce3f0] w-10 text-right">{h.count}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
