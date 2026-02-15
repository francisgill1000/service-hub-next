"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';

const AddToCatalog = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result); // Store as base64 string
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCatalog = async () => {
    // Validation
    if (!formData.title.trim()) {
      await notify({
        icon: 'warning',
        title: 'Missing Service Title',
        text: 'Please enter a service title'
      });
      return;
    }

    if (!formData.description.trim()) {
      await notify({
        icon: 'warning',
        title: 'Missing Description',
        text: 'Please enter a service description'
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      await notify({
        icon: 'warning',
        title: 'Invalid Price',
        text: 'Please enter a valid price'
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price
      };

      if (imageFile) {
        submitData.image = imageFile; // Base64 string
      }

      await api.post('/shop/catalogs', submitData);

      await notify({
        icon: 'success',
        title: 'Success!',
        text: 'Service added to catalog successfully'
      });

      // Reset form
      setFormData({ title: '', description: '', price: '' });
      setImageFile(null);
      setImagePreview(null);

      // Optional: Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push('/shop/catalogs');
      }, 1500);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save catalog';
      await notify({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
      console.error('Catalog save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-[#0B121B] text-white font-sans">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B121B] px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="material-symbols-outlined text-2xl hover:text-primary transition-colors"
        >
          arrow_back
        </button>
        <h1 className="text-xl font-bold">Add Service</h1>
      </div>

      {/* Main Form Content */}
      <main className="flex-1 overflow-y-auto px-5 pb-40 no-scrollbar">

        {/* Image Upload Area */}
        <div className="mt-4 group">
          <label className="relative flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl">image</span>
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold">Upload Service Image</p>
                  <p className="text-xs text-navy-muted mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Input Fields */}
        <div className="mt-8 space-y-6">
          {/* Service Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy-muted ml-1">
              Service Title
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-base disabled:opacity-50 text-white placeholder-navy-muted"
              placeholder="e.g., Full House Plumbing Check"
              type="text"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy-muted ml-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-base resize-none disabled:opacity-50 text-white placeholder-navy-muted"
              placeholder="Describe what's included in this service..."
              rows="4"
            />
          </div>

          {/* Price Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-navy-muted ml-1">
              Price (AED)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-sm font-bold">
                AED
              </div>
              <input
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full h-12 pl-14 pr-4 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-base font-semibold disabled:opacity-50 text-white placeholder-navy-muted"
                placeholder="0.00"
                type="number"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-5">
          <button
            onClick={handleSaveCatalog}
            disabled={loading}
            className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Saving...' : 'Save Catalog'}</span>
            {!loading && <span className="material-symbols-outlined">check_circle</span>}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AddToCatalog;