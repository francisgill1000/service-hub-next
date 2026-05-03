"use client";

import React, { useState } from "react";
import { useShop } from "@/context/ShopContext";
import DateRangePicker from "./DateRangePicker";
import RevenueReport from "./RevenueReport";
import StaffReport from "./StaffReport";
import ServicesReport from "./ServicesReport";
import TimePatternsReport from "./TimePatternsReport";

const TABS = [
  { key: "revenue", label: "Revenue", icon: "payments" },
  { key: "staff", label: "Staff", icon: "groups" },
  { key: "services", label: "Services", icon: "design_services" },
  { key: "time-patterns", label: "Time Patterns", icon: "schedule" },
];

export default function ReportsPage() {
  const { shop } = useShop();
  const [activeTab, setActiveTab] = useState("revenue");
  const [range, setRange] = useState(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  const exportUrl = (format) => {
    if (!shop?.id || !range) return "#";
    return `${apiBase}/shop/reports/export?shop_id=${shop.id}&from=${range.from}&to=${range.to}&type=${activeTab}&format=${format}`;
  };

  const renderActive = () => {
    if (!shop?.id || !range) return null;
    const props = { shopId: shop.id, from: range.from, to: range.to };
    switch (activeTab) {
      case "revenue":       return <RevenueReport {...props} />;
      case "staff":         return <StaffReport {...props} />;
      case "services":      return <ServicesReport {...props} />;
      case "time-patterns": return <TimePatternsReport {...props} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Reports</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              Insights to plan, price, and grow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={exportUrl("pdf")}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-[#137fec]/15 hover:bg-[#137fec]/25 border border-[#137fec]/30 text-[#137fec] font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
              PDF
            </a>
            <a
              href={exportUrl("csv")}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-[#4edea3]/15 hover:bg-[#4edea3]/25 border border-[#4edea3]/30 text-[#4edea3] font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">table_view</span>
              CSV
            </a>
          </div>
        </div>

        {/* Date range */}
        <DateRangePicker value={range} onChange={setRange} />

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-[#080f17] border border-[#414755]/30 rounded-xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-[#4b8eff] text-white"
                  : "text-[#8b90a0] hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div>
          {renderActive()}
        </div>
      </div>
    </div>
  );
}
