"use client"
import BookingDetailHeader from "@/components/BookingDetailHeader";
import WorkingHours from "@/components/WorkingHours";
import api from "@/utils/api";
import { generateDates } from "@/utils/date";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css"; // default styling

export default function DetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [shop, setShop] = useState(null);
    const [activeServices, setActiveServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const dates = generateDates(31);
    const [selectedTime, setSelectedTime] = useState("");

    const toggleService = (serviceId) => {
        // All clicked → reset filters
        if (serviceId === null) {
            setActiveServices([]);
            return;
        }

        setActiveServices((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId) // remove
                : [...prev, serviceId]                  // add
        );
    };

    const totalPrice = activeServices.reduce(
        (sum, serviceId) => {
            const service = shop?.catalogs.find(s => s.id === serviceId);
            return sum + (service ? parseFloat(service.price) : 0);
        },
        0
    );

    useEffect(() => {
        if (!shopId) return;

        api.get(`/shops/${shopId}`).then(res => {
            console.log(res.data);
            setShop(res.data);
        });
    }, [shopId]);

    const handleBooking = async () => {
        if (loading) return;

        try {
            setLoading(true);
            setErrorMessage(null); // clear previous error

            const bookingDetails = {
                date: selectedDate,
                start_time: selectedTime,
                charges: totalPrice,
                services: activeServices.map(id => {
                    const service = shop?.catalogs.find(s => s.id === id);
                    if (!service) return null;

                    // Destructure to exclude `image`
                    const { image, ...rest } = service;
                    return rest;
                }).filter(Boolean) // remove any nulls if service not found
            };

            const response = await api.post(
                `/shops/${shop.id}/book`,
                bookingDetails
            );

            // success
            router.push(
                '/booking-confirmation?id=' + response.data.data.id
            );

        } catch (error) {
            let message = "Something went wrong. Please try again.";

            if (error.response?.data?.message) {
                message = error.response.data.message;
            }

            setErrorMessage(message); // 🔥 only ONE error stored
        } finally {
            setLoading(false);
        }
    };

    if (!shop) return <p>Loading...</p>;

    return (
        <>
            <div className="relative flex h-screen w-full flex-col overflow-x-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

                    <BookingDetailHeader shop={shop} />

                    <div className="px-5 flex flex-col gap-4 pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold">Service Catalog</h2>
                            <button className="glass-card p-1.5 rounded-lg">
                                {/* <span className="material-symbols-outlined text-navy-muted text-xl">tune</span> */}
                            </button>
                        </div>
                        {shop?.catalogs.map((item) => {
                            const isActive = activeServices.includes(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`glass-card rounded-2xl p-4 flex gap-4 items-center
                ${isActive ? "ring-1 ring-primary/50 bg-primary/5" : ""}
            `}
                                >
                                    <div
                                        className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5"
                                        style={{ backgroundImage: `url(${item.image})` }}
                                    />

                                    <div className="flex-1">
                                        <h3 className="font-bold text-base">{item.title}</h3>
                                        <p className="text-xs text-navy-muted mt-0.5">
                                            {item.description}
                                        </p>
                                        <p className="text-primary font-bold mt-2 text-lg">
                                            AED {item.price}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => toggleService(item.id)}
                                        className={`
                    flex h-10 shrink-0 items-center justify-center rounded-full px-5 
                    transition-all duration-300 cursor-pointer
                    ${isActive
                                                ? "bg-primary text-white shadow-lg scale-105"
                                                : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                                            }
                `}
                                    >
                                        <span className="material-symbols-outlined">
                                            {isActive ? "check" : "add"}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}


                    </div>

                    <div className="px-5 flex flex-col gap-4 pt-6">
                        <h2 className="text-lg font-bold">Select Date & Time</h2>

                        {/* Date Picker */}
                        <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
                            <label className="text-xs text-navy-muted font-semibold uppercase">
                                Appointment Date
                            </label>

                            <div className="mt-3 overflow-x-auto no-scrollbar flex gap-3">
                                {dates.map((date) => {
                                    const isActive = selectedDate?.toDateString() === date.toDateString();
                                    const isToday = new Date().toDateString() === date.toDateString();

                                    return (
                                        <button
                                            key={date.toDateString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-3 rounded-2xl
            transition-all duration-300 text-sm font-bold
            ${isActive
                                                    ? "bg-primary text-white shadow-lg scale-105"
                                                    : isToday
                                                        ? "border border-primary hover:text-white"
                                                        : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                                                }`}
                                        >
                                            <span className="text-xs font-semibold">
                                                {date.toLocaleString("en-US", { weekday: "short" })}
                                            </span>
                                            <span className="text-base font-extrabold">{date.getDate()}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div className="glass-card rounded-2xl p-4">
                            <p className="text-xs text-navy-muted font-semibold uppercase mb-3">
                                Time Slot
                            </p>
                            <div className="flex overflow-x-auto no-scrollbar gap-3">
                                {shop?.slots.map((time) => {
                                    const active = selectedTime === time;
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => setSelectedTime(time)}
                                            className={`py-3 px-5 rounded-2xl font-bold text-sm flex-shrink-0 transition-all duration-300
              ${active
                                                    ? "bg-primary text-white shadow-lg scale-105"
                                                    : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-10">
                        <div className="glass-card rounded-2xl p-5">
                            <WorkingHours working_hours={shop?.working_hours || []} />
                        </div>
                    </div>

                </div>


                <div
                    className="fixed bottom-20 left-0 right-0 p-5 bg-navy-deep/95 backdrop-blur-2xl border-t border-white/10 z-[60]">
                    {errorMessage && (
                        <div className="mx-5 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 font-semibold">
                            {errorMessage}
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-navy-muted uppercase font-bold tracking-wider">{activeServices.length}  Service{activeServices.length > 1 ? "s" : ""}</p>
                            <p className="text-xl font-extrabold text-white">AED {totalPrice.toFixed(2)}</p>
                        </div>
                        <button onClick={handleBooking}
                            className="flex-1 bg-primary text-white h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            Continue Booking
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </div>
                    <div className="h-4"></div>
                </div>
            </div>
        </>
    );
}