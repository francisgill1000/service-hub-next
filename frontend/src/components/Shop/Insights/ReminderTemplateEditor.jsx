"use client";

import React, { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { DEFAULT_TEMPLATE, loadTemplate, saveTemplate, resolveTemplate } from "./sendWhatsApp";

const TOKENS = ["{name}", "{shop_name}", "{shop_url}", "{last_visit}", "{total_visits}"];

export default function ReminderTemplateEditor({ sampleCustomer, onChange }) {
  const { shop } = useShop();
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    const t = loadTemplate(shop.id);
    setTemplate(t);
    onChange?.(t);
  }, [shop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = (next) => {
    setTemplate(next);
    saveTemplate(shop?.id, next);
    onChange?.(next);
  };

  const preview = resolveTemplate(template, { customer: sampleCustomer, shop });

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-brand-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-muted text-[18px]">edit_note</span>
          <span className="text-[11px] font-black uppercase tracking-widest text-brand-text">Reminder template</span>
        </div>
        <span className="material-symbols-outlined text-brand-muted text-[20px]">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-brand-border/20 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => persist(`${template}${template.endsWith(" ") ? "" : " "}${t}`)}
                className="px-2 py-1 rounded-md bg-brand-bg border border-brand-border/40 text-[10px] font-bold text-brand-muted hover:text-brand-primary hover:border-brand-primary/40 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
          <textarea
            value={template}
            onChange={(e) => persist(e.target.value)}
            rows={4}
            className="w-full bg-brand-bg border border-brand-border/30 rounded-xl px-4 py-3 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all resize-y"
          />
          <button
            type="button"
            onClick={() => persist(DEFAULT_TEMPLATE)}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors"
          >
            Reset to default
          </button>
          <div className="bg-brand-bg border border-brand-border/30 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Preview</p>
            <p className="text-sm text-brand-text whitespace-pre-wrap font-medium">{preview}</p>
          </div>
        </div>
      )}
    </div>
  );
}
