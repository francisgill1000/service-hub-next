"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import Swal from "sweetalert2";

const SEGMENTS = [
  { id: "all",          label: "All customers",            description: "Every customer who has ever booked." },
  { id: "lapsed",       label: "Lapsed (60+ days)",         description: "Customers with no booking in the last 60 days." },
  { id: "recent",       label: "Recent (last 30 days)",     description: "Active customers — perfect for upsell or thank-you." },
  { id: "top_spenders", label: "Top 20% spenders",          description: "Highest-value customers by lifetime AED." },
  { id: "birthday",     label: "Birthday this month",       description: "Send a birthday treat (requires birthday data)." },
];

const STEPS = [
  { id: 1, label: "Audience" },
  { id: 2, label: "Message" },
  { id: 3, label: "Send" },
];

export default function CampaignWizard({ open, onClose, shopId, promoCodes, onSent }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("lapsed");
  const [message, setMessage] = useState("");
  const [promoCodeId, setPromoCodeId] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentResult, setSentResult] = useState(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setName("");
      setSegment("lapsed");
      setMessage("");
      setPromoCodeId("");
      setRecipients([]);
      setSentResult(null);
    }
  }, [open]);

  // Lock scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Preview recipients when segment changes
  useEffect(() => {
    if (!open || !shopId) return;
    let cancelled = false;
    setLoadingPreview(true);
    api.get("/shop/marketing/segments", { params: { shop_id: shopId, segment } })
      .then(({ data }) => { if (!cancelled) setRecipients(data?.recipients || []); })
      .catch(() => { if (!cancelled) setRecipients([]); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [open, shopId, segment]);

  const selectedCode = useMemo(
    () => (promoCodes || []).find((c) => String(c.id) === String(promoCodeId)) || null,
    [promoCodes, promoCodeId]
  );

  const renderedMessage = (rawMessage, customerName) => {
    let m = (rawMessage || "").replace(/\{\{\s*name\s*\}\}/gi, customerName || "there");
    if (selectedCode) {
      m = m
        .replace(/\{\{\s*code\s*\}\}/gi, selectedCode.code)
        .replace(/\{\{\s*discount\s*\}\}/gi,
          selectedCode.discount_type === "percent"
            ? `${Number(selectedCode.discount_value)}%`
            : `AED ${Number(selectedCode.discount_value)}`);
    }
    return m;
  };

  const canAdvance =
    step === 1 ? recipients.length > 0 :
    step === 2 ? message.trim().length > 0 && name.trim().length > 0 :
    true;

  const handleNext = () => {
    if (!canAdvance) {
      Swal.fire({ icon: "warning", title:
        step === 1 ? "No recipients in this segment." :
        "Add a campaign name and message."
      });
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSend = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/shop/marketing/campaigns", {
        shop_id: shopId,
        name: name.trim(),
        segment,
        message_template: message,
        promo_code_id: promoCodeId || null,
      });
      setSentResult(data?.data);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Could not send", text: e?.response?.data?.message || e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsAppFor = (recipient) => {
    const digits = String(recipient.whatsapp || "").replace(/\D+/g, "");
    if (!digits) return;
    const text = encodeURIComponent(renderedMessage(message, recipient.name));
    window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
  };

  const openWhatsAppForAll = () => {
    if (!sentResult) return;
    sentResult.recipients.forEach((r, idx) => {
      // Stagger by 250ms so the browser doesn't block as a popup storm.
      setTimeout(() => openWhatsAppFor(r), idx * 250);
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full md:w-[720px] max-h-[95vh] flex flex-col bg-brand-surface md:rounded-2xl rounded-t-2xl border border-brand-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-brand-border bg-brand-elevated">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-brand-text tracking-tight">
                {sentResult ? "Send to WhatsApp" : "New campaign"}
              </h3>
              <p className="text-[11px] text-brand-muted font-semibold mt-0.5">
                {sentResult
                  ? `${sentResult.recipients_count} recipients ready. Open WhatsApp per person or all at once.`
                  : "WhatsApp blast to a customer segment with optional promo code attribution."}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="size-9 rounded-xl bg-brand-surface hover:bg-brand-hover text-brand-muted hover:text-brand-text flex items-center justify-center transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          {!sentResult && <Stepper step={step} />}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {sentResult ? (
            <SendStep
              recipients={sentResult.recipients}
              renderedMessage={(name) => renderedMessage(message, name)}
              openWhatsAppFor={openWhatsAppFor}
              openAll={openWhatsAppForAll}
            />
          ) : step === 1 ? (
            <AudienceStep
              segment={segment}
              setSegment={setSegment}
              recipients={recipients}
              loading={loadingPreview}
            />
          ) : step === 2 ? (
            <MessageStep
              name={name}
              setName={setName}
              message={message}
              setMessage={setMessage}
              promoCodes={promoCodes}
              promoCodeId={promoCodeId}
              setPromoCodeId={setPromoCodeId}
              previewRecipient={recipients[0]}
              renderedPreview={renderedMessage(message, recipients[0]?.name)}
            />
          ) : (
            <ConfirmStep
              name={name}
              segment={segment}
              recipientsCount={recipients.length}
              promoCode={selectedCode}
              message={message}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-border flex items-center justify-between gap-3 bg-brand-elevated">
          <div className="text-[11px] font-bold text-brand-muted">
            {sentResult
              ? `Campaign saved · ${sentResult.recipients_count} recipients`
              : `${recipients.length} ${recipients.length === 1 ? "recipient" : "recipients"} in segment`}
          </div>
          <div className="flex items-center gap-2">
            {sentResult ? (
              <button
                onClick={onSent}
                className="h-11 px-5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-sm font-black text-white"
              >
                Done
              </button>
            ) : step > 1 ? (
              <button
                onClick={handleBack}
                className="h-11 px-4 rounded-xl bg-brand-surface hover:bg-brand-hover border border-brand-border text-sm font-bold text-brand-text"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="h-11 px-4 rounded-xl bg-brand-surface hover:bg-brand-hover border border-brand-border text-sm font-bold text-brand-text"
              >
                Cancel
              </button>
            )}

            {!sentResult && step < 3 && (
              <button
                onClick={handleNext}
                disabled={!canAdvance || loadingPreview}
                className="h-11 px-5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-sm font-black text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
            {!sentResult && step === 3 && (
              <button
                onClick={handleSend}
                disabled={submitting}
                className="h-11 px-5 rounded-xl bg-brand-success hover:bg-brand-success/90 text-sm font-black text-white disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Save & open WhatsApp"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const active = s.id === step;
        const done = s.id < step;
        return (
          <React.Fragment key={s.id}>
            <div className={`size-7 rounded-lg flex items-center justify-center text-[11px] font-black ${
              active ? "bg-brand-primary text-white" :
              done ? "bg-brand-primary/20 text-brand-primary border border-brand-primary/40" :
              "bg-brand-surface text-brand-muted border border-brand-border"
            }`}>
              {done ? <span className="material-symbols-outlined text-[14px]">check</span> : s.id}
            </div>
            <span className={`text-[11px] font-black uppercase tracking-widest hidden sm:inline ${
              active ? "text-brand-text" : done ? "text-brand-primary" : "text-brand-muted"
            }`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-brand-primary/40" : "bg-brand-border"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AudienceStep({ segment, setSegment, recipients, loading }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Pick an audience</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SEGMENTS.map((s) => {
          const active = s.id === segment;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegment(s.id)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                active
                  ? "border-brand-primary bg-brand-elevated"
                  : "border-brand-border hover:border-brand-muted bg-brand-surface"
              }`}
            >
              <p className="text-sm font-black text-brand-text">{s.label}</p>
              <p className="text-[11px] text-brand-muted font-semibold mt-0.5">{s.description}</p>
            </button>
          );
        })}
      </div>
      <div className="bg-brand-elevated border border-brand-border rounded-xl p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2">Preview</p>
        {loading ? (
          <p className="text-sm text-brand-muted">Resolving recipients…</p>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-brand-muted">No customers match this segment.</p>
        ) : (
          <>
            <p className="text-2xl font-black text-brand-primary">{recipients.length}</p>
            <p className="text-[11px] text-brand-muted font-semibold mt-0.5">customers will receive this campaign</p>
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {recipients.slice(0, 30).map((r, i) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-brand-surface text-[10px] font-bold text-brand-text border border-brand-border">
                  {r.name || r.whatsapp}
                </span>
              ))}
              {recipients.length > 30 && (
                <span className="px-2 py-1 text-[10px] font-bold text-brand-muted">+{recipients.length - 30} more</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageStep({ name, setName, message, setMessage, promoCodes, promoCodeId, setPromoCodeId, previewRecipient, renderedPreview }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Campaign name (internal)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. May lapsed customers — 20% off"
          className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Attach a promo code (optional)</label>
        <select
          value={promoCodeId}
          onChange={(e) => setPromoCodeId(e.target.value)}
          className="mt-2 w-full h-11 bg-brand-bg border border-brand-border rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
        >
          <option value="">— No code —</option>
          {(promoCodes || []).filter((c) => c.is_active).map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} ({c.discount_type === "percent" ? `${c.discount_value}%` : `AED ${c.discount_value}`} off)
            </option>
          ))}
        </select>
        <p className="text-[10px] text-brand-muted font-semibold mt-1">Bookings that use this code will be attributed to this campaign automatically.</p>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">WhatsApp message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={"Hi {{name}}! We miss you at our salon. Use code {{code}} for {{discount}} off your next booking."}
          className="mt-2 w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-sm font-medium text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none resize-none"
        />
        <p className="text-[10px] text-brand-muted font-semibold mt-1">
          Use <code className="px-1 py-0.5 bg-brand-elevated rounded">{`{{name}}`}</code>,
          {" "}<code className="px-1 py-0.5 bg-brand-elevated rounded">{`{{code}}`}</code>,
          {" "}<code className="px-1 py-0.5 bg-brand-elevated rounded">{`{{discount}}`}</code> for personalisation.
        </p>
      </div>

      {message && (
        <div className="bg-brand-elevated border border-brand-border rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2">
            Preview {previewRecipient?.name ? `for ${previewRecipient.name}` : ""}
          </p>
          <p className="text-sm font-medium text-brand-text whitespace-pre-wrap">{renderedPreview}</p>
        </div>
      )}
    </div>
  );
}

function ConfirmStep({ name, segment, recipientsCount, promoCode, message }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-text">Review before sending. After saving, WhatsApp opens for each recipient pre-filled with the message.</p>
      <div className="bg-brand-elevated border border-brand-border rounded-xl p-4 space-y-2">
        <Row label="Campaign" value={name} />
        <Row label="Audience" value={`${segment} · ${recipientsCount} recipients`} />
        <Row label="Promo code" value={promoCode ? `${promoCode.code} (${promoCode.discount_type === "percent" ? `${promoCode.discount_value}% off` : `AED ${promoCode.discount_value} off`})` : "—"} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-2">Message</p>
        <p className="text-sm whitespace-pre-wrap bg-brand-bg border border-brand-border rounded-xl p-3 text-brand-text">{message}</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-muted">{label}</span>
      <span className="text-sm font-bold text-brand-text text-right">{value}</span>
    </div>
  );
}

function SendStep({ recipients, renderedMessage, openWhatsAppFor, openAll }) {
  return (
    <div className="space-y-4">
      <div className="bg-brand-success/10 border border-brand-success/30 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-brand-success text-[24px]">check_circle</span>
        <div>
          <p className="text-sm font-black text-brand-success">Campaign saved.</p>
          <p className="text-[11px] font-semibold text-brand-text mt-0.5">
            Click "Open all" to launch WhatsApp for each recipient (browser may ask permission for popups), or open them one-by-one.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{recipients.length} recipients</p>
        <button
          onClick={openAll}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white text-[11px] font-black uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          Open all in WhatsApp
        </button>
      </div>

      <ul className="space-y-2 max-h-[380px] overflow-y-auto">
        {recipients.map((r, i) => (
          <li key={i} className="flex items-center gap-3 bg-brand-elevated border border-brand-border rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-text truncate">{r.name || "Unnamed"}</p>
              <p className="text-[11px] font-semibold text-brand-muted truncate">{r.whatsapp}</p>
            </div>
            <button
              onClick={() => openWhatsAppFor(r)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white text-[11px] font-black uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              Send
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
