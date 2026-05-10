"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import CampaignWizard from "@/components/Shop/Marketing/CampaignWizard";
import PromoCodeForm from "@/components/Shop/Marketing/PromoCodeForm";
import Swal from "sweetalert2";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function MarketingPage() {
  const router = useRouter();
  const { shop, loading } = useShop();
  const [tab, setTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState({ campaigns: 0, messages_sent: 0, bookings_count: 0, revenue: 0 });
  const [codes, setCodes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [codeFormOpen, setCodeFormOpen] = useState(false);
  const [codeBeingEdited, setCodeBeingEdited] = useState(null);

  useEffect(() => {
    if (!loading && !shop) router.push("/login");
  }, [loading, shop, router]);

  const fetchAll = useCallback(async () => {
    if (!shop?.id) return;
    setLoadingData(true);
    try {
      const [c, p] = await Promise.all([
        api.get("/shop/marketing/campaigns", { params: { shop_id: shop.id } }),
        api.get("/shop/promo-codes", { params: { shop_id: shop.id } }),
      ]);
      setCampaigns(c.data?.data || []);
      setSummary(c.data?.summary || { campaigns: 0, messages_sent: 0, bookings_count: 0, revenue: 0 });
      setCodes(p.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [shop?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const deleteCode = async (code) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: `Delete code "${code.code}"?`,
      text: "This will not affect bookings already created with this code.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#C0392B",
    });
    if (!ok.isConfirmed) return;
    try {
      await api.delete(`/shop/promo-codes/${code.id}`);
      fetchAll();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Could not delete", text: e?.response?.data?.message || e.message });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Marketing</h2>
            <p className="text-brand-muted font-semibold mt-1 text-sm">
              Send WhatsApp campaigns and track ROI from promo codes.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {tab === "campaigns" ? (
              <button
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest shadow-md shadow-brand-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Campaign
              </button>
            ) : (
              <button
                onClick={() => { setCodeBeingEdited(null); setCodeFormOpen(true); }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest shadow-md shadow-brand-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Promo Code
              </button>
            )}
          </div>
        </div>

        {/* ROI summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Campaigns this month" value={summary.campaigns} />
          <SummaryCard label="Messages sent" value={summary.messages_sent} />
          <SummaryCard label="Bookings attributed" value={summary.bookings_count} accent="success" />
          <SummaryCard label="Revenue earned" value={fmtAED(summary.revenue)} accent="success" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-xl p-1 overflow-x-auto">
          <Tab active={tab === "campaigns"} onClick={() => setTab("campaigns")} icon="campaign">Campaigns</Tab>
          <Tab active={tab === "codes"} onClick={() => setTab("codes")} icon="local_offer">Promo Codes</Tab>
        </div>

        {/* Body */}
        {loadingData ? (
          <div className="text-center text-brand-muted text-sm py-12">Loading…</div>
        ) : tab === "campaigns" ? (
          <CampaignsTable campaigns={campaigns} onNew={() => setWizardOpen(true)} fmtDate={fmtDate} />
        ) : (
          <PromoCodesTable
            codes={codes}
            onNew={() => { setCodeBeingEdited(null); setCodeFormOpen(true); }}
            onEdit={(c) => { setCodeBeingEdited(c); setCodeFormOpen(true); }}
            onDelete={deleteCode}
          />
        )}
      </div>

      <CampaignWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        shopId={shop?.id}
        promoCodes={codes}
        onSent={() => { setWizardOpen(false); fetchAll(); }}
      />

      <PromoCodeForm
        open={codeFormOpen}
        onClose={() => setCodeFormOpen(false)}
        shopId={shop?.id}
        editing={codeBeingEdited}
        onSaved={() => { setCodeFormOpen(false); fetchAll(); }}
      />
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  const valueClass = accent === "success" ? "text-brand-success" : "text-brand-text";
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{label}</p>
      <p className={`text-xl font-black mt-1.5 ${valueClass}`}>{value}</p>
    </div>
  );
}

function Tab({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
        active ? "bg-brand-primary text-white" : "text-brand-muted hover:text-brand-primary"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {children}
    </button>
  );
}

function CampaignsTable({ campaigns, onNew, fmtDate }) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-xl py-16 text-center">
        <div className="size-14 mx-auto rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[28px] text-brand-muted">campaign</span>
        </div>
        <p className="text-sm font-bold text-brand-text">No campaigns yet</p>
        <p className="text-[11px] text-brand-muted font-semibold mt-1">Send your first WhatsApp campaign to bring customers back.</p>
        <button
          onClick={onNew}
          className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Campaign
        </button>
      </div>
    );
  }

  const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl shadow-md overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-brand-elevated border-b border-brand-border">
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Campaign</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Segment</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Promo</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Sent</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Bookings</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Revenue</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/40">
          {campaigns.map((c) => (
            <tr key={c.id} className="hover:bg-brand-elevated transition-colors">
              <td className="px-5 py-4">
                <p className="text-sm font-bold text-brand-text">{c.name}</p>
                <p className="text-[10px] text-brand-muted font-medium mt-0.5 max-w-xs truncate">
                  {c.message_template?.slice(0, 70)}{c.message_template?.length > 70 ? "…" : ""}
                </p>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex px-2 py-1 rounded-lg bg-brand-elevated text-brand-text text-[10px] font-black uppercase tracking-wider">
                  {c.segment || "all"}
                </span>
              </td>
              <td className="px-5 py-4">
                {c.promo_code ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-success/10 text-brand-success text-[10px] font-black tracking-wider">
                    {c.promo_code.code}
                  </span>
                ) : (
                  <span className="text-brand-muted text-xs">—</span>
                )}
              </td>
              <td className="px-5 py-4 text-right text-sm font-semibold text-brand-text">{c.recipients_count}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-brand-primary">{c.bookings_count}</td>
              <td className="px-5 py-4 text-right text-sm font-black text-brand-success">{fmtAED(c.revenue)}</td>
              <td className="px-5 py-4 text-xs text-brand-muted font-semibold">{fmtDate(c.sent_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PromoCodesTable({ codes, onNew, onEdit, onDelete }) {
  if (codes.length === 0) {
    return (
      <div className="bg-brand-surface border border-brand-border rounded-xl py-16 text-center">
        <div className="size-14 mx-auto rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[28px] text-brand-muted">local_offer</span>
        </div>
        <p className="text-sm font-bold text-brand-text">No promo codes yet</p>
        <p className="text-[11px] text-brand-muted font-semibold mt-1">Create a code to attach to a campaign or share publicly.</p>
        <button
          onClick={onNew}
          className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Promo Code
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl shadow-md overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[720px]">
        <thead>
          <tr className="bg-brand-elevated border-b border-brand-border">
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Code</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Discount</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Validity</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Uses</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status</th>
            <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/40">
          {codes.map((c) => (
            <tr key={c.id} className="hover:bg-brand-elevated transition-colors">
              <td className="px-5 py-4">
                <p className="text-sm font-black text-brand-primary tracking-wider">{c.code}</p>
                {c.label && <p className="text-[10px] text-brand-muted font-medium mt-0.5">{c.label}</p>}
              </td>
              <td className="px-5 py-4 text-sm font-bold text-brand-text">
                {c.discount_type === "percent"
                  ? `${Number(c.discount_value)}% off`
                  : `AED ${Number(c.discount_value)} off`}
              </td>
              <td className="px-5 py-4 text-xs text-brand-muted">
                {c.valid_from || c.valid_until
                  ? `${c.valid_from || "—"} → ${c.valid_until || "—"}`
                  : "Always valid"}
              </td>
              <td className="px-5 py-4 text-right text-sm font-bold text-brand-text">
                {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  c.is_active
                    ? "bg-brand-success/10 text-brand-success border border-brand-success/30"
                    : "bg-brand-border/40 text-brand-muted border border-brand-border"
                }`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => onEdit(c)}
                    className="size-8 rounded-lg bg-brand-elevated hover:bg-brand-hover text-brand-text flex items-center justify-center"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    className="size-8 rounded-lg bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger flex items-center justify-center"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
