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
    <LandingPage />
    <div className="md:hidden">
      {/* Services Horizontal List */}
      {/* <section className="flex gap-2 px-8 py-4 mt-5 overflow-x-auto no-scrollbar">
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
      </section> */}

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
                onClick={() => router.push(`/detail?id=${item.id}`)}
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
    </div>
    </>
  );
}

function LandingPage() {
  return (
    <div className="hidden md:block min-h-screen relative bg-[#0d141d] text-[#dce3f0] overflow-x-hidden">
      <div className="fixed inset-0 landing-bg-grid pointer-events-none" />
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#4b8eff]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Landing nav */}
      <nav className="fixed top-0 z-[100] w-full h-20 flex items-center justify-between px-6 md:px-12 bg-[#0d141d]/80 backdrop-blur-md border-b border-[#414755]/20">
        <div className="text-2xl font-black tracking-tighter text-[#4b8eff]">REZZY</div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#network" className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] hover:text-white transition-colors">The Network</a>
          <a href="#tech" className="text-[10px] font-black uppercase tracking-widest text-[#8b90a0] hover:text-white transition-colors">The Protocol</a>
          <a href="/login" className="h-10 px-6 rounded-xl bg-[#4b8eff] text-white font-black text-xs uppercase tracking-widest hover:bg-[#4b8eff]/90 transition-all flex items-center">
            Access Now
          </a>
        </div>
      </nav>

      <main className="relative z-10 pt-32">

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 text-center mb-32">
          <h1 className="text-6xl md:text-[120px] font-black tracking-tighter text-white leading-[0.85] mb-12">
            SYNCING THE <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "1.5px #4b8eff" }}>EMIRATES.</span>
          </h1>
          <p className="text-lg md:text-xl font-semibold text-[#8b90a0] max-w-xl mx-auto leading-relaxed">
            One unified booking engine. Seven Emirates. <br /> Zero friction.
          </p>
        </section>

        {/* Network */}
        <section id="network" className="max-w-7xl mx-auto px-6 mb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="lg:col-span-2 landing-card p-10 rounded-3xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                <span className="material-symbols-outlined text-[200px] text-[#4b8eff]">hub</span>
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="size-3 rounded-full bg-[#4b8eff] landing-pulse-dot" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4b8eff]">Primary Cluster</p>
              </div>
              <h3 className="text-4xl font-black text-white mb-4">Dubai & <br />Abu Dhabi</h3>
              <p className="text-[#8b90a0] font-semibold">Instant confirmation active across the capital and business hubs.</p>
            </div>

            <div className="landing-card p-10 rounded-3xl relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                <span className="material-symbols-outlined text-[150px] text-[#4edea3]">museum</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4edea3] mb-8">Legacy Center</p>
              <h3 className="text-3xl font-black text-white mb-4">Sharjah</h3>
              <p className="text-[#8b90a0] font-semibold text-sm">Deep cultural integration with 100+ verified spots.</p>
            </div>

            <div className="landing-card p-10 rounded-3xl relative overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#ffb690] mb-8">Expansion</p>
              <h3 className="text-3xl font-black text-white mb-4">Northern <br />States</h3>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="px-2 py-1 rounded-md bg-[#19202a] text-[#8b90a0] text-[9px] font-black border border-[#414755]/40">AJM</span>
                <span className="px-2 py-1 rounded-md bg-[#19202a] text-[#8b90a0] text-[9px] font-black border border-[#414755]/40">RAK</span>
                <span className="px-2 py-1 rounded-md bg-[#19202a] text-[#8b90a0] text-[9px] font-black border border-[#414755]/40">UAQ</span>
                <span className="px-2 py-1 rounded-md bg-[#19202a] text-[#8b90a0] text-[9px] font-black border border-[#414755]/40">FUJ</span>
              </div>
            </div>

          </div>
        </section>

        {/* Tech / Protocol */}
        <section id="tech" className="max-w-7xl mx-auto px-6 mb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-12">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Built for <br /> Elite Speed.</h2>

              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="size-12 rounded-2xl bg-[#4b8eff]/10 flex items-center justify-center text-[#4b8eff] shrink-0">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">Zero Latency</h4>
                    <p className="text-[#8b90a0] text-sm font-semibold">Direct WebSocket bridge between customer and provider dashboards.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="size-12 rounded-2xl bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
                    <span className="material-symbols-outlined">verified_user</span>
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase text-xs tracking-widest mb-2">Verified Only</h4>
                    <p className="text-[#8b90a0] text-sm font-semibold">Exclusive network of vetted service providers across the UAE.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-card p-4 rounded-[40px] rotate-2 shadow-2xl" style={{ borderColor: "rgba(65,71,85,0.4)" }}>
              <div className="bg-[#080f17] rounded-[32px] p-8 aspect-[9/12] border border-[#414755]/20">
                <div className="w-12 h-1 bg-[#414755]/40 mx-auto rounded-full mb-12" />
                <div className="space-y-6">
                  <div className="h-4 w-1/3 bg-[#19202a] rounded-full" />
                  <div className="h-12 w-full bg-[#4b8eff]/10 rounded-2xl border border-[#4b8eff]/20" />
                  <div className="grid grid-cols-4 gap-2">
                    <div className="h-10 bg-[#19202a] rounded-xl" />
                    <div className="h-10 bg-[#4b8eff] rounded-xl" />
                    <div className="h-10 bg-[#19202a] rounded-xl" />
                    <div className="h-10 bg-[#19202a] rounded-xl" />
                  </div>
                  <div className="space-y-3 pt-4">
                    <div className="h-20 w-full bg-[#151c25] rounded-2xl border border-[#414755]/30" />
                    <div className="h-20 w-full bg-[#151c25] rounded-2xl border border-[#414755]/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-5xl mx-auto px-6 py-40">
          <div className="landing-card p-12 md:p-24 rounded-[48px] text-center relative overflow-hidden" style={{ borderColor: "rgba(75,142,255,0.2)" }}>
            <div className="absolute inset-0 bg-[#4b8eff]/5 pointer-events-none" />
            <h2 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tighter">Ready to experience <br /> the Sync?</h2>
            <a href="/login" className="inline-flex items-center justify-center h-16 px-12 rounded-2xl bg-[#4b8eff] text-white font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-[#4b8eff]/20">
              Access Now
            </a>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-[#414755]/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-xl font-black text-white">REZZY<span className="text-[#4b8eff]">.</span></div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-[#414755]">
            <span>DUBAI</span>
            <span>SHARJAH</span>
            <span>ABU DHABI</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-[10px] font-bold text-[#414755]">© 2026 REZZY PROTOCOL</p>
            <p className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">
              Powered by <span className="text-[#4b8eff]">Eloquent</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}