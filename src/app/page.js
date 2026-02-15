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
import AddToCatalog from '@/components/Shop/Catalog';


export default function Main() {

  const router = useRouter();

  const [shops, setShops] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeService, setActiveService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(10);



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

  const fetchShops = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/shops?page=${page}&per_page=${perPage}`);
      setShops(response.data.data);

      // Extract pagination metadata from response
      setCurrentPage(response.data.current_page || page);
      setTotalPages(response.data.last_page || 1);
      setTotal(response.data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.globalDebouncedSearch = searchTerm; // safe now
        setCurrentPage(1); // Reset to first page when searching
        fetchShops(1);
        fetchServices();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const toggleFavourite = async (shopId) => {
    await api.post(`/shops/${shopId}/favourite`);
    fetchShops(currentPage); // Refresh current page
  };

  if (error) return <p className="text-red-500">{error}</p>;

  // return <AddToCatalog />;

  return (
    <>
      {/* Services Horizontal List */}
      <section className="flex gap-2 px-8 py-4 mt-5 overflow-x-auto no-scrollbar">
        {services.map((service) => {
          const isActive = activeService === service.id;
          const Icon = ICON_MAP[service.icon];


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

              {Icon && <Icon size={16} className={isActive ? "text-white" : "text-slate-500"} />}

              <span className="text-xs font-bold uppercase tracking-wider">
                {service.name}
              </span>
            </button>
          );
        })}
      </section>

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

      {/* Shops Main List */}
      <main className="flex-1 px-4 space-y-4 pt-4 pb-28">
        {shops.length > 0 ? (
          shops.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl bg-card-dark p-4 border border-white/5 shadow-lg active:scale-[0.98] transition-all"
            >
              <div
                className="w-24 h-24 shrink-0 bg-center bg-no-repeat bg-cover rounded-xl"
                style={{ backgroundImage: `url(${item.logo})` }}
              />

              <div className="flex-1 flex flex-col justify-between min-h-[96px]">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${item.is_open ? 'text-green-500' : 'text-orange-500'}`}>
                      {item.is_open ? "Open" : "Close"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleFavourite(item.id)}>
                        <Heart
                          className={`${item.is_favourite
                            ? "text-primary fill-primary"
                            : "text-slate-500 fill-none"
                            }`}
                        />
                      </button>
                      <span className="text-sm font-bold">{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mt-0.5">{item.name}</h3>

                  <div className="flex items-center gap-2 mt-1 text-slate-400">
                    <span className="text-[11px] font-semibold">{item.location}</span>
                    <span className="text-[11px] font-semibold">{item.distance}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex text-sm text-white/80 gap-1">
                    {item.today_working_hours?.start_time} - {item.today_working_hours?.end_time}
                  </div>
                  <button
                    onClick={() => router.push(`/detail?id=${item.id}`)}
                    className="bg-primary px-5 py-2 rounded-full text-xs font-bold uppercase shadow-lg shadow-primary/20">
                    Book Now
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

        {/* Pagination Controls */}
        {totalPages > 1 && shops.length > 0 && (
          <div className="flex items-center justify-between gap-4 mt-8 pb-8">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  fetchShops(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/30 transition-all"
            >
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
              Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="font-semibold text-white">{currentPage}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  fetchShops(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === totalPages || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/30 transition-all"
            >
              Next
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        )}
      </main>
    </>
  );
}