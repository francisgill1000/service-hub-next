"use client";

import React, { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";
import InsightsCustomersTab from "@/components/Shop/Insights/InsightsCustomersTab";
import InsightsRemindersTab from "@/components/Shop/Insights/InsightsRemindersTab";
import InsightsReportTab    from "@/components/Shop/Insights/InsightsReportTab";

const TABS = [
  { key: "customers", label: "Customers", icon: "group" },
  { key: "reminders", label: "Reminders", icon: "notifications_active" },
  { key: "report",    label: "Report",    icon: "analytics" },
];

const STORAGE_KEY = "rezzy.insights.activeTab";

export default function InsightsPage() {
  const { shop } = useShop();
  const [activeTab, setActiveTab] = useState("customers");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && TABS.some((t) => t.key === saved)) setActiveTab(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Customer Insights</h2>
            <p className="text-brand-muted font-semibold mt-1 text-sm">
              Per-customer value, win-back reminders, and revenue — all in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-20 bg-brand-bg pt-2 pb-1">
          <div className="flex items-center gap-1 bg-brand-bg border border-brand-border/30 rounded-xl p-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-brand-primary text-white"
                    : "text-brand-muted hover:text-brand-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active tab content (placeholder for now) */}
        <div>
          {!shop?.id && (
            <p className="text-brand-muted text-sm font-semibold">Loading shop…</p>
          )}
          {shop?.id && activeTab === "customers" && <InsightsCustomersTab />}
          {shop?.id && activeTab === "reminders" && <InsightsRemindersTab />}
          {shop?.id && activeTab === "report" && <InsightsReportTab />}
        </div>
      </div>
    </div>
  );
}
