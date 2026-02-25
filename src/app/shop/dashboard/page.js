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
   CalendarCheck
} from 'lucide-react';

import api from '@/utils/api';
import { useShop } from '@/context/ShopContext';
import Notifications from '@/components/Notifications';

export default function ShopDashboard() {
   const router = useRouter();
   const { shop, token } = useShop();
   const [totalBookings, setTotalBookings] = useState(null);
   const [totalRevenue, setTotalRevenue] = useState(null);
   const [bookings, setBookings] = useState([]);

   useEffect(() => {
      const fetchTotals = async () => {

         if(!shop?.id) return;
         
         try {
            const response = await api.get('/shop/bookings?shop_id=' + (shop?.id || 0));
            const data = response.data || {};
            const list = data.data || [];
            setBookings(list);
            setTotalBookings(data.total_bookings ?? list.length);
            setTotalRevenue(data.total_revenue ?? list.reduce((s, b) => s + (b.charges || 0), 0));
         } catch (err) {
            console.error('Failed to fetch booking totals', err);
         }
      };

      fetchTotals();
   }, []);

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

   return (
      <div className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] text-slate-900 dark:text-white font-sans pb-28">

         <main className="max-w-md mx-auto px-4">

            {/* --- Stats Section --- */}
            <div className="flex flex-wrap gap-3 py-4">
               <StatCard label="Total Bookings" value={totalBookings !== null ? String(totalBookings) : '—'} trend="" Icon={CalendarCheck} />
               <StatCard label="Total Revenue" value={totalRevenue !== null ? `AED ${Number(totalRevenue).toLocaleString()}` : '—'} trend="" Icon={CircleDollarSign} />
            </div>

            {/* --- Upcoming Bookings --- */}
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
                           <div key={b.id} onClick={() => router.push(`/booking/view?id=${b.id}`)}>
                              <BookingCard
                                 name={customerName}
                                 service={servicesText}
                                 time={time}
                                 day={day}
                                 month={month}
                                 isPrimary={false}
                                 isScheduled={false}
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
