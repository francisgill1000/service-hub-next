"use client";

import React, { useMemo, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { sendBulk, loadContactedToday } from "./sendWhatsApp";
import { notify } from "@/utils/alerts";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return s; }
};

export default function ReminderCustomerList({ customers, template, emptyMsg = "No customers." }) {
  const { shop } = useShop();
  const [selected, setSelected] = useState(() => new Set());
  const [sending, setSending] = useState(false);
  const contacted = useMemo(() => loadContactedToday(shop?.id), [shop?.id, sending]);

  const allIds = customers.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allIds.every((id) => prev.has(id))) return new Set();
      return new Set(allIds);
    });
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = async () => {
    const chosen = customers.filter((c) => selected.has(c.id));
    if (chosen.length === 0) return;
    const result = await notify({
      icon: "warning",
      title: `Send ${chosen.length} reminders?`,
      text: `WhatsApp will open ${chosen.length} tab${chosen.length !== 1 ? "s" : ""} — one per customer. Allow pop-ups for this site if prompted.`,
      showCancelButton: true,
      confirmButtonText: "Send all",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setSending(true);
    const r = await sendBulk({ customers: chosen, template, shop });
    setSending(false);
    setSelected(new Set());
    let msg = `Opened ${r.sent} WhatsApp tab${r.sent === 1 ? "" : "s"}. You need to press Send in each one.`;
    if (r.skipped_no_phone) msg += ` ${r.skipped_no_phone} skipped (no WhatsApp).`;
    if (r.blocked)          msg += ` ${r.blocked} blocked — allow pop-ups and retry.`;
    await notify({ icon: r.blocked ? "error" : "success", title: "Reminders sent", text: msg });
  };

  if (customers.length === 0) {
    return <p className="text-brand-muted text-sm font-semibold p-6 text-center">{emptyMsg}</p>;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 rounded border-brand-border accent-brand-primary"
          />
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-text">
            {selected.size === 0 ? "Select all" : `${selected.size} selected`}
          </span>
        </label>
        <button
          type="button"
          onClick={send}
          disabled={sending || selected.size === 0}
          className="h-10 px-4 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          {sending ? "Sending…" : `Send to ${selected.size || "selected"}`}
        </button>
      </div>

      {/* List */}
      <div className="bg-brand-bg border border-brand-border/30 rounded-xl divide-y divide-brand-border/20">
        {customers.map((c) => {
          const wasContacted = !!contacted[c.id];
          return (
            <label key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-brand-elevated transition-colors">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggleOne(c.id)}
                className="size-4 rounded border-brand-border accent-brand-primary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-brand-text truncate">{c.name || "Unnamed"}</p>
                  {wasContacted && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-success bg-brand-success/10 border border-brand-success/30 px-1.5 py-0.5 rounded">Sent today</span>
                  )}
                </div>
                <p className="text-[11px] text-brand-success font-semibold truncate">{c.whatsapp || "(no WhatsApp)"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-bold text-brand-text">{fmtDate(c.last_visit_date)}</p>
                <p className="text-[11px] font-black text-brand-success">{fmtAED(c.total_spent)}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
