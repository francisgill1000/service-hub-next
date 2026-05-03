"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/api";

const aed = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ServicesReport({ shopId, from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("revenue");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!shopId || !from || !to) return;
    setLoading(true);
    api
      .get("/shop/reports/services", { params: { shop_id: shopId, from, to } })
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shopId, from, to]);

  const rows = useMemo(() => {
    if (!data?.services) return [];
    const sorted = [...data.services].sort((a, b) => {
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

  if (loading) return <div className="text-center text-[#8b90a0] text-sm py-12">Loading…</div>;
  if (!data) return <div className="text-center text-[#8b90a0] text-sm py-12">Failed to load.</div>;
  if (rows.length === 0) return <div className="text-center text-[#8b90a0] text-sm py-12">No services in this period.</div>;

  const Th = ({ k, label, right }) => (
    <th
      onClick={() => setSort(k)}
      className={`px-4 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest cursor-pointer hover:text-white ${right ? "text-right" : "text-left"}`}
    >
      {label}{sortKey === k && (sortDir === "asc" ? " ↑" : " ↓")}
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Top-N revenue chart */}
      <div className="bg-[#151c25] border border-[#414755]/20 rounded-xl p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] mb-4">Revenue by service</p>
        <div className="space-y-2.5">
          {rows.slice(0, 10).map((r) => (
            <div key={r.title} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#dce3f0] w-32 truncate">{r.title}</span>
              <div className="flex-1 h-6 bg-[#080f17] rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4edea3] to-[#4edea3]/60 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(((r.revenue || 0) / maxRevenue) * 100, 2)}%` }}
                >
                  <span className="text-[10px] font-black text-white whitespace-nowrap">{aed(r.revenue)}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#8b90a0] w-12 text-right">×{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div className="bg-[#19202a] border border-[#414755]/20 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#2e353f]/30 border-b border-[#414755]/20">
              <Th k="title" label="Service" />
              <Th k="count" label="Count" right />
              <Th k="revenue" label="Revenue" right />
              <Th k="avg_price" label="Avg price" right />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#414755]/10">
            {rows.map((r) => (
              <tr key={r.title}>
                <td className="px-4 py-3 text-sm font-bold text-white">{r.title}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-[#dce3f0]">{r.count}</td>
                <td className="px-4 py-3 text-right text-sm font-black text-white">{aed(r.revenue)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-[#dce3f0]">{aed(r.avg_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
