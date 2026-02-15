"use client";

import React, { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import api from '@/utils/api';
import { notify } from '@/utils/alerts';
import { useShop } from '@/context/ShopContext';

const WorkingHours = () => {
    const { shop } = useShop();
    const [loading, setLoading] = useState(false);

    // Day indexes: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // State to manage the schedule for each day
    const [days, setDays] = useState([
        { day: 'Monday', dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Tuesday', dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Wednesday', dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Thursday', dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Friday', dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '23:00' },
        { day: 'Saturday', dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '18:00' },
        { day: 'Sunday', dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' },
    ]);

    // Load existing working hours from backend on mount
    useEffect(() => {
        if (shop?.working_hours) {
            const updatedDays = days.map(dayItem => {
                const existingHours = shop.working_hours.find(wh => wh.day_of_week === dayItem.dayOfWeek);
                if (existingHours) {
                    return {
                        ...dayItem,
                        isOpen: true,
                        openTime: existingHours.start_time,
                        closeTime: existingHours.end_time
                    };
                }
                return dayItem;
            });
            setDays(updatedDays);
        }
    }, [shop?.working_hours]);

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

            await api.put(`/shops/${shop.id}`, {
                working_hours: workingHoursData
            });

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
        <div className="relative mt-5 flex h-screen w-full flex-col max-w-[430px] mx-auto bg-slate-50 dark:bg-[#101722] overflow-hidden shadow-2xl font-sans">

            {/* Main List */}
            <main className="flex-1 overflow-y-auto px-4 pb-48">
                <div className="flex flex-col gap-4 mt-2">
                    {days.map((item, index) => (
                        <div
                            key={item.day}
                            className={`flex flex-col gap-3 p-4 bg-white dark:bg-[#1b232e] rounded-xl border border-slate-100 dark:border-slate-800 transition-all ${!item.isOpen ? 'opacity-70' : 'opacity-100'}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-slate-900 dark:text-white font-semibold">{item.day}</span>
                                <div className="flex items-center gap-3">
                                    {!item.isOpen && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Closed</span>
                                    )}
                                    <button
                                        onClick={() => toggleDay(index)}
                                        disabled={loading}
                                        className={`relative flex h-[30px] w-[52px] items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-50 ${item.isOpen ? 'bg-[#257bf4]' : 'bg-slate-300 dark:bg-[#2d3846]'}`}
                                    >
                                        <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${item.isOpen ? 'translate-x-[22px]' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Rendering for Time Inputs */}
                            {item.isOpen && (
                                <div className="grid grid-cols-2 gap-3 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <TimeInput
                                        label="Opening Time"
                                        value={item.openTime}
                                        onChange={(value) => handleTimeChange(index, 'openTime', value)}
                                        disabled={loading}
                                    />
                                    <TimeInput
                                        label="Closing Time"
                                        value={item.closeTime}
                                        onChange={(value) => handleTimeChange(index, 'closeTime', value)}
                                        disabled={loading}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleSaveWorkingHours}
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-[#257bf4] to-[#1a65d1] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(37,123,244,0.3)] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Reusable Input Sub-component
const TimeInput = ({ label, value, onChange, disabled }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {label}
        </span>
        <div className="relative group">
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-slate-50 dark:bg-[#101722] border border-slate-200 dark:border-[#3b4554] text-slate-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#257bf4]/20 focus:border-[#257bf4] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Clock className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
        </div>
    </div>
);

export default WorkingHours;