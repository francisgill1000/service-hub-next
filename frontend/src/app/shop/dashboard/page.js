"use client";

import React, { useEffect, useState } from 'react';
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

export default function ShopDashboard() {
   const router = useRouter();
   const { shop, loading } = useShop();
   const [totalBookings, setTotalBookings] = useState(null);
   const [totalRevenue, setTotalRevenue] = useState(null);
   const [bookings, setBookings] = useState([]);

   useEffect(() => {
      if (!loading && !shop) {
         router.push('/login');
      }
   }, [loading, shop, router]);

   useEffect(() => {
      if (loading || !shop?.id) return;

      let cancelled = false;

      const fetchTotals = async () => {
         try {
            const response = await api.get('/shop/bookings', {
               params: { shop_id: shop.id },
            });

            if (cancelled) return;

            const data = response.data || {};
            const list = Array.isArray(data.data) ? data.data : [];
            const calculatedRevenue = list.reduce((sum, booking) => sum + Number(booking?.charges || 0), 0);

            setBookings(list);
            setTotalBookings(data.total_bookings ?? list.length);
            setTotalRevenue(data.total_revenue ?? calculatedRevenue);
         } catch (err) {
            if (cancelled) return;
            console.error('Failed to fetch booking totals', err);
            setBookings([]);
            setTotalBookings(0);
            setTotalRevenue(0);
         }
      };

      fetchTotals();

      return () => {
         cancelled = true;
      };
   }, [loading, shop?.id]);

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
   const todayBookings  = bookings.filter(b => b.date === todayISO);
   const todayRevenue   = todayBookings.reduce((s, b) => s + Number(b.charges || 0), 0);
   const completedCount = bookings.filter(b => String(b.status).toLowerCase() === 'completed').length;
   const cancelledCount = bookings.filter(b => String(b.status).toLowerCase() === 'cancelled').length;
   const avgValue       = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;

   // 7-day chart
   const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
   });
   const chartData = last7Days.map(({ date, label }) => ({
      date, label,
      count:   bookings.filter(b => b.date === date).length,
      revenue: bookings.filter(b => b.date === date).reduce((s, b) => s + Number(b.charges || 0), 0),
   }));
   const chartMax = Math.max(...chartData.map(d => d.count), 1);

   // Today's schedule (sorted by start_time)
   const scheduleToday = [...todayBookings]
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

   // Recent activity (last 5, newest first)
   const recentActivity = [...bookings]
      .sort((a, b) => ((b.updated_at || b.created_at || b.date || '') > (a.updated_at || a.created_at || a.date || '') ? 1 : -1))
      .slice(0, 5);

   return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] md:bg-[#0d141d] text-slate-900 dark:text-white md:text-[#dce3f0] font-sans pb-28 md:pb-10">

         {/* ─── MOBILE layout — untouched ─── */}
         <div className="md:hidden">
            <main className="max-w-md mx-auto px-4">
               <div className="flex flex-wrap gap-3 py-4">
                  <StatCard label="Total Bookings" value={totalBookings !== null ? String(totalBookings) : '—'} trend="" Icon={CalendarCheck} />
                  <StatCard label="Total Revenue" value={totalRevenue !== null ? `AED ${Number(totalRevenue).toLocaleString()}` : '—'} trend="" Icon={CircleDollarSign} />
               </div>

               <div className="pt-2">
                  <button
                     type="button"
                     onClick={() => router.push('/shop/scan-login')}
                     className="w-full rounded-xl p-4 bg-white dark:bg-[#1c2331] border border-slate-100 dark:border-slate-800 text-left shadow-sm"
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
                                 <BookingCard name={customerName} service={servicesText} time={time} day={day} month={month} isPrimary={false} isScheduled={false} />
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
            <div className="w-full px-6 pt-8 pb-10 space-y-6">

               {/* ── Page heading ── */}
               <div className="flex items-end justify-between">
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0] mb-1">{todayStr}</p>
                     <h2 className="text-3xl font-black text-white tracking-tight leading-none">{shop?.name ?? 'Dashboard'}</h2>
                     <p className="text-[#8b90a0] font-semibold mt-2 text-sm">Real-time overview of your service operations.</p>
                  </div>
                  <span className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest ${shop?.is_open ? 'bg-[#4edea3]/10 border-[#4edea3]/20 text-[#4edea3]' : 'bg-[#414755]/20 border-[#414755]/30 text-[#8b90a0]'}`}>
                     <span className={`w-2 h-2 rounded-full ${shop?.is_open ? 'bg-[#4edea3] animate-pulse' : 'bg-[#8b90a0]'}`} />
                     {shop?.is_open ? 'Open Now' : 'Closed'}
                  </span>
               </div>

               {/* ── 6 KPI stat cards ── */}
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                     { label: 'Total Bookings', value: totalBookings ?? '—',                              icon: 'calendar_today', color: '#adc6ff', sub: 'All time' },
                     { label: 'Total Revenue',  value: `AED ${Number(totalRevenue||0).toLocaleString()}`, icon: 'payments',       color: '#4edea3', sub: 'Cumulative' },
                     { label: 'Today',          value: todayBookings.length,                              icon: 'today',          color: '#adc6ff', sub: `AED ${todayRevenue.toLocaleString()} today` },
                     { label: 'Upcoming',       value: upcomingBookings.length,                           icon: 'event_upcoming', color: '#ffb690', sub: 'Scheduled ahead' },
                     { label: 'Completed',      value: completedCount,                                    icon: 'task_alt',       color: '#4edea3', sub: 'Finished services' },
                     { label: 'Avg Value',      value: `AED ${avgValue.toFixed(0)}`,                      icon: 'trending_up',    color: '#c1c6d7', sub: 'Per booking' },
                  ].map((s) => (
                     <div key={s.label} className="bg-[#151c25] rounded-xl p-6 relative overflow-hidden group hover:bg-[#19202a] transition-colors border border-[#414755]/20">
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8b90a0]">{s.label}</p>
                        <p className="text-2xl font-black text-white mt-4 leading-none">{s.value}</p>
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
                     <div className="bg-[#151c25] rounded-xl p-5 border border-[#414755]/20">
                        <div className="flex items-center justify-between mb-5">
                           <div>
                              <h3 className="text-sm font-black text-white">Booking Trend</h3>
                              <p className="text-[10px] text-[#8b90a0] font-semibold mt-0.5">Last 7 days</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#8b90a0]">
                                 <span className="w-2 h-2 rounded-sm bg-[#2e353f]" />Other days
                              </span>
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#adc6ff]">
                                 <span className="w-2 h-2 rounded-sm bg-[#4b8eff]" />Today
                              </span>
                           </div>
                        </div>
                        <div className="flex items-end gap-2" style={{ height: '100px' }}>
                           {chartData.map((day, i) => {
                              const isToday = day.date === todayISO;
                              const barH = Math.max((day.count / chartMax) * 100, day.count > 0 ? 8 : 3);
                              return (
                                 <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
                                    <span className="text-[9px] font-black text-[#8b90a0] opacity-0 group-hover/bar:opacity-100 transition-opacity">{day.count}</span>
                                    <div className="w-full relative" style={{ height: `${barH}%` }}>
                                       <div className={`w-full h-full rounded-t-md transition-all ${isToday ? 'bg-gradient-to-t from-[#4b8eff] to-[#adc6ff]' : 'bg-[#2e353f] group-hover/bar:bg-[#414755]'}`} />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase ${isToday ? 'text-[#adc6ff]' : 'text-[#8b90a0]'}`}>{day.label}</span>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Upcoming bookings table */}
                     <div>
                        <div className="flex items-center justify-between mb-3">
                           <h3 className="text-sm font-black text-white">Upcoming Bookings</h3>
                           <button onClick={() => router.push('/shop/bookings')} className="text-[#adc6ff] text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="bg-[#19202a] rounded-xl overflow-hidden border border-[#414755]/20 shadow-xl shadow-black/20">
                           {upcomingBookings.length > 0 ? (
                              <>
                                 <table className="w-full text-left border-collapse">
                                    <thead>
                                       <tr className="bg-[#2e353f]/30 border-b border-[#414755]/20">
                                          <th className="px-5 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Customer</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Service</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">Date & Time</th>
                                          <th className="px-5 py-3 text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest text-right">Amount</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#414755]/10">
                                       {upcomingBookings.map((b) => {
                                          const customerName = b.customer?.name || b.customer_name || 'Guest';
                                          const initials = customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                                          const services  = b.services?.map(s => s.title || s.name).join(', ') || 'Service';
                                          const { day, month } = formatDayMonth(b.date);
                                          const time = b.start_time ? formatTime(b.start_time) : '—';
                                          return (
                                             <tr key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="hover:bg-[#2e353f]/20 transition-colors cursor-pointer group">
                                                <td className="px-5 py-3.5">
                                                   <div className="flex items-center gap-3">
                                                      <div className="w-8 h-8 rounded-xl bg-[#2e353f] flex items-center justify-center font-black text-xs text-[#adc6ff] shrink-0">{initials}</div>
                                                      <p className="text-sm font-bold text-white group-hover:text-[#adc6ff] transition-colors">{customerName}</p>
                                                   </div>
                                                </td>
                                                <td className="px-5 py-3.5"><p className="text-sm font-semibold text-[#c1c6d7] max-w-[150px] truncate">{services}</p></td>
                                                <td className="px-5 py-3.5">
                                                   <p className="text-sm font-semibold text-[#dce3f0]">{month} {day}</p>
                                                   <p className="text-[11px] text-[#8b90a0] font-medium mt-0.5">{time}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-right"><p className="text-sm font-black text-white">AED {b.charges || '0'}</p></td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                                 <div className="px-5 py-2.5 border-t border-[#414755]/20 bg-[#151c25]">
                                    <p className="text-[11px] font-semibold text-[#8b90a0]">{upcomingBookings.length} upcoming appointment{upcomingBookings.length !== 1 ? 's' : ''}</p>
                                 </div>
                              </>
                           ) : (
                              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                 <div className="w-12 h-12 rounded-2xl bg-[#151c25] border border-[#414755]/30 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl text-[#8b90a0]">event_available</span>
                                 </div>
                                 <p className="text-sm font-bold text-[#8b90a0]">No upcoming bookings</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Right col-span-1 */}
                  <div className="space-y-5">

                     {/* Today's schedule */}
                     <div className="bg-[#151c25] rounded-xl p-5 border border-[#414755]/20">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-black text-white">Today's Schedule</h3>
                           <span className="text-[10px] font-bold text-[#8b90a0] bg-[#19202a] px-2 py-1 rounded-lg">{scheduleToday.length} appts</span>
                        </div>
                        {scheduleToday.length > 0 ? (
                           <div className="space-y-0 max-h-48 overflow-y-auto no-scrollbar">
                              {scheduleToday.map((b, i) => {
                                 const name    = b.customer?.name || b.customer_name || 'Guest';
                                 const service = b.services?.[0]?.title || b.services?.[0]?.name || 'Service';
                                 const isLast  = i === scheduleToday.length - 1;
                                 const statusColor = String(b.status).toLowerCase() === 'completed' ? 'bg-[#4edea3]' : String(b.status).toLowerCase() === 'cancelled' ? 'bg-[#8b90a0]' : 'bg-[#adc6ff]';
                                 return (
                                    <div key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="flex gap-3 cursor-pointer group">
                                       <div className="flex flex-col items-center pt-1">
                                          <div className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                                          {!isLast && <div className="w-px flex-1 bg-[#414755]/30 my-1 min-h-[16px]" />}
                                       </div>
                                       <div className={`${!isLast ? 'pb-4' : ''} flex-1 min-w-0`}>
                                          <div className="flex items-center justify-between gap-2">
                                             <p className="text-xs font-black text-white group-hover:text-[#adc6ff] transition-colors truncate">{name}</p>
                                             <span className="text-[10px] font-bold text-[#adc6ff] shrink-0">{b.start_time || '—'}</span>
                                          </div>
                                          <p className="text-[11px] text-[#8b90a0] font-medium truncate mt-0.5">{service}</p>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-[#8b90a0] font-semibold text-center py-4">No appointments today</p>
                        )}
                     </div>

                     {/* Recent activity feed */}
                     <div className="bg-[#151c25] rounded-xl p-5 border border-[#414755]/20">
                        <h3 className="text-sm font-black text-white mb-4">Recent Activity</h3>
                        {recentActivity.length > 0 ? (
                           <div className="space-y-3">
                              {recentActivity.map((b) => {
                                 const name   = b.customer?.name || b.customer_name || 'Guest';
                                 const status = String(b.status || 'Booked');
                                 const iconMap = { Completed: { icon: 'task_alt', color: 'text-[#4edea3] bg-[#4edea3]/10' }, Cancelled: { icon: 'cancel', color: 'text-[#8b90a0] bg-[#414755]/30' }, Booked: { icon: 'event_available', color: 'text-[#adc6ff] bg-[#adc6ff]/10' } };
                                 const ic = iconMap[status] || iconMap.Booked;
                                 return (
                                    <div key={b.id} onClick={() => router.push(`/shop/bookings/action?id=${b.id}`)} className="flex items-center gap-3 cursor-pointer group">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${ic.color}`}>
                                          <span className="material-symbols-outlined text-[16px]">{ic.icon}</span>
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-white group-hover:text-[#adc6ff] transition-colors truncate">{name}</p>
                                          <p className="text-[10px] text-[#8b90a0] font-medium">{status} · {b.show_date || b.date || '—'}</p>
                                       </div>
                                       <p className="text-xs font-black text-[#c1c6d7] shrink-0">AED {b.charges || '0'}</p>
                                    </div>
                                 );
                              })}
                           </div>
                        ) : (
                           <p className="text-sm text-[#8b90a0] font-semibold text-center py-4">No recent activity</p>
                        )}
                     </div>

                     {/* Quick actions */}
                     <div className="bg-[#151c25] rounded-xl p-1.5 flex flex-col gap-0.5 border border-[#414755]/20">
                        {[
                           { label: 'All Bookings',    sub: 'View & manage',       icon: 'event_note',  path: '/shop/bookings',      color: 'text-[#adc6ff] bg-[#adc6ff]/10 group-hover:bg-[#adc6ff] group-hover:text-[#002e69]' },
                           { label: 'Service Catalog', sub: 'Add or edit',         icon: 'category',    path: '/shop/catalogs',      color: 'text-[#4edea3] bg-[#4edea3]/10 group-hover:bg-[#4edea3] group-hover:text-[#003824]' },
                           { label: 'Working Hours',   sub: 'Set open & close',    icon: 'schedule',    path: '/shop/working_hours', color: 'text-[#ffb690] bg-[#ffb690]/10 group-hover:bg-[#ffb690] group-hover:text-[#341100]' },
                           { label: 'Business Profile', sub: 'Edit info & images',  icon: 'storefront',  path: '/shop/profile',       color: 'text-[#c1c6d7] bg-[#414755]/30 group-hover:bg-[#414755] group-hover:text-white' },
                        ].map((item) => (
                           <button key={item.path} onClick={() => router.push(item.path)} className="flex items-center gap-3 p-3 hover:bg-[#19202a] rounded-xl transition-all group text-left">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                                 <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-white">{item.label}</p>
                                 <p className="text-[10px] text-[#8b90a0] font-medium">{item.sub}</p>
                              </div>
                           </button>
                        ))}
                     </div>

                  </div>
               </div>
            </div>
         </div>

      </div>
   );
}

// --- Sub-components for cleanliness ---

function StatCard({ label, value, trend, Icon }) {
   return (
      <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 bg-white dark:bg-[#1c2331] shadow-sm border border-slate-100 dark:border-slate-800">
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

function BookingCard({ name, service, time, day, month, isPrimary, isScheduled }) {
   return (
      <div className={`group flex items-center gap-4 rounded-xl p-4 bg-white dark:bg-[#1c2331] border border-slate-100 dark:border-slate-800 transition-all active:scale-[0.98] ${isScheduled ? 'opacity-80' : ''}`}>
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
            <div className="flex items-center gap-1 mt-2 text-slate-400">
               <Clock size={12} />
               <span className="text-[11px] font-medium">{time}</span>
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
