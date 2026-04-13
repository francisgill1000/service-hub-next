"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import api from '@/utils/api';

const STATUS_CHIP = {
  "Booked":    "bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/20",
  "Completed": "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20",
  "Cancelled": "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30",
};
const STATUS_DOT = {
  "Booked":    "bg-[#adc6ff]",
  "Completed": "bg-[#4edea3]",
  "Cancelled": "bg-[#8b90a0]",
};

const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Booked',    value: 'booked' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const today = () => new Date().toISOString().slice(0, 10);
const weekStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
};
const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const QUICK_DATES = [
  { label: 'Today',      from: today,      to: today },
  { label: 'This week',  from: weekStart,  to: today },
  { label: 'This month', from: monthStart, to: today },
];

export default function ShopBookingsPage() {
  const router = useRouter();
  const { shop } = useShop();

  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');

  useEffect(() => { fetchBookings(); }, [selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shop/all-bookings', {
        params: { shop_id: shop?.id, status: selectedStatus },
      });
      setBookings(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickDate = (preset) => {
    setDateFrom(preset.from());
    setDateTo(preset.to());
  };

  const clearDates = () => { setDateFrom(''); setDateTo(''); };

  const hasDateFilter = dateFrom || dateTo;

  const filteredBookings = bookings.filter((b) => {
    const ref      = b.booking_reference?.toString().toLowerCase() ?? '';
    const customer = b.customer?.name?.toLowerCase() ?? '';
    const matchSearch = searchTerm === '' ||
      ref.includes(searchTerm.toLowerCase()) ||
      customer.includes(searchTerm.toLowerCase());

    const bDate = b.date ?? b.booking_date ?? '';
    const matchFrom = !dateFrom || bDate >= dateFrom;
    const matchTo   = !dateTo   || bDate <= dateTo;

    return matchSearch && matchFrom && matchTo;
  });

  // Summary counts from full (unfiltered) list
  const counts = {
    total:     bookings.length,
    booked:    bookings.filter(b => b.status === 'Booked').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="max-w-[1024px] mx-auto px-4 md:px-8 pt-6 md:pt-8 space-y-6">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Bookings</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              Manage and track all your service appointments.
            </p>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-[#151c25] border border-[#414755]/30 rounded-xl text-[11px] font-bold text-[#c1c6d7]">
              {counts.total} total
            </span>
            <span className="px-3 py-1.5 bg-[#adc6ff]/10 border border-[#adc6ff]/20 rounded-xl text-[11px] font-bold text-[#adc6ff]">
              {counts.booked} upcoming
            </span>
            <span className="px-3 py-1.5 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl text-[11px] font-bold text-[#4edea3]">
              {counts.completed} done
            </span>
          </div>
        </div>

        {/* Filter card */}
        <div className="bg-[#151c25] rounded-xl p-4 md:p-5 space-y-4 border border-[#414755]/20">

          {/* Row 1 — search + date range */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by booking ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all"
              />
            </div>

            {/* Date from */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">calendar_today</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full md:w-44 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-3 text-sm font-semibold text-white focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all [color-scheme:dark]"
              />
            </div>

            {/* Date to */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">event</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full md:w-44 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-3 text-sm font-semibold text-white focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all [color-scheme:dark]"
              />
            </div>

            {/* Clear dates */}
            {hasDateFilter && (
              <button
                onClick={clearDates}
                className="h-11 px-4 flex items-center gap-1.5 bg-[#19202a] hover:bg-[#242a34] border border-[#414755]/30 rounded-xl text-[#8b90a0] hover:text-white text-xs font-bold transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                Clear
              </button>
            )}
          </div>

          {/* Row 2 — quick date presets + status pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#414755] mr-1">Quick:</span>
            {QUICK_DATES.map((p) => (
              <button
                key={p.label}
                onClick={() => applyQuickDate(p)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                  dateFrom === p.from() && dateTo === p.to()
                    ? 'bg-[#adc6ff]/20 text-[#adc6ff] border-[#adc6ff]/30'
                    : 'bg-[#19202a] text-[#8b90a0] border-[#414755]/30 hover:text-white hover:bg-[#242a34]'
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="w-px h-5 bg-[#414755]/40 mx-1" />

            <span className="text-[10px] font-bold uppercase tracking-widest text-[#414755] mr-1">Status:</span>
            {STATUS_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                onClick={() => setSelectedStatus(f.value)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border whitespace-nowrap ${
                  selectedStatus === f.value
                    ? 'bg-[#adc6ff]/20 text-[#adc6ff] border-[#adc6ff]/30'
                    : 'bg-[#19202a] text-[#8b90a0] border-[#414755]/30 hover:text-white hover:bg-[#242a34]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-[#414755] border-t-[#adc6ff] rounded-full" />
            <p className="text-[#8b90a0] text-sm font-semibold">Loading bookings...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#151c25] border border-[#414755]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#8b90a0]">event_busy</span>
            </div>
            <div>
              <p className="text-white font-black">No bookings found</p>
              <p className="text-[#8b90a0] text-sm font-semibold mt-1">
                {searchTerm || hasDateFilter
                  ? 'Try adjusting your search or date range.'
                  : 'Bookings will appear here once customers start scheduling.'}
              </p>
            </div>
          </div>
        )}

        {/* Desktop — table */}
        {!loading && filteredBookings.length > 0 && (
          <>
            <div className="hidden md:block bg-[#19202a] rounded-xl overflow-hidden border border-[#414755]/20 shadow-xl shadow-black/20">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2e353f]/30 border-b border-[#414755]/20">
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Customer</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Service</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date & Time</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Status</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Amount</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#414755]/10">
                  {filteredBookings.map((booking) => {
                    const customerName = booking.customer?.name || booking.customer_name || 'Guest';
                    const initials = customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                    const services  = booking.services?.map(s => s.title || s.name).join(', ') || '—';
                    const chipClass = STATUS_CHIP[booking.status] ?? STATUS_CHIP['Booked'];
                    const dotClass  = STATUS_DOT[booking.status]  ?? STATUS_DOT['Booked'];

                    return (
                      <tr
                        key={booking.id}
                        className="hover:bg-[#2e353f]/20 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#2e353f] flex items-center justify-center font-bold text-xs text-[#adc6ff] shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-[#adc6ff] transition-colors">{customerName}</p>
                              <p className="text-[10px] text-[#8b90a0] font-medium">{booking.booking_reference}</p>
                            </div>
                          </div>
                        </td>

                        {/* Service */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#dce3f0] max-w-[180px] truncate">{services}</p>
                        </td>

                        {/* Date & time */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-[#dce3f0]">{booking.show_date || booking.date || '—'}</p>
                          {booking.start_time && (
                            <p className="text-[11px] text-[#8b90a0] font-medium mt-0.5">{booking.start_time}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                            {booking.status}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4 text-right">
                          <p className="text-sm font-black text-white">AED {booking.charges || '0'}</p>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/shop/bookings/action?id=${booking.id}`); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#adc6ff]/10 hover:bg-[#adc6ff]/20 text-[#adc6ff] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            View
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table footer */}
              <div className="px-5 py-3 border-t border-[#414755]/20 bg-[#151c25]">
                <p className="text-[11px] font-semibold text-[#8b90a0]">
                  Showing {filteredBookings.length} of {bookings.length} bookings
                </p>
              </div>
            </div>

            {/* Mobile — cards */}
            <div className="md:hidden space-y-3">
              {filteredBookings.map((booking) => {
                const customerName = booking.customer?.name || booking.customer_name || 'Guest';
                const services     = booking.services?.map(s => s.title || s.name).join(', ') || '—';
                const chipClass    = STATUS_CHIP[booking.status] ?? STATUS_CHIP['Booked'];
                const dotClass     = STATUS_DOT[booking.status]  ?? STATUS_DOT['Booked'];

                return (
                  <div
                    key={booking.id}
                    onClick={() => router.push(`/shop/bookings/action?id=${booking.id}`)}
                    className="bg-[#151c25] rounded-xl p-4 border border-[#414755]/20 hover:border-[#414755]/50 cursor-pointer transition-all active:scale-[0.98] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{booking.booking_reference}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${chipClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {booking.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white">{customerName}</p>
                      <p className="text-xs text-[#8b90a0] mt-0.5 font-medium">{services}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#414755]/20">
                      <div>
                        <p className="text-[10px] text-[#8b90a0] uppercase tracking-widest font-bold">Date</p>
                        <p className="text-xs font-semibold text-[#dce3f0] mt-0.5">
                          {booking.show_date || booking.date || '—'}{booking.start_time ? ` · ${booking.start_time}` : ''}
                        </p>
                      </div>
                      <p className="text-base font-black text-white">AED {booking.charges || '0'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
