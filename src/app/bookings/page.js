"use client";
import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Pickaxe,
  Wind,
  Zap,
  Car,
  Paintbrush,
  Home,
  ShieldCheck,
  Star,
  Heart,
  HeaterIcon,
} from 'lucide-react';

const ICON_MAP = {
  Scissors,
  Pickaxe,
  Wind,
  Zap,
  Car,
  Paintbrush,
  Home,
  ShieldCheck,
};
import api from "@/utils/api";

import { useRouter } from "next/navigation";


export default function Main() {

  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeService, setActiveService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");



  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/services");
      console.log(response.data);

      setServices(
        [{
          id: null,
          name: "All",
          icon: "bag",
        }, ...response.data]
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings`);
      setBookings(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.globalDebouncedSearch = searchTerm; // safe now
        fetchBookings();
        fetchServices();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      {/* Search Input Section */}
      <section className="flex gap-2 px-4 py-4 overflow-x-auto no-scrollbar">
        <div className="relative group w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
            search
          </span>
          <input
            className="w-full h-14 bg-card-dark border border-white/5 rounded-2xl pl-12 pr-4 text-white placeholder:text-muted-text focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
            placeholder="Search services or bookings..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Shops Main List */}
      <main className="flex-1 px-4 space-y-4 pt-4 pb-28">
        {bookings.length > 0 ? (
          bookings.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all"
            >
              <div
                className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                style={{ backgroundImage: `url(${item?.shop?.logo})` }}
              />

              <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest`}>
                      BK{String(item?.id).padStart(5, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button>
                        <Heart
                          className={`${item?.shop?.is_favourite
                            ? "text-primary fill-primary"
                            : "text-slate-500 fill-none"
                            }`}
                        />
                      </button>
                      <span className="text-sm font-bold">{item?.shop?.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mt-0.5">{item?.shop?.name}</h3>

                  <div className="flex items-center gap-2 mt-1 text-slate-400">
                    <span className="text-[11px] font-semibold">{item?.shop.location}</span>
                    <span className="text-[11px] font-semibold">{item?.shop.distance}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex text-sm text-white/80 gap-1">
                    AED {item?.charges}
                  </div>
                  <button
                    onClick={() => router.push(`/booking/view?id=${item.id}`)}
                    className="bg-primary px-5 py-2 rounded-full text-xs font-bold uppercase shadow-lg shadow-primary/20">
                    View Book
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500">
            No results found for "{searchTerm}"
          </div>
        )}
      </main>
    </>
  );
}