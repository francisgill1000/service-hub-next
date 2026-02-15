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
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-[#0B121B] text-white font-sans">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B121B] px-5 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Services</h2>
          <button
            onClick={() => router.push('/shop/catalog')}
            className="material-symbols-outlined text-2xl hover:text-primary transition-colors"
          >
            add
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-primary rounded-full mb-4"></div>
              <p className="text-navy-muted text-sm">Loading services...</p>
            </div>
          </div>
        ) : catalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-navy-muted">
                add_circle
              </span>
            </div>
            <div className="text-center px-4">
              <h3 className="text-lg font-bold mb-2">No Services Yet</h3>
              <p className="text-sm text-navy-muted mb-6">
                Create your first service to get started
              </p>
              <button
                onClick={() => router.push('/shop/catalog')}
                className="px-6 py-2 bg-primary text-white rounded-full font-bold hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add Service
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 flex flex-col gap-4 pt-6">
            {catalogs.map((catalog) => (
              <div
                key={catalog.id}
                className="glass-card rounded-2xl p-4 flex gap-4 items-start hover:bg-white/10 transition-all duration-300 group"
              >
                {/* Image */}
                <div
                  className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5 group-hover:border-white/20 transition-all"
                  style={{
                    backgroundImage: catalog.image ? `url(${catalog.image})` : 'none',
                    backgroundColor: !catalog.image ? '#1e293b' : undefined
                  }}
                >
                  {!catalog.image && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl text-navy-muted">
                        image
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base line-clamp-2">{catalog.title}</h3>
                  <p className="text-xs text-navy-muted mt-0.5 line-clamp-2">
                    {catalog.description}
                  </p>
                  <p className="text-primary font-bold mt-2 text-lg">
                    AED {parseFloat(catalog.price).toFixed(2)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/shop/catalog/edit?id=${catalog.id}`)}
                    className="flex h-9 items-center justify-center rounded-lg px-3 bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-300 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCatalog(catalog.id)}
                    disabled={deleting === catalog.id}
                    className="flex h-9 items-center justify-center rounded-lg px-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-300 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-base">
                      {deleting === catalog.id ? 'more_horiz' : 'delete'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CatalogList;
