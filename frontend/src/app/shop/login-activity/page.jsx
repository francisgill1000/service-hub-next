"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useShop } from "@/context/ShopContext";
import api from "@/utils/api";

const METHOD_BADGE = {
    pin:  { label: "PIN",  icon: "pin",            accent: "text-brand-primary bg-brand-primary/10 border-brand-primary/20" },
    qr:   { label: "QR",   icon: "qr_code_2",      accent: "text-brand-success bg-brand-success/10 border-brand-success/20" },
    auto: { label: "Auto", icon: "auto_awesome",   accent: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
};

const fmtDateTime = (s) => {
    if (!s) return "—";
    try {
        return new Date(s).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return s;
    }
};

const timeAgo = (s) => {
    if (!s) return "Never";
    const diffMs = Date.now() - new Date(s).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return "Just now";
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
    return fmtDateTime(s);
};

const shortDevice = (deviceId) => {
    if (!deviceId) return "—";
    return deviceId.length > 12 ? deviceId.slice(0, 8) + "…" + deviceId.slice(-4) : deviceId;
};

export default function ShopLoginActivityPage() {
    const { shop } = useShop();
    const [activities, setActivities] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [method, setMethod] = useState("");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, last_page: 1, per_page: 15 });

    useEffect(() => { setPage(1); }, [method, search, dateFrom, dateTo]);

    useEffect(() => {
        if (!shop?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get("/shop/login-activity/summary");
                if (!cancelled) setSummary(data);
            } catch {
                if (!cancelled) setSummary(null);
            }
        })();
        return () => { cancelled = true; };
    }, [shop?.id]);

    useEffect(() => {
        if (!shop?.id) return;
        let cancelled = false;
        const t = setTimeout(async () => {
            try {
                setLoading(true);
                const { data } = await api.get("/shop/login-activity", {
                    params: {
                        login_method: method || undefined,
                        search: search || undefined,
                        date_from: dateFrom || undefined,
                        date_to: dateTo || undefined,
                        page,
                        per_page: 15,
                    },
                });
                if (cancelled) return;
                setActivities(data?.data || []);
                setMeta({
                    total: data?.total || 0,
                    last_page: data?.last_page || 1,
                    per_page: data?.per_page || 15,
                });
                setError(null);
            } catch {
                if (!cancelled) setError("Failed to load login activity");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(t); };
    }, [shop?.id, method, search, dateFrom, dateTo, page]);

    const showingFrom = activities.length === 0 ? 0 : (page - 1) * meta.per_page + 1;
    const showingTo   = (page - 1) * meta.per_page + activities.length;

    const lastBadge = summary?.last_login_method ? METHOD_BADGE[summary.last_login_method] : null;

    const hasFilters = useMemo(
        () => Boolean(method || search || dateFrom || dateTo),
        [method, search, dateFrom, dateTo]
    );

    const clearFilters = () => {
        setMethod("");
        setSearch("");
        setDateFrom("");
        setDateTo("");
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <div className="px-4 md:px-8 py-6 md:py-8">
                <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Login Activity</h1>
                        <p className="text-[12px] text-brand-muted font-semibold mt-1">
                            Every sign-in to your shop account — see when, how, and from where.
                        </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-brand-elevated border border-brand-border/30 text-[11px] font-black text-brand-text">
                        {meta.total} total
                    </span>
                </header>

                {/* Last login summary */}
                <div className="bg-brand-surface rounded-2xl border border-brand-border/30 p-5 mb-6 shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Last login</p>
                    {summary?.last_login_at ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <p className="text-xl md:text-2xl font-black text-brand-text">
                                    {timeAgo(summary.last_login_at)}
                                </p>
                                <p className="text-xs text-brand-muted font-semibold mt-1">
                                    {fmtDateTime(summary.last_login_at)}
                                </p>
                            </div>
                            {lastBadge && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest ${lastBadge.accent}`}>
                                    <span className="material-symbols-outlined text-[16px]">{lastBadge.icon}</span>
                                    {lastBadge.label}
                                </span>
                            )}
                            {summary?.last_login_ip && (
                                <span className="px-3 py-1.5 rounded-xl bg-brand-elevated border border-brand-border/30 text-[11px] font-semibold text-brand-text">
                                    IP: {summary.last_login_ip}
                                </span>
                            )}
                            <span className="px-3 py-1.5 rounded-xl bg-brand-elevated border border-brand-border/30 text-[11px] font-semibold text-brand-muted ml-auto">
                                Lifetime logins: {summary?.total_logins ?? 0}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm font-semibold text-brand-muted">No logins recorded yet.</p>
                    )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="h-12 bg-brand-elevated border border-brand-border/30 rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none"
                    >
                        <option value="">All methods</option>
                        <option value="pin">PIN</option>
                        <option value="qr">QR</option>
                        <option value="auto">Auto</option>
                    </select>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-12 bg-brand-elevated border border-brand-border/30 rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-12 bg-brand-elevated border border-brand-border/30 rounded-xl px-4 text-sm font-semibold text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none"
                    />
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search IP or device"
                            className="w-full h-12 bg-brand-elevated border border-brand-border/30 rounded-xl pl-12 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none"
                        />
                    </div>
                </div>

                {hasFilters && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-elevated hover:bg-brand-hover text-brand-muted hover:text-brand-text rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                            Clear filters
                        </button>
                    </div>
                )}

                {/* States */}
                {loading && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-brand-muted text-sm font-semibold">
                        Loading login activity…
                    </div>
                )}
                {!loading && error && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-red-400 text-sm font-semibold">
                        {error}
                    </div>
                )}
                {!loading && !error && activities.length === 0 && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center">
                        <div className="size-14 mx-auto rounded-2xl bg-brand-elevated border border-brand-border/30 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-[24px] text-brand-muted">history</span>
                        </div>
                        <p className="text-sm font-bold text-brand-muted">
                            {hasFilters ? "No logins match those filters." : "No login activity yet."}
                        </p>
                    </div>
                )}

                {/* Desktop table */}
                {!loading && !error && activities.length > 0 && (
                    <>
                        <div className="hidden md:block bg-brand-surface rounded-xl overflow-hidden border border-brand-border shadow-md">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-brand-elevated border-b border-brand-border">
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">When</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Method</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">IP</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Device</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Browser / OS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/40">
                                    {activities.map((a) => {
                                        const badge = METHOD_BADGE[a.login_method] || METHOD_BADGE.pin;
                                        return (
                                            <tr key={a.id} className="hover:bg-brand-elevated transition-colors">
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-bold text-brand-text">{fmtDateTime(a.logged_in_at)}</p>
                                                    <p className="text-[10px] text-brand-muted font-semibold mt-0.5">{timeAgo(a.logged_in_at)}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badge.accent}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-brand-text">{a.ip_address || "—"}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-mono text-brand-muted" title={a.device_id || ""}>
                                                        {shortDevice(a.device_id)}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 max-w-[280px]">
                                                    <p className="text-[11px] text-brand-muted truncate" title={a.user_agent || ""}>
                                                        {a.user_agent || "—"}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="px-5 py-3 border-t border-brand-border bg-brand-elevated flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-brand-muted">
                                    Showing {showingFrom}–{showingTo} of {meta.total}
                                </p>
                                <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {activities.map((a) => {
                                const badge = METHOD_BADGE[a.login_method] || METHOD_BADGE.pin;
                                return (
                                    <div
                                        key={a.id}
                                        className="bg-brand-surface rounded-xl p-4 border border-brand-border/20 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-brand-text">{fmtDateTime(a.logged_in_at)}</p>
                                                <p className="text-[11px] text-brand-muted font-semibold mt-0.5">{timeAgo(a.logged_in_at)}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shrink-0 ${badge.accent}`}>
                                                <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-brand-border/20">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">IP</p>
                                                <p className="text-xs font-semibold text-brand-text mt-0.5">{a.ip_address || "—"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Device</p>
                                                <p className="text-xs font-mono text-brand-muted mt-0.5" title={a.device_id || ""}>
                                                    {shortDevice(a.device_id)}
                                                </p>
                                            </div>
                                        </div>

                                        {a.user_agent && (
                                            <p className="text-[10px] text-brand-muted truncate pt-2 border-t border-brand-border/20" title={a.user_agent}>
                                                {a.user_agent}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="bg-brand-surface rounded-xl border border-brand-border/20 px-4 py-3 flex items-center justify-between gap-3">
                                <p className="text-[10px] font-semibold text-brand-muted">
                                    {showingFrom}–{showingTo} of {meta.total}
                                </p>
                                <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function Pager({ page, lastPage, setPage }) {
    if (lastPage <= 1) return null;
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Previous page"
            >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="text-[11px] text-brand-muted font-bold whitespace-nowrap">
                {page} / {lastPage}
            </span>
            <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                className="h-9 w-9 rounded-lg bg-brand-elevated hover:bg-brand-hover text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Next page"
            >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
        </div>
    );
}
