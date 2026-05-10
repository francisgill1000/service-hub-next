"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import api from "@/utils/api";

const fmtAED = (n) => `AED ${Number(n || 0).toFixed(0)}`;
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

export default function ShopCustomersPage() {
    const { shop } = useShop();
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total: 0, last_page: 1, per_page: 20 });

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

    const totals = useMemo(() => {
        const totalSpent = customers.reduce((s, c) => s + Number(c.total_spent || 0), 0);
        const totalBookings = customers.reduce((s, c) => s + Number(c.bookings_count || 0), 0);
        return { totalSpent, totalBookings };
    }, [customers]);

    const goToBookings = (c) => {
        const q = c.name || c.whatsapp || "";
        router.push(`/shop/bookings${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    };

    const showingFrom = customers.length === 0 ? 0 : (page - 1) * meta.per_page + 1;
    const showingTo   = (page - 1) * meta.per_page + customers.length;

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <div className="px-4 md:px-8 py-6 md:py-8">
                <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Customers</h1>
                        <p className="text-[12px] text-brand-muted font-semibold mt-1">
                            Track every walk-in customer who has booked at your shop.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-brand-elevated border border-brand-border/30 text-[11px] font-black text-brand-text">
                            {meta.total} total
                        </span>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <StatCard label="Customers" value={meta.total} accent="#4b8eff" />
                    <StatCard label="Bookings (page)" value={totals.totalBookings} accent="#a78bfa" />
                    <StatCard label="Revenue (page)" value={fmtAED(totals.totalSpent)} accent="#4edea3" />
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-[20px] pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or WhatsApp number"
                            className="w-full h-12 bg-brand-elevated border border-brand-border/30 rounded-xl pl-12 pr-4 text-sm font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Empty / error / loading states */}
                {loading && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-brand-muted text-sm font-semibold">
                        Loading customers…
                    </div>
                )}
                {!loading && error && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center text-red-400 text-sm font-semibold">
                        {error}
                    </div>
                )}
                {!loading && !error && customers.length === 0 && (
                    <div className="bg-brand-elevated rounded-xl border border-brand-border/20 py-16 text-center">
                        <div className="size-14 mx-auto rounded-2xl bg-brand-elevated border border-brand-border/30 flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-[24px] text-brand-muted">group</span>
                        </div>
                        <p className="text-sm font-bold text-brand-muted">
                            {search ? "No customers match that search." : "No walk-in customers yet."}
                        </p>
                    </div>
                )}

                {/* Desktop table */}
                {!loading && !error && customers.length > 0 && (
                    <>
                        <div className="hidden md:block bg-brand-surface rounded-xl overflow-hidden border border-brand-border shadow-md">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-brand-elevated border-b border-brand-border">
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Customer</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Bookings</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Last visit</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">First visit</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Total spent</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/40">
                                    {customers.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="hover:bg-brand-elevated transition-colors cursor-pointer group"
                                            onClick={() => goToBookings(c)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary shrink-0">
                                                        {initialsOf(c.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors truncate">
                                                            {c.name || "Unnamed customer"}
                                                        </p>
                                                        <p className="text-[10px] text-brand-success font-semibold truncate mt-0.5">
                                                            {c.whatsapp}
                                                        </p>
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
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-brand-text">{fmtDate(c.first_visit_date)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <p className="text-sm font-black text-brand-success">{fmtAED(c.total_spent)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); goToBookings(c); }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    View
                                                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="px-5 py-3 border-t border-brand-border bg-brand-elevated flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-brand-muted">
                                    Showing {showingFrom}–{showingTo} of {meta.total} customer{meta.total === 1 ? "" : "s"}
                                </p>
                                <Pager page={page} lastPage={meta.last_page} setPage={setPage} />
                            </div>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-3">
                            {customers.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => goToBookings(c)}
                                    className="w-full text-left bg-brand-surface rounded-xl p-4 border border-brand-border/20 hover:border-brand-border/50 transition-all active:scale-[0.98] space-y-3"
                                >
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
                                </button>
                            ))}

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

function StatCard({ label, value, accent }) {
    return (
        <div
            className="bg-brand-elevated border border-brand-border/30 rounded-2xl p-4"
            style={{ boxShadow: `inset 3px 0 0 0 ${accent}` }}
        >
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{label}</p>
            <p className="text-xl md:text-2xl font-black text-brand-text mt-1">{value}</p>
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
