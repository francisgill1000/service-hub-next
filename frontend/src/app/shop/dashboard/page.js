"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
   TrendingUp,
   PlusCircle,
   Calendar,
   ChevronRight,
   Clock,
   LayoutDashboard,
   Construction,
   BarChart3,
   Settings,
   CircleDollarSign,
   CalendarCheck,
   QrCode
} from 'lucide-react';

import api from '@/utils/api';
import { useShop } from '@/context/ShopContext';
import CreateBookingModal from '@/components/Shop/CreateBookingModal';
import FindBookingModal from '@/components/Shop/FindBookingModal';

export default function ShopDashboard() {
   const router = useRouter();
   const { shop, loading } = useShop();
   const [totalBookings, setTotalBookings] = useState(null);
   const [totalRevenue, setTotalRevenue] = useState(null);
   const [cancelledCount, setCancelledCount] = useState(null);
   const [bookings, setBookings] = useState([]);
   const [createOpen, setCreateOpen] = useState(false);
   const [findOpen, setFindOpen] = useState(false);

   useEffect(() => {
      if (!loading && !shop) {
         router.push('/login');
      }
   }, [loading, shop, router]);

   const fetchTotals = useCallback(async () => {
      if (!shop?.id) return;
      try {
         const response = await api.get('/shop/bookings', {
            params: { shop_id: shop.id },
         });
         const data = response.data || {};
         const list = Array.isArray(data.data) ? data.data : [];
         const isCancelled = (b) => String(b?.status).toLowerCase() === 'cancelled';
         const calculatedRevenue = list.reduce(
            (sum, booking) => sum + (isCancelled(booking) ? 0 : Number(booking?.charges || 0)),
            0,
         );
         const calculatedCancelled = list.filter(isCancelled).length;

         setBookings(list);
         setTotalBookings(data.total_bookings ?? list.length);
         setTotalRevenue(data.total_revenue ?? calculatedRevenue);
         setCancelledCount(data.cancelled_count ?? calculatedCancelled);
      } catch (err) {
         console.error('Failed to fetch booking totals', err);
         setBookings([]);
         setTotalBookings(0);
         setTotalRevenue(0);
         setCancelledCount(0);
      }
   }, [shop?.id]);

   useEffect(() => {
      if (loading || !shop?.id) return;
      fetchTotals();
   }, [loading, shop?.id, fetchTotals]);

   const formatDayMonth = (dateStr) => {
      if (!dateStr) return { day: '--', month: '---' };
      const d = new Date(`${dateStr}T00:00:00`);
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return { day, month };
   };

   const formatTime = (timeStr) => {
      if (!timeStr) return '';
      // Accept formats like HH:mm or HH:mm:ss
      try {
         const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
         const d = new Date(`1970-01-01T${t}`);
         return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } catch (e) {
         return timeStr;
      }
   };

   const upcomingBookings = bookings
      .filter(b => {
         const today = new Date().toISOString().slice(0, 10);
         return (b.date >= today) && (String(b.status).toLowerCase() !== 'cancelled');
      })
      .sort((a, b) => {
         if (a.date === b.date) return (a.start_time || '').localeCompare(b.start_time || '');
         return a.date.localeCompare(b.date);
      })
      .slice(0, 3);

   const todayStr  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
   const todayISO  = new Date().toISOString().slice(0, 10);
   const tomorrowISO = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();
   const isCancelled    = (b) => String(b?.status).toLowerCase() === 'cancelled';
   const dateOf = (b) => String(b?.date || b?.booking_date || '').slice(0, 10);
   const todayBookings  = bookings.filter(b => dateOf(b) === todayISO);
   const tomorrowBookings = bookings
      .filter(b => {
         const s = String(b.status).toLowerCase();
         return dateOf(b) === tomorrowISO && (s === 'booked' || s === 'queued');
      })
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
   const tomorrowPending = tomorrowBookings.filter(b => !b.reminder_sent_at && b.customer_whatsapp).length;
   const todayRevenue   = todayBookings.reduce((s, b) => s + (isCancelled(b) ? 0 : Number(b.charges || 0)), 0);
   const completedCount = bookings.filter(b => String(b.status).toLowerCase() === 'completed').length;
   const revenueBookings = (totalBookings ?? 0) - (cancelledCount ?? 0);
   const avgValue       = revenueBookings > 0 ? (totalRevenue / revenueBookings) : 0;

   // 7-day chart
   const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
   });
   const chartData = last7Days.map(({ date, label }) => {
      const dayBookings = bookings.filter(b => b.date === date);
      return {
         date, label,
         count:   dayBookings.filter(b => !isCancelled(b)).length,
         revenue: dayBookings.reduce((s, b) => s + (isCancelled(b) ? 0 : Number(b.charges || 0)), 0),
      };
   });
   const chartMax = Math.max(...chartData.map(d => d.count), 1);

   // Today's schedule (sorted by start_time)
   const scheduleToday = [...todayBookings]
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

   // Recent activity (last 5, newest first)
   const recentActivity = [...bookings]
      .sort((a, b) => ((b.updated_at || b.created_at || b.date || '') > (a.updated_at || a.created_at || a.date || '') ? 1 : -1))
      .slice(0, 5);

   return (
      <div className="min-h-screen bg-brand-bg text-brand-text font-sans pb-28 md:pb-10">

         {/* ─── MOBILE layout — untouched ─── */}
         <div className="md:hidden">
            <main className="max-w-md mx-auto px-4">
               <div className="flex flex-wrap gap-3 py-4">
                  <StatCard label="Total Bookings" value={totalBookings !== null ? String(totalBookings) : '—'} trend="" Icon={CalendarCheck} />
                  <StatCard label="Total Revenue" value={totalRevenue !== null ? `AED ${Number(totalRevenue).toLocaleString()}` : '—'} trend="" Icon={CircleDollarSign} />
                  <StatCard label="Cancelled" value={cancelledCount !== null ? String(cancelledCount) : '—'} trend="" Icon={Calendar} />
               </div>

               {/* Booking CTAs — mobile */}
               <div className="grid grid-cols-2 gap-2">
                  <button
                     type="button"
                     onClick={() => setCreateOpen(true)}
                     className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-primary hover:bg-brand-primary/90 active:scale-[0.98] text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-primary/20"
                  >
                     <span className="material-symbols-outlined text-[18px]">add_circle</span>
                     Create
                  </button>
                  <button
                     type="button"
                     onClick={() => setFindOpen(true)}
                     className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-elevated hover:bg-brand-hover active:scale-[0.98] border border-brand-border/40 text-brand-text text-[11px] font-black uppercase tracking-widest transition-all"
                  >
                     <span className="material-symbols-outlined text-[18px]">search</span>
                     Find Booking
                  </button>
               </div>

               <div className="pt-2">
                  <button
                     type="button"
                     onClick={() => router.push('/shop/scan-login')}
                     className="w-full rounded-xl p-4 bg-white dark:bg-brand-surface border border-slate-100 dark:border-slate-800 text-left shadow-sm"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center">
                              <QrCode size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-bold">Scan QR Login</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Approve desktop login from mobile app</p>
                           </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-400" />
                     </div>
                  </button>
               </div>

               {/* Tomorrow's Reminders card (mobile) */}
               <div
                  onClick={() => router.push('/shop/reminders')}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-br from-brand-warning/15 to-brand-warning/5 border border-brand-warning/30 cursor-pointer active:scale-[0.98] transition-all"
               >
                  <div className="flex items-start justify-between">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-warning">Tomorrow's reminders</p>
                        <p className="text-xl font-black text-brand-text mt-1">
                           {tomorrowBookings.length} {tomorrowBookings.length === 1 ? 'booking' : 'bookings'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                           {tomorrowPending > 0
                              ? `${tomorrowPending} still need a reminder`
                              : tomorrowBookings.length > 0
                                 ? 'All reminded · tap to manage'
                                 : 'Nothing tomorrow — enjoy the day off'}
                        </p>
                     </div>
                     <span className="material-symbols-outlined text-brand-warning">notifications_active</span>
                  </div>
               </div>

               <div className="pt-6">
                  <div className="flex items-center justify-between pb-4">
                     <h3 className="text-base font-bold">Upcoming Bookings</h3>
                     <button onClick={() => router.push('/shop/bookings')} className="text-blue-600 text-xs font-bold uppercase tracking-wider">See All</button>
                  </div>
                  <div className="flex flex-col gap-3">
                     {upcomingBookings.length > 0 ? (
                        upcomingBookings.map((b) => {
                           const customerName = b.customer?.name || b.customer_name || 'Guest';
                           const servicesText = b.services && b.services.length ? b.services.map(s => s.title || s.name).join(', ') : 'Service';
                           const { day, month } = formatDayMonth(b.date);
                           const time = b.start_time ? formatTime(b.start_time) + (b.end_time ? ` - ${formatTime(b.end_time)}` : '') : (b.show_date || 'TBD');
                           return (
                              <div key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)}>
                                 <BookingCard
                                    name={customerName}
                                    service={servicesText}
                                    time={time}
                                    day={day}
                                    month={month}
                                    isPrimary={false}
                                    isScheduled={false}
                                    staffName={b.staff?.name}
                                    isQueued={String(b.status).toLowerCase() === 'queued'}
                                 />
                              </div>
                           );
                        })
                     ) : (
                        <div className="text-sm text-slate-500">No upcoming bookings</div>
                     )}
                  </div>
               </div>
            </main>
         </div>

         {/* ─── DESKTOP / TABLET layout ─── */}
         <div className="hidden md:block">
            <div className="w-full px-4 md:px-6 pt-6 md:pt-8 pb-10 space-y-6">

               {/* ── Page heading ── */}
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">{todayStr}</p>
                     <h2 className="text-3xl font-black text-brand-text tracking-tight leading-none">{shop?.name ?? 'Dashboard'}</h2>
                     <p className="text-brand-muted font-semibold mt-2 text-sm">Real-time overview of your service operations.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                     <button
                        type="button"
                        onClick={() => setFindOpen(true)}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-elevated hover:bg-brand-hover border border-brand-border/40 text-brand-text text-[11px] font-black uppercase tracking-widest transition-all"
                     >
                        <span className="material-symbols-outlined text-[18px]">search</span>
                        Find Booking
                     </button>
                     <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-md shadow-brand-primary/20"
                     >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Booking
                     </button>
                     <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${shop?.is_open ? 'bg-brand-success/10 border-brand-success/20 text-brand-success' : 'bg-brand-border/20 border-brand-border/30 text-brand-muted'}`}>
                        <span className={`w-2 h-2 rounded-full ${shop?.is_open ? 'bg-brand-success animate-pulse' : 'bg-brand-muted'}`} />
                        {shop?.is_open ? 'Open Now' : 'Closed'}
                     </span>
                  </div>
               </div>

               {/* ── 6 KPI stat cards ── */}
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                     { label: 'Total Bookings', value: totalBookings ?? '—',                              icon: 'calendar_today', color: '#4b8eff', sub: 'All time' },
                     { label: 'Total Revenue',  value: `AED ${Number(totalRevenue||0).toLocaleString()}`, icon: 'payments',       color: '#4edea3', sub: 'Cumulative' },
                     { label: 'Today',          value: todayBookings.length,                              icon: 'today',          color: '#4b8eff', sub: `AED ${todayRevenue.toLocaleString()} today` },
                     { label: 'Upcoming',       value: upcomingBookings.length,                           icon: 'event_upcoming', color: '#ffb690', sub: 'Scheduled ahead' },
                     { label: 'Completed',      value: completedCount,                                    icon: 'task_alt',       color: '#4edea3', sub: 'Finished services' },
                     { label: 'Cancelled',      value: cancelledCount ?? '—',                             icon: 'cancel',         color: '#f87171', sub: 'All time' },
                  ].map((s) => (
                     <div key={s.label} className="bg-brand-surface rounded-xl p-6 relative overflow-hidden group hover:bg-brand-elevated transition-colors border border-brand-border/20">
                        {/* Watermark icon — bypass global .material-symbols-outlined sizing */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.07] group-hover:opacity-[0.14] transition-opacity pointer-events-none select-none">
                           <span style={{
                              fontFamily: "'Material Symbols Outlined'",
                              fontSize: '100px',
                              lineHeight: '1',
                              display: 'block',
                              width: '100px',
                              height: '100px',
                              overflow: 'visible',
                              color: s.color,
                              fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
                           }}>
                              {s.icon}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">{s.label}</p>
                        <p className="text-2xl font-black text-brand-text mt-4 leading-none">{s.value}</p>
                        <div className="mt-3 flex items-center gap-1.5">
                           <TrendingUp size={11} strokeWidth={3} style={{ color: s.color }} />
                           <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.sub}</p>
                        </div>
                     </div>
                  ))}
               </div>

               {/* ── Main 3-col grid ── */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Left col-span-2 */}
                  <div className="lg:col-span-2 space-y-5">

                     {/* 7-day bar chart */}
                     <div className="bg-brand-surface rounded-xl p-5 border border-brand-border/20">
                        <div className="flex items-center justify-between mb-5">
                           <div>
                              <h3 className="text-sm font-black text-brand-text">Booking Trend</h3>
                              <p className="text-[10px] text-brand-muted font-semibold mt-0.5">Last 7 days</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-muted">
                                 <span className="w-2 h-2 rounded-sm bg-brand-hover" />Other days
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary">
                                 <span className="w-2 h-2 rounded-sm bg-brand-primary" />Today
                              </span>
                           </div>
                        </div>
                        <div className="flex items-end gap-2" style={{ height: '100px' }}>
                           {chartData.map((day, i) => {
                              const isToday = day.date === todayISO;
                              const barH = Math.max((day.count / chartMax) * 100, day.count > 0 ? 8 : 3);
                              return (
                                 <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
                                    <span className="text-[9px] font-black text-brand-muted opacity-0 group-hover/bar:opacity-100 transition-opacity">{day.count}</span>
                                    <div className="w-full relative" style={{ height: `${barH}%` }}>
                                       <div className={`w-full h-full rounded-t-md transition-all ${isToday ? 'bg-gradient-to-t from-brand-primary to-brand-primary' : 'bg-brand-hover group-hover/bar:bg-brand-border'}`} />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase ${isToday ? 'text-brand-primary' : 'text-brand-muted'}`}>{day.label}</span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Tomorrow's Reminders card (desktop) */}
                     <div
                        onClick={() => router.push('/shop/reminders')}
                        className="cursor-pointer rounded-xl bg-gradient-to-br from-brand-warning/10 to-brand-warning/5 border border-brand-warning/30 p-5 hover:border-brand-warning/50 transition-all"
                     >
                        <div className="flex items-start justify-between gap-4">
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-brand-warning">Tomorrow's Reminders</p>
                              <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                                 <span className="text-2xl font-black text-brand-text">{tomorrowBookings.length}</span>
                                 <span className="text-[11px] font-semibold text-brand-muted">
                                    {tomorrowBookings.length === 1 ? 'booking' : 'bookings'}
                                 </span>
                                 {tomorrowPending > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-brand-warning/20 text-brand-warning text-[10px] font-black uppercase tracking-wider">
                                       {tomorrowPending} to send
                                    </span>
                                 )}
                                 {tomorrowBookings.length > 0 && tomorrowPending === 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-brand-success/20 text-brand-success text-[10px] font-black uppercase tracking-wider">
                                       all reminded
                                    </span>
                                 )}
                              </div>

                              {tomorrowBookings.length > 0 && (
                                 <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                                    {tomorrowBookings.slice(0, 3).map((b) => {
                                       const time = b.start_time ? String(b.start_time).slice(0, 5) : '—';
                                       const name = b.customer_name || b.customer?.name || 'Guest';
                                       return (
                                          <span key={b.id} className="text-[11px] text-brand-text font-semibold">
                                             {time} · <span className="text-brand-muted">{name}</span>
                                          </span>
                                       );
                                    })}
                                    {tomorrowBookings.length > 3 && (
                                       <span className="text-[11px] text-brand-muted font-semibold">+{tomorrowBookings.length - 3} more</span>
                                    )}
                                 </div>
                              )}

                              {tomorrowBookings.length === 0 && (
                                 <p className="text-[11px] text-brand-muted font-semibold mt-2">Nothing scheduled — enjoy the day off.</p>
                              )}
                           </div>
                           <div className="shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-brand-warning/15 flex items-center justify-center">
                                 <span className="material-symbols-outlined text-[24px] text-brand-warning">notifications_active</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Upcoming bookings table */}
                     <div>
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-black text-brand-text">Upcoming Bookings</h3>
                           <button onClick={() => router.push('/shop/bookings')} className="text-brand-primary text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="bg-brand-elevated rounded-xl overflow-x-auto border border-brand-border/20 shadow-xl shadow-black/20">
                           {upcomingBookings.length > 0 ? (
                              <>
                                 <table className="w-full text-left border-collapse min-w-[640px]">
                                    <thead>
                                       <tr className="bg-brand-hover/30 border-b border-brand-border/20">
                                          <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Customer</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Service</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Staff</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Date & Time</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right">Amount</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border/10">
                                       {upcomingBookings.map((b) => {
                                          const customerName = b.customer?.name || b.customer_name || 'Guest';
                                          const initials = customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                                          const services  = b.services?.map(s => s.title || s.name).join(', ') || 'Service';
                                          const { day, month } = formatDayMonth(b.date);
                                          const time = b.start_time ? formatTime(b.start_time) : '—';
                                          return (
                                             <tr key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="hover:bg-brand-hover/20 transition-colors cursor-pointer group">
                                                <td className="px-5 py-3.5">
                                                   <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-xl bg-brand-hover flex items-center justify-center font-black text-xs text-brand-primary shrink-0">{initials}</div>
                                                      <p className="text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors">{customerName}</p>
                                                   </div>
                                                </td>
                                                <td className="px-5 py-3.5"><p className="text-sm font-semibold text-brand-text max-w-[150px] truncate">{services}</p></td>
                                                <td className="px-5 py-3.5">
                                                   {b.staff?.name ? (
                                                      <div className="inline-flex items-center gap-2">
                                                         <div className="w-7 h-7 rounded-full bg-brand-hover flex items-center justify-center font-bold text-[11px] text-brand-primary">
                                                            {b.staff.name.charAt(0).toUpperCase()}
                                                         </div>
                                                         <p className="text-sm font-semibold text-brand-text">{b.staff.name}</p>
                                                      </div>
                                                   ) : String(b.status).toLowerCase() === 'queued' ? (
                                                      <span className="px-2 py-1 rounded-lg bg-brand-warning/15 text-brand-warning border border-brand-warning/20 font-black text-[10px] uppercase tracking-wider">
                                                         Waiting
                                                      </span>
                                                   ) : (
                                                      <span className="text-brand-muted text-sm font-semibold">—</span>
                                                   )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                   <p className="text-sm font-semibold text-brand-text">{month} {day}</p>
                                                   <p className="text-[11px] text-brand-muted font-medium mt-0.5">{time}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-right"><p className="text-sm font-black text-brand-text">AED {b.charges || '0'}</p></td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                                 <div className="px-5 py-2.5 border-t border-brand-border/20 bg-brand-surface">
                                    <p className="text-[11px] font-semibold text-brand-muted">{upcomingBookings.length} upcoming appointment{upcomingBookings.length !== 1 ? 's' : ''}</p>
                                 </div>
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                 <div className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-brand-muted">event_available</span>
                                 </div>
                                 <p className="text-sm font-bold text-brand-muted">No upcoming bookings</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Right col-span-1 */}
                  <div className="space-y-5">

                     {/* Today's schedule */}
                     <div className="bg-brand-surface rounded-xl p-5 border border-brand-border/20">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-black text-brand-text">Today's Schedule</h3>
                           <span className="text-[10px] font-bold text-brand-muted bg-brand-elevated px-2 py-1 rounded-lg">{scheduleToday.length} appts</span>
                        </div>
                        {scheduleToday.length > 0 ? (
                           <div className="space-y-0 max-h-48 overflow-y-auto no-scrollbar">
                              {scheduleToday.map((b, i) => {
                                 const name    = b.customer?.name || b.customer_name || 'Guest';
                                 const service = b.services?.[0]?.title || b.services?.[0]?.name || 'Service';
                                 const isLast  = i === scheduleToday.length - 1;
                                 const statusColor = String(b.status).toLowerCase() === 'completed' ? 'bg-brand-success' : String(b.status).toLowerCase() === 'cancelled' ? 'bg-brand-muted' : 'bg-brand-primary';
                                 return (
                                    <div key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="flex gap-3 cursor-pointer group">
                                       <div className="flex flex-col items-center pt-1">
                                          <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                                          {!isLast && <div className="w-px flex-1 bg-brand-border/30 my-1 min-h-[16px]" />}
                                       </div>
                                       <div className={`${!isLast ? 'pb-4' : ''} flex-1 min-w-0`}>
                                          <div className="flex items-center justify-between gap-2">
                                             <p className="text-xs font-black text-brand-text group-hover:text-brand-primary transition-colors truncate">{name}</p>
                                             <span className="text-[10px] font-bold text-brand-primary shrink-0">{b.start_time || '—'}</span>
                                          </div>
                                          <p className="text-[11px] text-brand-muted font-medium truncate mt-0.5">{service}</p>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-brand-muted font-semibold text-center py-4">No appointments today</p>
                        )}
                     </div>

                     {/* Recent activity feed */}
                     <div className="bg-brand-surface rounded-xl p-5 border border-brand-border/20">
                        <h3 className="text-sm font-black text-brand-text mb-4">Recent Activity</h3>
                        {recentActivity.length > 0 ? (
                           <div className="space-y-3">
                              {recentActivity.map((b) => {
                                 const name   = b.customer?.name || b.customer_name || 'Guest';
                                 const status = String(b.status || 'Booked');
                                 const iconMap = { Completed: { icon: 'task_alt', color: 'text-brand-success bg-brand-success/10' }, Cancelled: { icon: 'cancel', color: 'text-brand-muted bg-brand-border/30' }, Booked: { icon: 'event_available', color: 'text-brand-primary bg-brand-primary/10' } };
                                 const ic = iconMap[status] || iconMap.Booked;
                                 return (
                                    <div key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="flex items-center gap-3 cursor-pointer group">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ic.color}`}>
                                          <span className="material-symbols-outlined text-[16px]">{ic.icon}</span>
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors truncate">{name}</p>
                                          <p className="text-[10px] text-brand-muted font-medium">{status} · {b.show_date || b.date || '—'}</p>
                                       </div>
                                       <p className="text-xs font-black text-brand-text shrink-0">AED {b.charges || '0'}</p>
                                    </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-brand-muted font-semibold text-center py-4">No recent activity</p>
                        )}
                     </div>

                     {/* Quick actions */}
                     <div className="bg-brand-surface rounded-xl p-1.5 flex flex-col gap-0.5 border border-brand-border/20">
                        {[
                           { label: 'All Bookings',    sub: 'View & manage',       icon: 'event_note',  path: '/shop/bookings',      color: 'text-brand-primary bg-brand-primary/10 group-hover:bg-brand-primary group-hover:text-white' },
                           { label: 'Service Catalog', sub: 'Add or edit',         icon: 'category',    path: '/shop/catalogs',      color: 'text-brand-success bg-brand-success/10 group-hover:bg-brand-success group-hover:text-white' },
                           { label: 'Working Hours',   sub: 'Set open & close',    icon: 'schedule',    path: '/shop/working_hours', color: 'text-brand-warning bg-brand-warning/10 group-hover:bg-brand-warning group-hover:text-white' },
                           { label: 'Business Profile', sub: 'Edit info & images',  icon: 'storefront',  path: '/shop/profile',       color: 'text-brand-text bg-brand-border/30 group-hover:bg-brand-border group-hover:text-white' },
                        ].map((item) => (
                           <button key={item.path} onClick={() => router.push(item.path)} className="flex items-center gap-3 p-3 hover:bg-brand-elevated rounded-xl transition-all group text-left">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                                 <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-brand-text">{item.label}</p>
                                 <p className="text-[10px] text-brand-muted font-medium">{item.sub}</p>
                              </div>
                           </button>
                        ))}
                     </div>

                  </div>
               </div>
            </div>
         </div>

         {/* Create-booking modal — opened from the desktop or mobile CTA */}
         <CreateBookingModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            shopId={shop?.id}
            onCreated={() => {
               setCreateOpen(false);
               fetchTotals();
            }}
         />

         {/* Find-booking modal — counter check-in lookup */}
         <FindBookingModal
            open={findOpen}
            onClose={() => setFindOpen(false)}
            bookings={bookings}
            onUpdated={fetchTotals}
         />
      </div>
   );
}

// --- Sub-components for cleanliness ---

function StatCard({ label, value, trend, Icon }) {
   return (
      <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white dark:bg-brand-surface shadow-sm border border-slate-100 dark:border-slate-800">
         <div className="flex items-center justify-between">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
            <Icon size={18} className="text-blue-600" />
         </div>
         <p className="text-3xl font-extrabold leading-tight">{value}</p>
         <div className="flex items-center gap-1 text-emerald-500">
            <TrendingUp size={14} strokeWidth={3} />
            <p className="text-xs font-bold uppercase">{trend}</p>
         </div>
      </div>
   );
}

function BookingCard({ name, service, time, day, month, isPrimary, isScheduled, staffName, isQueued }) {
   return (
      <div className={`group flex items-center gap-4 rounded-xl p-4 bg-white dark:bg-brand-surface border border-slate-100 dark:border-slate-800 transition-all active:scale-[0.98] ${isScheduled ? 'opacity-80' : ''}`}>
         <div className={`flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-lg ${isPrimary ? 'bg-blue-600/10 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <p className="text-[10px] font-bold uppercase">{month}</p>
            <p className="text-lg font-extrabold">{day}</p>
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
               <h4 className="text-sm font-bold truncate">{name}</h4>
               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isScheduled ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-blue-600/20 text-blue-600'}`}>
                  {isScheduled ? 'Scheduled' : 'Upcoming'}
               </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium truncate mt-0.5">{service}</p>
            <div className="flex items-center gap-3 mt-2 text-slate-400 flex-wrap">
               <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  <span className="text-[11px] font-medium">{time}</span>
               </span>
               {staffName ? (
                  <span className="inline-flex items-center gap-1 text-blue-500">
                     <span className="material-symbols-outlined text-[12px]">person</span>
                     <span className="text-[11px] font-bold truncate max-w-[80px]">{staffName}</span>
                  </span>
               ) : isQueued ? (
                  <span className="px-1.5 py-0.5 rounded bg-brand-warning/20 text-brand-warning font-black text-[9px] uppercase tracking-wider">
                     Waiting
                  </span>
               ) : null}
            </div>
         </div>
         <ChevronRight className="text-slate-400" size={18} />
      </div>
   );
}

function NavButton({ icon, label, active, onClick }) {
   return (
      <button
         type="button"
         onClick={onClick}
         className={`flex flex-col items-center gap-1 ${active ? 'text-blue-600' : 'text-slate-400'}`}
      >
         {icon}
         <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </button>
   );
}
