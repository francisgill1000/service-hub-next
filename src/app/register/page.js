"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Camera,
    ChevronDown,
    ArrowRight,
    Check,
    Search
} from 'lucide-react';
import GPSTracker from '@/components/GPSTracker';

const App = () => {
    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [coordinates, setCoordinates] = useState('No location detected yet');


    const [error, setError] = useState(null);

    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    const categories = [
        { id: 'retail', name: 'Retail & Shopping' },
        { id: 'food', name: 'Food & Beverage' },
        { id: 'tech', name: 'Technology & Software' },
        { id: 'services', name: 'Professional Services' },
        { id: 'health', name: 'Health & Wellness' },
        { id: 'education', name: 'Education & Learning' },
        { id: 'beauty', name: 'Beauty & Fashion' },
        { id: 'finance', name: 'Finance & Insurance' }
    ];

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        } else {
            setSearchTerm(''); // Clear search when closed
        }
    }, [isDropdownOpen]);

    return (
        <div className="min-h-screen  text-white font-sans flex justify-center items-start p-4 md:p-8">
            <div className="w-full max-w-md space-y-8 pb-12">

                {/* Header */}
                <header className="flex items-center justify-center mb-8">
                    <h1 className="text-xl font-semibold tracking-tight">Register Your Business</h1>
                </header>

                {/* Brand Section */}
                <section className="space-y-6">
                    <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] text-center">
                        Identity & Brand
                    </h2>

                    <div className="flex flex-col items-center">
                        <label className="group relative flex flex-col items-center justify-center w-32 h-32 bg-[#151921] border-2 border-dashed border-blue-500/40 rounded-2xl cursor-pointer hover:border-blue-500 transition-all overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="bg-blue-500/10 p-3 rounded-xl mb-2 text-blue-400 group-hover:scale-110 transition-transform">
                                <Camera size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider group-hover:text-white/60">
                                Brand Logo
                            </span>
                            <input type="file" className="hidden" />
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Business Name"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-white/20"
                            />
                        </div>

                        {/* Searchable Custom Category Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full bg-[#151921] border border-white/10 rounded-xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm ${!category ? 'text-white/20' : 'text-white'}`}
                            >
                                <span>{category ? categories.find(c => c.id === category)?.name : 'Select Category'}</span>
                                <ChevronDown
                                    size={20}
                                    className={`text-white/20 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-400' : ''}`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c222d] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-white/5 bg-[#252c38]">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Search categories..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full bg-[#151921] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-white/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(item.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-5 py-3 text-left text-sm flex items-center justify-between hover:bg-blue-500/10 transition-colors ${category === item.id ? 'text-blue-400 bg-blue-500/5' : 'text-white/70 hover:text-white'}`}
                                                >
                                                    {item.name}
                                                    {category === item.id && <Check size={16} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-5 py-4 text-xs text-white/30 text-center italic">
                                                No categories found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className='space-y-4'>
                    <div className="mb-5">
                        <h3 className="text-xl font-semibold mb-1">Location</h3>
                        <p className="text-white/40 text-sm">Pinpoint your shop for local customers.</p>
                    </div>
                    <GPSTracker coordinates={coordinates} onSuccess={setCoordinates} setError={setError} />
                </section>

                {error && (
                    <p className="text-red-400 text-xs bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">{error}</p>
                )}


                <footer className="pt-8 space-y-4">
                    <button className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20">
                        Register My Business
                        <ArrowRight size={20} />
                    </button>

                    <p className="text-center text-[11px] text-white/30 leading-relaxed max-w-[280px] mx-auto">
                        By registering, you agree to our <span className="text-white/60 font-medium cursor-pointer hover:underline">Terms of Service</span> and <span className="text-white/60 font-medium cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;