"use client";

import React from "react";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function ReminderBucketCard({ label, count, lifetimeValue, active, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-brand-surface border rounded-2xl p-4 transition-all ${
        active
          ? "border-brand-primary shadow-md shadow-brand-primary/10"
          : "border-brand-border/20 hover:border-brand-border/60"
      }`}
      style={!active ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : undefined}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="text-2xl font-black text-brand-text mt-1.5">{count}</p>
      <p className="text-[11px] font-semibold text-brand-muted mt-1">
        {fmtAED(lifetimeValue)} lifetime value at risk
      </p>
      <span className={`mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${active ? "text-brand-primary" : "text-brand-muted"}`}>
        Review & send
        <span className="material-symbols-outlined text-[14px]">{active ? "expand_less" : "expand_more"}</span>
      </span>
    </button>
  );
}
