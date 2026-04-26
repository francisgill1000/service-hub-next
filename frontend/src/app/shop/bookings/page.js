"use client";

import React, { useState, useEffect } from 'react';
import { useShop } from '@/context/ShopContext';
import api from '@/utils/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CreateBookingModal from '@/components/Shop/CreateBookingModal';
import BookingsListView from '@/components/Shop/Bookings/BookingsListView';
import BookingsCalendarView from '@/components/Shop/Bookings/BookingsCalendarView';

const STATUS_FILTERS = [
  { label: 'All',       value: null },
  { label: 'Booked',    value: 'booked' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function ShopBookingsPage() {
  const { shop } = useShop();

  const [bookings, setBookings]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [createOpen, setCreateOpen]       = useState(false);
  const [viewMode, setViewMode]           = useState('calendar');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rezzy.bookings.viewMode');
      if (saved === 'list' || saved === 'calendar') setViewMode(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('rezzy.bookings.viewMode', viewMode); } catch {}
  }, [viewMode]);

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

  const hasDateFilter = dateFrom || dateTo;

  const toISO = (d) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const fromISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

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
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Bookings</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              Manage and track all your service appointments.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="inline-flex bg-[#080f17] border border-[#414755]/40 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'list' ? 'bg-[#4b8eff] text-white' : 'text-[#8b90a0] hover:text-white'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'calendar' ? 'bg-[#4b8eff] text-white' : 'text-[#8b90a0] hover:text-white'
                }`}
              >
                Calendar
              </button>
            </div>
            {/* Summary pills */}
            <span className="px-3 py-1.5 bg-[#151c25] border border-[#414755]/30 rounded-xl text-[11px] font-bold text-[#c1c6d7]">
              {counts.total} total
            </span>
            <span className="px-3 py-1.5 bg-[#4b8eff]/10 border border-[#4b8eff]/20 rounded-xl text-[11px] font-bold text-[#4b8eff]">
              {counts.booked} upcoming
            </span>
            <span className="px-3 py-1.5 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded-xl text-[11px] font-bold text-[#4edea3]">
              {counts.completed} done
            </span>
            {/* New booking */}
            <button
              onClick={() => setCreateOpen(true)}
              className="h-9 px-3 rounded-xl bg-[#4b8eff] hover:bg-[#4b8eff]/90 text-[11px] font-black text-white inline-flex items-center transition-all"
            >
              New booking
            </button>
          </div>
        </div>

        {/* Filter card */}
        <div className="bg-[#151c25] rounded-xl p-4 md:p-5 border border-[#414755]/20">

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">search</span>
              <input
                type="text"
                placeholder="Search by booking ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none transition-all"
              />
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none">filter_list</span>
              <select
                value={selectedStatus ?? ''}
                onChange={(e) => setSelectedStatus(e.target.value === '' ? null : e.target.value)}
                className="h-11 w-full md:w-52 bg-[#080f17] border border-[#414755]/40 rounded-xl pl-11 pr-10 text-sm font-semibold text-white focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none transition-all appearance-none cursor-pointer [color-scheme:dark]"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={String(f.value)} value={f.value ?? ''}>
                    {f.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] pointer-events-none">expand_more</span>
            </div>

            {/* Date range (list mode only — calendar nav replaces it) */}
            {viewMode === 'list' && (
              <div className="relative booking-range-picker w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[18px] pointer-events-none z-10">date_range</span>
                <DatePicker
                  selectsRange
                  startDate={fromISO(dateFrom)}
                  endDate={fromISO(dateTo)}
                  onChange={([start, end]) => {
                    setDateFrom(toISO(start));
                    setDateTo(toISO(end));
                  }}
                  isClearable
                  placeholderText="Select date range"
                  dateFormat="yyyy-MM-dd"
                  calendarClassName="booking-range-cal"
                  popperPlacement="bottom-start"
                  monthsShown={2}
                />
              </div>
            )}
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
            <div className="animate-spin w-10 h-10 border-4 border-[#414755] border-t-[#4b8eff] rounded-full" />
            <p className="text-[#8b90a0] text-sm font-semibold">Loading bookings...</p>
          </div>
        )}

        {/* Empty (list mode only — calendar shows empty grid by design) */}
        {!loading && viewMode === 'list' && filteredBookings.length === 0 && (
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

        {/* List view */}
        {!loading && viewMode === 'list' && filteredBookings.length > 0 && (
          <BookingsListView bookings={filteredBookings} totalCount={bookings.length} />
        )}

        {/* Calendar view */}
        {!loading && viewMode === 'calendar' && (
          <BookingsCalendarView
            bookings={filteredBookings}
            shopId={shop?.id}
            onCreated={fetchBookings}
            onUpdated={fetchBookings}
          />
        )}

      </div>

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        shopId={shop?.id}
        onCreated={() => fetchBookings()}
      />
    </div>
  );
}
