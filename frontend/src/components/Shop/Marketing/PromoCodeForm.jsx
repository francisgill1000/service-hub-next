"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import Swal from "sweetalert2";

export default function PromoCodeForm({ open, onClose, shopId, editing, onSaved }) {
  const isEdit = Boolean(editing?.id);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCode(editing.code || "");
      setLabel(editing.label || "");
      setDiscountType(editing.discount_type || "percent");
      setDiscountValue(String(editing.discount_value ?? ""));
      setValidFrom(editing.valid_from ? String(editing.valid_from).slice(0, 10) : "");
      setValidUntil(editing.valid_until ? String(editing.valid_until).slice(0, 10) : "");
      setMaxUses(editing.max_uses ? String(editing.max_uses) : "");
      setIsActive(Boolean(editing.is_active));
    } else {
      setCode("");
      setLabel("");
      setDiscountType("percent");
      setDiscountValue("");
      setValidFrom("");
      setValidUntil("");
      setMaxUses("");
      setIsActive(true);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const submit = async () => {
    if (!code.trim() || !discountValue) {
      Swal.fire({ icon: "warning", title: "Code and discount value are required" });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        shop_id: shopId,
        code: code.trim().toUpperCase(),
        label: label.trim() || null,
        discount_type: discountType,
        discount_value: Number(discountValue),
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        max_uses: maxUses ? Number(maxUses) : null,
        is_active: isActive,
      };
      if (isEdit) {
        delete payload.shop_id;
        delete payload.code; // code is immutable on update (avoids breaking attribution)
        await api.put(`/shop/promo-codes/${editing.id}`, payload);
      } else {
        await api.post("/shop/promo-codes", payload);
      }
      onSaved?.();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Could not save code", text: e?.response?.data?.message || e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:w-[520px] max-h-[95vh] flex flex-col bg-brand-surface md:rounded-2xl rounded-t-2xl border border-brand-border shadow-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-brand-border bg-brand-elevated flex items-start justify-between">
          <div>
            <h3 className="text-lg font-black text-brand-text tracking-tight">
              {isEdit ? "Edit promo code" : "New promo code"}
            </h3>
            <p className="text-[11px] text-brand-muted font-semibold mt-0.5">
              Codes apply at booking creation and are tracked for ROI.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-9 rounded-xl bg-brand-surface hover:bg-brand-hover text-brand-muted hover:text-brand-text flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isEdit}
              placeholder="RAMADAN20"
              className={`mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-black tracking-widest text-brand-primary placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Label (internal)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ramadan promo for lapsed customers"
              className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Discount type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              >
                <option value="percent">Percent off</option>
                <option value="flat">Flat AED off</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                {discountType === "percent" ? "Percent (1–100)" : "Amount (AED)"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Valid from (optional)</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Valid until (optional)</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Max uses (optional)</label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-brand-elevated border border-brand-border cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-5 accent-brand-primary"
            />
            <span className="text-sm font-bold text-brand-text">Active — code can be used now</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-brand-border flex items-center justify-end gap-2 bg-brand-elevated">
          <button
            onClick={onClose}
            className="h-11 px-4 rounded-xl bg-brand-surface hover:bg-brand-hover border border-brand-border text-sm font-bold text-brand-text"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="h-11 px-5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-sm font-black text-white disabled:opacity-40"
          >
            {submitting ? "Saving…" : (isEdit ? "Save changes" : "Create code")}
          </button>
        </div>
      </div>
    </div>
  );
}
