"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import api from '@/utils/api';

const BOOKING_STATUS_COLORS = {
  "Booked": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Cancelled": "bg-gray-500/10 text-gray-500 border-gray-500/20",
  "Completed": "bg-green-500/10 text-green-500 border-green-500/20"
};

const BOOKING_STATUS_DOTS = {
  "Booked": "bg-blue-500",
  "Cancelled": "bg-gray-500",
  "Completed": "bg-green-500"
};

const STATUS_FILTERS = [
  { label: 'All', value: null },
  { label: 'Booked', value: 'booked' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
];

export default function ShopBookingsPage() {
  const router = useRouter();
  const { shop, token } = useShop();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let config = {
        params: {
          shop_id: shop?.id,
          status: selectedStatus
        },
      };
      const response = await api.get("/shop/all-bookings", config);
      setBookings(response.data.data || response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBookings = () => {
    return bookings.filter(({ booking_reference }) => {
      return searchTerm === "" || booking_reference?.toString().includes(searchTerm);
    });
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-[#0B121E] text-white pb-28">
      <main className="max-w-[480px] mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Bookings</h1>
          <p className="text-gray-400 text-sm">Manage your service bookings</p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              search
            </span>
            <input
              type="text"
              placeholder="Search by booking ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-[#151F2D] border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedStatus === filter.value
                ? 'bg-blue-500 text-white'
                : 'bg-[#151F2D] text-gray-400 border border-white/10'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => router.push(`/booking/view?id=${booking.id}`)}
                className="group bg-[#151F2D] rounded-2xl p-5 border border-white/10 hover:border-white/20 cursor-pointer transition-all active:scale-[0.98]"
              >
                {/* Top Row - ID and Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {booking.booking_reference}
                  </span>
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${BOOKING_STATUS_COLORS[booking.status] || BOOKING_STATUS_COLORS['Booked']}`}>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${BOOKING_STATUS_DOTS[booking.status] || BOOKING_STATUS_DOTS['Booked']}`}></div>
                      {booking.status}
                    </div>
                  </div>
                </div>

                {/* Service and Date Info */}
                <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
                  {booking.services && booking.services.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                        inventory_2
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Services</p>
                        <p className="text-sm text-white">
                          {booking.services.map(s => s.title || s.name).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">
                      calendar_today
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="text-sm text-white">
                        {booking.show_date || 'TBD'} {booking.start_time && `at ${booking.start_time}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Charges and Action */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Total Charges</span>
                    <span className="text-xl font-bold text-blue-500">AED {booking.charges || '0'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/shop/bookings/action?id=${booking.id}`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold uppercase transition-colors"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            {loading ? (
              <div>
                <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full mb-4"></div>
                <p className="text-gray-400 text-sm">Loading bookings...</p>
              </div>
            ) : (
              <div>
                <span className="material-symbols-outlined text-6xl text-gray-600 block mb-4">
                  calendar_blank
                </span>

                <p className="text-gray-400 text-base font-medium mb-2">
                  {searchTerm ? "No bookings found" : "No bookings yet"}
                </p>

                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? `Try adjusting your search for "${searchTerm}"`
                    : "Your bookings will appear here"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
