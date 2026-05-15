"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { DEFAULT_TEMPLATE, loadTemplate } from "./sendWhatsApp";
import ReminderTemplateEditor from "./ReminderTemplateEditor";
import ReminderCustomerList   from "./ReminderCustomerList";
import ReminderBucketCard     from "./ReminderBucketCard";

const daysSince = (iso) => {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(ms)) return Infinity;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const BUCKETS = [
  { key: "30",  label: "Lapsed 30+",  min: 30,  max: 60,       accent: "#f59e0b" },
  { key: "60",  label: "Lapsed 60+",  min: 60,  max: 90,       accent: "#fb7185" },
  { key: "90",  label: "Lapsed 90+",  min: 90,  max: Infinity, accent: "#ef4444" },
];

export default function InsightsRemindersTab() {
  const { shop } = useShop();
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [activeBucket, setActiveBucket] = useState(null);
  const [showTruncationWarning, setShowTruncationWarning] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shops/${shop.id}/customers`, { params: { per_page: 1000 } });
        if (cancelled) return;
        setAllCustomers(data?.data || []);
        setShowTruncationWarning((data?.total || 0) > 1000);
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.id) setTemplate(loadTemplate(shop.id));
  }, [shop?.id]);

  const bucketed = useMemo(() => {
    const out = { "30": [], "60": [], "90": [] };
    for (const c of allCustomers) {
      const d = daysSince(c.last_visit_date);
      if (d === Infinity) {
        out["90"].push(c);
        continue;
      }
      if (d >= 30 && d < 60)  out["30"].push(c);
      else if (d >= 60 && d < 90) out["60"].push(c);
      else if (d >= 90) out["90"].push(c);
    }
    return out;
  }, [allCustomers]);

  const sampleCustomer = useMemo(() => {
    return (
      bucketed["30"][0] ||
      bucketed["60"][0] ||
      bucketed["90"][0] ||
      allCustomers[0] ||
      { name: "Sample Customer", last_visit_date: "2026-02-01", bookings_count: 3, whatsapp: "+971500000000" }
    );
  }, [bucketed, allCustomers]);

  const sumLV = (list) => list.reduce((s, c) => s + Number(c.total_spent || 0), 0);

  if (loading) return <div className="text-brand-muted text-sm font-semibold p-12 text-center">Loading customers…</div>;
  if (error)   return <div className="text-red-400 text-sm font-semibold p-12 text-center">{error}</div>;

  return (
    <div className="space-y-5">
      {showTruncationWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[12px] font-semibold text-amber-400">
          Showing first 1000 customers. Use the manual section below to filter further.
        </div>
      )}

      {/* Template editor */}
      <ReminderTemplateEditor sampleCustomer={sampleCustomer} onChange={setTemplate} />

      {/* Section A — Auto buckets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-muted">Auto-suggested win-back</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BUCKETS.map((b) => (
            <ReminderBucketCard
              key={b.key}
              label={b.label}
              count={bucketed[b.key].length}
              lifetimeValue={sumLV(bucketed[b.key])}
              active={activeBucket === b.key}
              onClick={() => setActiveBucket((cur) => (cur === b.key ? null : b.key))}
              accent={b.accent}
            />
          ))}
        </div>
        {activeBucket && (
          <div className="bg-brand-surface border border-brand-border/20 rounded-xl p-4">
            <ReminderCustomerList
              customers={bucketed[activeBucket]}
              template={template}
              emptyMsg="No customers in this bucket."
            />
          </div>
        )}
      </div>

      {/* Section B — placeholder for Task 6 */}
      <div className="text-brand-muted text-sm font-semibold p-6 text-center border border-dashed border-brand-border/40 rounded-xl">
        Manual reminder builder — coming in Task 6.
      </div>
    </div>
  );
}
