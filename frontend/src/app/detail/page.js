"use client"
import BookingDetailHeader from "@/components/BookingDetailHeader";
import WorkingHours from "@/components/WorkingHours";
import api from "@/utils/api";
import { generateDates } from "@/utils/date";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import "react-datepicker/dist/react-datepicker.css"; // default styling

const DetailPageLoader = () => (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden items-center justify-center">
        <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-white/20 border-t-primary rounded-full mb-4"></div>
            <p className="text-gray-400 text-sm">Loading business details...</p>
        </div>
    </div>
);

function DetailPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get("id");

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [shop, setShop] = useState(null);
    const [activeServices, setActiveServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [todayString, setTodayString] = useState("");
    const dates = generateDates(31);
    const [selectedTime, setSelectedTime] = useState("");

    useEffect(() => {
        const today = new Date();
        setSelectedDate(today);
        setTodayString(today.toDateString());
    }, []);



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

    // Format date as local YYYY-MM-DD to avoid timezone shifts when sending to backend
    const formatLocalDate = (d) => {
        if (!d) return undefined;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    useEffect(() => {
        if (!shopId) return;

        api.get(`/shops/${shopId}`, {
            params: {
                date: formatLocalDate(selectedDate)
            }
        }).then(res => {
            // Handle both response structures: {data: {...}} or direct object
            const shopData = res.data.data || res.data;
            // Ensure catalogs is an array
            if (shopData && !Array.isArray(shopData.catalogs)) {
                shopData.catalogs = [];
            }
            setShop(shopData);
        }).catch(err => {
            console.error("Error fetching business:", err);
            setShop(null);
        });
    }, [shopId, selectedDate]);


    const handleBooking = async () => {
        if (loading) return;

        try {
            setLoading(true);
            setErrorMessage(null); // clear previous error

            const bookingDetails = {
                date: formatLocalDate(selectedDate),
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
                `/booking/view?id=${response.data.data.id}`
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

    const selectedCatalogs = (shop?.catalogs || []).filter((c) => activeServices.includes(c.id));
    const canBook = activeServices.length > 0 && !!selectedTime && !loading;

    const ServiceCard = ({ item }) => {
        const isActive = activeServices.includes(item.id);
        return (
            <div
                className={`glass-card rounded-2xl p-4 flex gap-4 items-center transition-colors ${isActive ? "ring-1 ring-primary/50 bg-primary/5" : ""}`}
            >
                <div
                    className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5"
                    style={{
                        backgroundImage: item.image ? `url(${item.image})` : 'none',
                        backgroundColor: !item.image ? '#1e293b' : undefined
                    }}
                >
                    {!item.image && (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg text-slate-500">image</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{item.title}</h3>
                    <p className="text-xs text-navy-muted mt-0.5 line-clamp-2">{item.description}</p>
                    <p className="text-primary font-bold mt-2 text-lg">AED {parseFloat(item.price).toFixed(2)}</p>
                </div>

                <button
                    onClick={() => toggleService(item.id)}
                    className={`flex h-10 shrink-0 items-center justify-center rounded-full px-5 transition-all duration-300 cursor-pointer ${isActive ? "bg-primary text-white shadow-lg" : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"}`}
                >
                    <span className="material-symbols-outlined">{isActive ? "check" : "add"}</span>
                </button>
            </div>
        );
    };

    const DatePickerCard = () => (
        <div className="glass-card rounded-2xl p-4 flex flex-col gap-2">
            <label className="text-xs text-navy-muted font-semibold uppercase">Appointment Date</label>
            <div className="mt-3 overflow-x-auto no-scrollbar flex gap-3">
                {dates.map((date) => {
                    const isActive = selectedDate?.toDateString() === date.toDateString();
                    const isToday = todayString === date.toDateString();
                    return (
                        <button
                            key={date.toDateString()}
                            onClick={() => setSelectedDate(date)}
                            className={`flex flex-col items-center justify-center min-w-[70px] px-3 py-3 rounded-2xl transition-all duration-300 text-sm font-bold ${isActive ? "bg-primary text-white shadow-lg" : isToday ? "border border-primary hover:text-white" : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"}`}
                        >
                            <span className="text-xs font-semibold">{date.toLocaleString("en-US", { weekday: "short" })}</span>
                            <span className="text-base font-extrabold">{date.getDate()}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const TimeSlotsCard = () => (
        <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-navy-muted font-semibold uppercase mb-3">Time Slot</p>
            <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible no-scrollbar gap-2">
                {shop?.slots.length > 0 ? shop?.slots.map((time) => {
                    const active = selectedTime === time;
                    return (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-3 px-5 md:px-2 rounded-2xl md:rounded-xl font-bold text-sm flex-shrink-0 md:flex-shrink transition-all duration-300 ${active ? "bg-primary text-white shadow-lg" : "bg-navy-accent text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"}`}
                        >
                            {time}
                        </button>
                    );
                }) : <span className="text-xs text-navy-muted">No slots available</span>}
            </div>
        </div>
    );

    return (
        <>
            <div className="relative flex h-screen md:h-auto md:min-h-screen w-full flex-col md:block overflow-x-hidden">
                <div className="flex-1 md:flex-none overflow-y-auto md:overflow-visible no-scrollbar pb-32 md:pb-16 md:max-w-7xl md:mx-auto md:px-8 md:pt-6 w-full">

                    <BookingDetailHeader shop={shop} />

                    <div className="md:grid md:grid-cols-12 md:gap-8 md:mt-8">

                        {/* ── Left column: Service catalog ── */}
                        <div className="md:col-span-7 lg:col-span-8 px-5 md:px-0 pt-6 md:pt-0 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg md:text-2xl font-bold text-white">Service Catalog</h2>
                                {selectedCatalogs.length > 0 && (
                                    <span className="text-xs font-bold text-primary">
                                        {selectedCatalogs.length} selected
                                    </span>
                                )}
                            </div>

                            {shop?.catalogs.length > 0 ? (
                                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
                                    {shop.catalogs.map((item) => <ServiceCard key={item.id} item={item} />)}
                                </div>
                            ) : (
                                <p className="text-sm text-navy-muted">No catalog available</p>
                            )}
                        </div>

                        {/* ── Right column: Schedule + Working Hours + Desktop Summary ── */}
                        <div className="md:col-span-5 lg:col-span-4 px-5 md:px-0 pt-10 md:pt-0">
                            <div className="flex flex-col gap-4 md:sticky md:top-6">
                                <h2 className="text-lg md:text-2xl font-bold text-white md:hidden">Select Date & Time</h2>
                                <h2 className="text-lg md:text-xl font-bold text-white hidden md:block">Booking</h2>

                                <DatePickerCard />
                                <TimeSlotsCard />

                                {/* ── Desktop-only summary + continue button ── */}
                                <div className="hidden md:block glass-card rounded-2xl p-5">
                                    <p className="text-xs text-navy-muted font-semibold uppercase mb-3">Order Summary</p>

                                    {selectedCatalogs.length > 0 ? (
                                        <div className="space-y-2 mb-4">
                                            {selectedCatalogs.map((c) => (
                                                <div key={c.id} className="flex items-center justify-between text-sm">
                                                    <span className="text-white/80 truncate pr-2">{c.title}</span>
                                                    <span className="text-white font-bold shrink-0">AED {parseFloat(c.price).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-navy-muted mb-4">Select services to see your total.</p>
                                    )}

                                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                        <span className="text-xs text-navy-muted font-semibold uppercase">Total</span>
                                        <span className="text-xl font-extrabold text-white">AED {totalPrice.toFixed(2)}</span>
                                    </div>

                                    {errorMessage && (
                                        <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 font-semibold">
                                            {errorMessage}
                                        </div>
                                    )}

                                    <button
                                        disabled={!canBook}
                                        onClick={handleBooking}
                                        className="mt-4 w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-primary hover:bg-primary/90 text-white disabled:bg-gray-500/40 disabled:text-white/50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? "Booking…" : "Continue Booking"}
                                    </button>
                                </div>

                                {/* Working hours */}
                                <div className="glass-card rounded-2xl p-5">
                                    <WorkingHours working_hours={shop?.working_hours || []} />
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* ── Mobile-only sticky bottom bar ── */}
                <div className="md:hidden fixed bottom-20 left-0 right-0 p-5 bg-navy-deep/95 backdrop-blur-2xl border-t border-white/10 z-[60]">
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
                        <button
                            disabled={!canBook}
                            onClick={handleBooking}
                            className="flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center transition-transform active:scale-95 bg-primary text-white shadow-lg shadow-primary/30 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            Continue Booking
                        </button>
                    </div>
                    <div className="h-4"></div>
                </div>
            </div>
        </>
    );
}

export default function DetailPage() {
    return (
        <Suspense fallback={<DetailPageLoader />}>
            <DetailPageContent />
        </Suspense>
    );
}