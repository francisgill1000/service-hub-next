"use client";

import React, { useState } from "react";
import { useShop } from "@/context/ShopContext";
import DateRangePicker from "@/components/Shop/Reports/DateRangePicker";
import RevenueReport   from "@/components/Shop/Reports/RevenueReport";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function InsightsReportTab() {
  const { shop } = useShop();
  const [range, setRange] = useState(null);

  const exportUrl = (format) => {
    if (!shop?.id || !range) return "#";
    return `${apiBase}/shop/reports/export?shop_id=${shop.id}&from=${range.from}&to=${range.to}&type=revenue&format=${format}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl("pdf")}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-xl bg-brand-primary/15 hover:bg-brand-primary/25 border border-brand-primary/30 text-brand-primary font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
            PDF
          </a>
          <a
            href={exportUrl("csv")}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-xl bg-brand-success/15 hover:bg-brand-success/25 border border-brand-success/30 text-brand-success font-black text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">table_view</span>
            CSV
          </a>
        </div>
      </div>
      {shop?.id && range && <RevenueReport shopId={shop.id} from={range.from} to={range.to} />}
    </div>
  );
}
