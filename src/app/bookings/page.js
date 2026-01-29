"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { shops, services } from '@/utils/data';

export default function Home() {
  const [activeService, setActiveService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce logic: Updates debouncedSearch after 300ms of no typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filter Logic
  const filteredServices = services.filter((s) =>
    s.label.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredShops = shops.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = activeService ? shop.categoryId === activeService : true; 
    // Note: Ensure your 'shops' data has a categoryId or similar to link to service.id
    return matchesSearch && matchesCategory;
  });

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
            placeholder="Search services or shops..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Services Horizontal List */}
      <section className="flex gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        {filteredServices.map((service) => {
          const isActive = activeService === service.id;
          const Icon = service.icon;

          return (
            <button
              key={service.id}
              onClick={() => setActiveService(isActive ? null : service.id)}
              className={`
                flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 
                transition-all duration-300 cursor-pointer
                ${isActive
                  ? "bg-primary text-white shadow-lg scale-105"
                  : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                }
              `}
            >
              <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {service.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* Shops Main List */}
      <main className="flex-1 px-4 space-y-4 pt-4 pb-28">
        {filteredShops.length > 0 ? (
          filteredShops.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all"
            >
              <div
                className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                style={{ backgroundImage: `url(${item.image})` }}
              />

              <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${item.statusColor}`}>
                      {item.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-yellow-500 text-base">star</span>
                      <span className="text-sm font-bold">{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mt-0.5">{item.name}</h3>

                  <div className="flex items-center gap-2 mt-1 text-slate-400">
                    <span className="text-[11px] font-semibold">{item.reviews} reviews</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-[11px] font-semibold">{item.distance}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-black">
                    {item.price} AED
                    <span className="text-[10px] text-slate-500 font-normal ml-0.5">/hr</span>
                  </p>
                  <button className="bg-primary px-5 py-2 rounded-full text-xs font-bold uppercase shadow-lg shadow-primary/20">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-500">
            No results found for "{debouncedSearch}"
          </div>
        )}
      </main>
    </>
  );
}