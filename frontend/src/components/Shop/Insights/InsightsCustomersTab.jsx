"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { loadTemplate, sendOne } from "./sendWhatsApp";

const fmtAED = (n) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
};
const initialsOf = (name) =>
  String(name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const daysSince = (iso) => {
  if (!iso) return null;
  const ms = Date.now() - new Date(`${iso}T00:00:00`).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const SORTS = [
  { key: "recent",  label: "Most recent visit" },
  { key: "spend",   label: "Highest spend" },
  { key: "count",   label: "Most bookings" },
  { key: "lapsed",  label: "Longest lapsed" },
];

const DATE_FILTERS = [
  { key: "all",   label: "All time" },
  { key: "30d",   label: "Last 30 days" },
  { key: "90d",   label: "Last 90 days" },
  { key: "year",  label: "This year" },
];

function inDateFilter(iso, key) {
  if (key === "all" || !iso) return key === "all";
  const d = new Date(`${iso}T00:00:00`);
  const now = new Date();
  if (key === "30d") return (now - d) <= 30 * 86400000;
  if (key === "90d") return (now - d) <= 90 * 86400000;
  if (key === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

export default function InsightsCustomersTab() {
  const { shop } = useShop();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, last_page: 1, per_page: 20 });
  const [sortKey, setSortKey] = useState("recent");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    if (!shop?.id) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/shops/${shop.id}/customers`, {
          params: { search, page, per_page: 20 },
        });
        if (cancelled) return;
        setCustomers(data?.data || []);
        setMeta({
          total: data?.total || 0,
          last_page: data?.last_page || 1,
          per_page: data?.per_page || 20,
        });
        setError(null);
      } catch {
        if (!cancelled) setError("Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [shop?.id, search, page]);

  const visible = useMemo(() => {
    const filtered = customers.filter((c) => inDateFilter(c.last_visit_date, dateFilter));
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortKey === "spend")  return Number(b.total_spent || 0) - Number(a.total_spent || 0);
      if (sortKey === "count")  return Number(b.bookings_count || 0) - Number(a.bookings_count || 0);
      if (sortKey === "lapsed") {
        const da = daysSince(a.last_visit_date) ?? Infinity;
        const db = daysSince(b.last_visit_date) ?? Infinity;
        return db - da;
      }
      // recent
      const da = a.last_visit_date || "";
      const db = b.last_visit_date || "";
      return db.localeCompare(da);
    });
    return sorted;
  }, [customers, sortKey, dateFilter]);

  const kpis = useMemo(() => {
    const bookings = visible.reduce((s, c) => s + Number(c.bookings_count || 0), 0);
    const revenue  = visible.reduce((s, c) => s + Number(c.total_spent || 0), 0);
    const avg = visible.length ? revenue / visible.length : 0;
    return { customers: visible.length, bookings, revenue, avg };
  }, [visible]);

  const sendReminder = (c) => {
    const template = loadTemplate(shop?.id);
    const r = sendOne({ customer: c, template, shop });
    if (r.reason === "no_phone") alert("This customer has no WhatsApp number.");
    else if (r.reason === "popup_blocked") alert("WhatsApp tab was blocked. Allow pop-ups for this site.");
  };

  const goToBookings = (c) => {
    const q = c.name || c.whatsapp || "";
    router.push(`/shop/bookings${q ? `?search=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Customers"      value={meta.total}             sub="(total)" accent="#4b8eff" />
        <Kpi label="Bookings"       value={kpis.bookings}          sub="(this page)" accent="#a78bfa" />
        <Kpi label="Revenue"        value={fmtAED(kpis.revenue)}   sub="(this page)" accent="#4edea3" />
        <Kpi label="Avg lifetime"   value={fmtAED(kpis.avg)}       sub="(this page)" accent="#f59e0b" />
      </div>

      {/* Controls */}
      <div className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or WhatsApp number"
            className="w-full h-12 bg-brand-bg border border-brand-border/30 rounded-xl pl-12 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={sortKey} onChange={setSortKey} options={SORTS} icon="sort" />
          <Select value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} icon="event" />
        </div>
      </div>

      {/* States */}
      {loading && <Empty msg="Loading customers…" />}
      {!loading && error && <Empty msg={error} tone="error" />}
      {!loading && !error && visible.length === 0 && (
        <Empty msg={search ? "No customers match that search." : "No customers yet."} />
      )}

      {/* Desktop table */}
      {!loading && !error && visible.length > 0 && (
        <>
          <div className="hidden md:block bg-brand-surface rounded-xl overflow-hidden border border-brand-border shadow-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-elevated border-b border-brand-border">
                  <Th>Customer</Th>
                  <Th>Bookings</Th>
                  <Th>Last visit</Th>
                  <Th>First visit</Th>
                  <Th className="text-right">Total spent</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {visible.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-elevated transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">
                          {initialsOf(c.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-brand-text truncate">{c.name || "Unnamed customer"}</p>
                          <p className="text-[10px] text-brand-success font-semibold truncate mt-0.5">{c.whatsapp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-black">
                        {c.bookings_count}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-text">{fmtDate(c.last_visit_date)}</p>
                      {daysSince(c.last_visit_date) != null && (
                        <p className="text-[10px] text-brand-muted mt-0.5">{daysSince(c.last_visit_date)} days ago</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-text">{fmtDate(c.first_visit_date)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-sm font-black text-brand-success">{fmtAED(c.total_spent)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => goToBookings(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => sendReminder(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <span className="material-symbols-outlined text-[12px]">send</span>
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-brand-border bg-brand-elevated flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold text-brand-muted">
                Showing {visible.length} of {meta.total}
              </p>
              <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {visible.map((c) => (
              <div key={c.id} className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-sm text-brand-primary shrink-0">
                    {initialsOf(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-brand-text truncate">{c.name || "Unnamed customer"}</p>
                    <p className="text-[11px] text-brand-success font-semibold truncate mt-0.5">{c.whatsapp}</p>
                  </div>
                  <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-black shrink-0">
                    {c.bookings_count}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border/20">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Last visit</p>
                    <p className="text-xs font-semibold text-brand-text mt-0.5">{fmtDate(c.last_visit_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Total spent</p>
                    <p className="text-xs font-black text-brand-success mt-0.5">{fmtAED(c.total_spent)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => goToBookings(c)}
                    className="flex-1 h-10 rounded-xl bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest"
                  >View bookings</button>
                  <button
                    type="button"
                    onClick={() => sendReminder(c)}
                    className="flex-1 h-10 rounded-xl bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    Send reminder
                  </button>
                </div>
              </div>
            ))}
            <div className="bg-brand-surface rounded-xl border border-brand-border/20 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold text-brand-muted">{visible.length} of {meta.total}</p>
              <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div className="bg-brand-elevated border border-brand-border/30 rounded-2xl p-4" style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</p>
      <p className="text-xl md:text-2xl font-black text-brand-text mt-1">{value}</p>
      {sub && <p className="text-[10px] text-brand-muted font-semibold mt-1">{sub}</p>}
    </div>
  );
}

function Select({ value, onChange, options, icon }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-[18px] pointer-events-none">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full md:w-56 bg-brand-bg border border-brand-border/40 rounded-xl pl-11 pr-10 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all appearance-none cursor-pointer [color-scheme:dark]"
      >
        {options.map((o) => (<option key={o.key} value={o.key}>{o.label}</option>))}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">expand_more</span>
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest ${className}`}>{children}</th>;
}

function Empty({ msg, tone }) {
  return (
    <div className={`bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-sm font-semibold ${tone === "error" ? "text-red-400" : "text-brand-muted"}`}>
      {msg}
    </div>
  );
}

function Pager({ page, lastPage, setPage }) {
  if (lastPage <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
        className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Previous page">
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
      </button>
      <span className="text-[11px] text-brand-muted font-bold whitespace-nowrap">{page} / {lastPage}</span>
      <button type="button" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}
        className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Next page">
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
}
