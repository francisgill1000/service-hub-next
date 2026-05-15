"use client";

import React from "react";

export default function ReminderManualFilters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  return (
    <div className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-brand-muted">Manual filters</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Last visit from">
          <input type="date" value={filters.fromDate || ""} onChange={(e) => set({ fromDate: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </Field>
        <Field label="Last visit to">
          <input type="date" value={filters.toDate || ""} onChange={(e) => set({ toDate: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" />
        </Field>
        <Field label="Min total spent (AED)">
          <input type="number" min="0" value={filters.minSpend ?? ""} onChange={(e) => set({ minSpend: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0" />
        </Field>
        <Field label="Max total spent (AED)">
          <input type="number" min="0" value={filters.maxSpend ?? ""} onChange={(e) => set({ maxSpend: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="∞" />
        </Field>
        <Field label="Min bookings">
          <input type="number" min="0" value={filters.minBookings ?? ""} onChange={(e) => set({ minBookings: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="0" />
        </Field>
        <Field label="Max bookings">
          <input type="number" min="0" value={filters.maxBookings ?? ""} onChange={(e) => set({ maxBookings: e.target.value })}
            className="w-full h-11 bg-brand-bg border border-brand-border/40 rounded-xl px-3 text-sm font-semibold text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/20" placeholder="∞" />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!filters.excludeContactedToday}
          onChange={(e) => set({ excludeContactedToday: e.target.checked })}
          className="size-4 rounded border-brand-border accent-brand-primary"
        />
        <span className="text-[11px] font-bold text-brand-muted">Exclude customers already contacted today</span>
      </label>
      <button
        type="button"
        onClick={() => onChange({ fromDate: "", toDate: "", minSpend: "", maxSpend: "", minBookings: "", maxBookings: "", excludeContactedToday: false })}
        className="text-[10px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1.5">{label}</p>
      {children}
    </div>
  );
}
