"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';

const CatalogList = () => {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shop/catalogs');
      setCatalogs(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      await notify({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load your catalogs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCatalog = async (id) => {
    const confirmDelete = await notify({
      icon: 'warning',
      title: 'Delete Service?',
      text: 'This action cannot be undone',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (confirmDelete.isConfirmed) {
      setDeleting(id);
      try {
        await api.delete(`/shop/catalogs/${id}`);
        setCatalogs(catalogs.filter(cat => cat.id !== id));
        await notify({
          icon: 'success',
          title: 'Deleted',
          text: 'Service removed from catalog'
        });
      } catch (error) {
        console.error('Error deleting catalog:', error);
        await notify({
          icon: 'error',
          title: 'Error',
          text: error?.response?.data?.message || 'Failed to delete catalog'
        });
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8">

        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Service Catalog</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              {catalogs.length > 0
                ? `${catalogs.length} service${catalogs.length !== 1 ? 's' : ''} listed`
                : 'Manage the services your shop offers.'}
            </p>
          </div>
          <button
            onClick={() => router.push('/shop/catalog')}
            className="flex items-center justify-center bg-[#4b8eff] hover:bg-[#4b8eff]/90 text-white font-black px-5 py-3 rounded-xl text-[10px] uppercase tracking-widest shrink-0 transition-all"
          >
            Add Service
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-[#414755] border-t-[#4b8eff] rounded-full" />
            <p className="text-[#8b90a0] text-sm font-semibold">Loading services...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && catalogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#151c25] border border-[#414755]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#8b90a0]">category</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">No Services Yet</h3>
              <p className="text-sm text-[#8b90a0] font-semibold max-w-xs">
                Add your first service to start accepting bookings from customers.
              </p>
            </div>
            <button
              onClick={() => router.push('/shop/catalog')}
              className="flex items-center bg-[#4b8eff] hover:bg-[#4b8eff]/90 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all"
            >
              Add First Service
            </button>
          </div>
        )}

        {/* Catalog grid */}
        {!loading && catalogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="bg-[#151c25] rounded-xl border border-[#414755]/20 overflow-hidden flex flex-col group hover:border-[#414755]/50 transition-all"
              >
                {/* Image */}
                <div
                  className="h-40 w-full bg-[#19202a] bg-cover bg-center relative shrink-0"
                  style={{
                    backgroundImage: catalog.image ? `url(${catalog.image})` : 'none',
                  }}
                >
                  {!catalog.image && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-[#414755]">image</span>
                      <span className="text-[10px] font-bold text-[#414755] uppercase tracking-widest">No image</span>
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute bottom-3 left-3 bg-[#0d141d]/80 backdrop-blur-sm px-3 py-1 rounded-xl border border-[#414755]/30">
                    <span className="text-sm font-black text-[#4b8eff]">
                      AED {parseFloat(catalog.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-4">
                  <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{catalog.title}</h3>
                  <p className="text-xs text-[#8b90a0] mt-1.5 line-clamp-2 leading-relaxed font-medium">
                    {catalog.description || 'No description provided.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => router.push(`/shop/catalog/edit?id=${catalog.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#4b8eff]/10 hover:bg-[#4b8eff]/20 text-[#4b8eff] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCatalog(catalog.id)}
                    disabled={deleting === catalog.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {deleting === catalog.id ? 'more_horiz' : 'delete'}
                    </span>
                    {deleting === catalog.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CatalogList;
