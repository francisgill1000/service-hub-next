"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';
import { useShop } from '@/context/ShopContext';

const WorkingHours = () => {
    const { shop, loginShop, token } = useShop();
    const [loading, setLoading] = useState(false);

    const initialDays = [
        { day: 'Monday', dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Tuesday', dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Wednesday', dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Thursday', dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Friday', dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Saturday', dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '18:00' },
        { day: 'Sunday', dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' },
    ];

    const buildDaysFromWorkingHours = (workingHours = []) => {
        return initialDays.map(dayItem => {
            const existingHours = workingHours.find(wh => wh.day_of_week === dayItem.dayOfWeek);
            if (existingHours) {
                return {
                    ...dayItem,
                    isOpen: true,
                    openTime: existingHours.start_time,
                    closeTime: existingHours.end_time
                };
            }
            return {
                ...dayItem,
                isOpen: false
            };
        });
    };

    // State to manage the schedule for each day
    const [days, setDays] = useState(buildDaysFromWorkingHours(shop?.working_hours || []));

    // Load from context (source of truth)
    useEffect(() => {
        setDays(buildDaysFromWorkingHours(shop?.working_hours || []));
    }, [shop?.id, shop?.working_hours]);

    // Refresh latest shop data on page load/reload
    useEffect(() => {
        if (!shop?.id) return;

        let cancelled = false;

        const fetchShop = async () => {
            try {
                const response = await api.get(`/shops/${shop.id}`);
                const freshShop = response?.data?.data || response?.data;
                if (!cancelled && freshShop && token) {
                    loginShop(freshShop, token);
                }
            } catch (error) {
                console.error('Error fetching latest shop hours:', error);
            }
        };

        fetchShop();

        return () => {
            cancelled = true;
        };
    }, [shop?.id, token]);

    const toggleDay = (index) => {
        const updatedDays = [...days];
        updatedDays[index].isOpen = !updatedDays[index].isOpen;
        setDays(updatedDays);
    };

    const handleTimeChange = (index, field, value) => {
        const updatedDays = [...days];
        updatedDays[index][field] = value;
        setDays(updatedDays);
    };

    const handleSaveWorkingHours = async () => {
        if (!shop?.id) {
            await notify({
                icon: 'error',
                title: 'Error',
                text: 'Shop information not found'
            });
            return;
        }

        setLoading(true);
        try {
            // Prepare data for backend
            const workingHoursData = days
                .filter(day => day.isOpen)
                .map(day => ({
                    day_of_week: day.dayOfWeek,
                    start_time: day.openTime,
                    end_time: day.closeTime,
                    slot_duration: 30
                }));

            const response = await api.put(`/shops/${shop.id}`, {
                working_hours: workingHoursData
            });

            const updatedShopFromApi = response?.data?.shop || response?.data?.data;

            if (updatedShopFromApi && token) {
                loginShop(updatedShopFromApi, token);
            } else {
                setDays(buildDaysFromWorkingHours(workingHoursData));
            }

            await notify({
                icon: 'success',
                title: 'Success!',
                text: 'Working hours saved successfully'
            });
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Failed to save working hours';
            await notify({
                icon: 'error',
                title: 'Error',
                text: errorMessage
            });
            console.error('Error saving working hours:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
            <div className="max-w-[1024px] mx-auto px-4 md:px-8 pt-6 md:pt-8">

                {/* Page heading */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Working Hours</h2>
                        <p className="text-[#8b90a0] font-semibold mt-1 text-sm">Set the days and times your shop is open for bookings.</p>
                    </div>
                    <button
                        onClick={handleSaveWorkingHours}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#adc6ff] to-[#4b8eff] text-[#002e69] font-black px-6 py-3 rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-[#adc6ff]/10 text-[10px] uppercase tracking-widest shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {days.map((item, index) => (
                        <div
                            key={item.day}
                            className={`bg-[#151c25] rounded-xl p-5 border transition-all ${item.isOpen ? 'border-[#414755]/30' : 'border-[#414755]/10 opacity-60'}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.isOpen ? 'bg-[#4edea3]' : 'bg-[#8b90a0]'}`} />
                                    <span className="font-bold text-white">{item.day}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!item.isOpen && (
                                        <span className="text-[10px] text-[#8b90a0] font-bold uppercase tracking-widest">Closed</span>
                                    )}
                                    <button
                                        onClick={() => toggleDay(index)}
                                        disabled={loading}
                                        className={`relative flex h-7 w-12 items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-50 ${item.isOpen ? 'bg-[#4b8eff]' : 'bg-[#2e353f]'}`}
                                    >
                                        <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${item.isOpen ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {item.isOpen && (
                                <div className="grid grid-cols-2 gap-3">
                                    <TimeInput
                                        label="Opens"
                                        value={item.openTime}
                                        onChange={(value) => handleTimeChange(index, 'openTime', value)}
                                        disabled={loading}
                                    />
                                    <TimeInput
                                        label="Closes"
                                        value={item.closeTime}
                                        onChange={(value) => handleTimeChange(index, 'closeTime', value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile save button */}
                <div className="mt-6 md:hidden">
                    <button
                        onClick={handleSaveWorkingHours}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-[#adc6ff] to-[#4b8eff] text-[#002e69] font-black py-4 rounded-xl disabled:opacity-60 shadow-lg text-[10px] uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

// Reusable Input Sub-component
const TimeInput = ({ label, value, onChange, disabled }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-[#8b90a0] uppercase tracking-widest">{label}</span>
        <div className="relative">
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-[#080f17] border border-[#414755]/40 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-[#adc6ff]/20 focus:border-[#adc6ff]/40 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Clock className="absolute right-3 top-3 text-[#8b90a0] pointer-events-none" size={14} />
        </div>
    </div>
);

export default WorkingHours;