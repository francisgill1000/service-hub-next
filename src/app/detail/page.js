"use client"
import WorkingHours from "@/components/WorkingHours";
import api from "@/utils/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css"; // default styling

const generateDates = (numDays = 31) => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < numDays; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    return dates;
};



const SHOP_DUMMY_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuA699cNhnG0fEkFg4tALoMy6bJHZeDz68OUenoI2EntA7xwe6iHHv5zFFXmqnxvv_f0UFLPJmVzhyzUo3vAHBt0OKk90ctRN-2qZ-FCV3giW6U0Dw91paHD7Sc703LLKYXq8PzTml8_04UUXBcz0VJJSzQ1nm_BP7KEmBw1wo8b0r5Z1BSatcAgQ1Hd5Tv7ZIV6Apue5RCb7feUCvRB4ZkK-gDhA5HfiAjFDlPYSywFJRiaqoMLVPI09PspZdG51IRWKmtwXgFo3v8X"
const RATING_DUMMY = 4.9;
const catalog = [
    {
        id: 1,
        title: "Signature Haircut",
        description: "45 min • Styling included",
        price: "65.00",
        image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCwMyLE2JRqV7y0BpYEYbQcQah_0DgDIsLzauhrmwnF3oi0hbL8kA-wOpdBF82QJH545A5M04QcxhC80SA9uV0Z_dVtZccVWHNxejHsMd9KFKTnqxuch9bp3sW75StvWF7zj7Ydqx8Vu4qNGblpC4ofr0_EZzkvWvhbuH4aQcF03dfgHKXX47BIvJOQGzpOX80XfOnYfvYUi56EzyRqcaKqgO2Hbt81fSNBSHjtqkQanwVsS2hh9RccruEXiDX8JTZqFZqnz3G1BpJb",
    },
    {
        id: 2,
        title: "Royal Beard Groom",
        description: "30 min • Hot towel",
        price: "45.00",
        image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAa2HGA6r5474ZBXmKPXjMczhQrzc0WaFghXQttvrzDPNJ701GvCj8MbghytS2tKjUCPwce_dGPTsqOxA1fXFF_qz2731zqiu0mq53gbXq6jPTp8paFv83bUXTUR3QtlSFomU43Zk52rxWGGLDPXuNDBKMnSqeqcRlFFn5Ge8zpuHytIh_6GQJLIllHH_tKuTcvvhiCk42fUIQmKKFh2KuLm_gjU_mTsym5C41f0TSHAAGj_AuUcWjaMLBtazyLQu26AZKpbrLWhb1F",
    },
    {
        id: 3,
        title: "Scalp Therapy",
        description: "20 min • Organic oils",
        price: "35.00",
        image:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAlTQ95_yiXLiVs34q-yclG8hFqgraZUKbyPzaOGkI7PmLW0_eaMzTyhcuQA3w3NtybTAAv7SUJxCTaBkhA_nI9-M_mJQTUKNHeuaOmGaZQDaHwSXC1fyy4GR6MrFCABonp5GSFFikd6mW2LGD6ssP8FNrgoYdFUL5diiF9aX5oHPba8Nfyn9VZuihwOVgQScB-up3qnm_36_06sUuhbn3himOhsw2fz_xA4fVyt072FnjRJ5ZDWmsRbel6cIK6oShX8hpMssawSTZL",
    },
];

const TIME_SLOTS = [
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM",
    "08:30 PM",
    "09:00 PM",
    "09:30 PM",
    "10:00 PM",
    "10:30 PM",
    "11:00 PM",
    "11:30 PM",
];



export default function DetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const shopId = searchParams.get("id");
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
            const service = catalog.find(s => s.id === serviceId);
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

    const handleBooking = () => {
        // Here you can handle the booking logic, e.g., send data to the backend
        const bookingDetails = {
            shop_id: shop.id,
            services: activeServices.map(id => catalog.find(s => s.id === id)),
            totalPrice: totalPrice
        };
        console.log("Booking Details:", bookingDetails);
        router.push('/booking-confirmation');
    };

    if (!shop) return <p>Loading...</p>;

    return (
        <>
            <div className="relative flex h-screen w-full flex-col overflow-x-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <div className="relative w-full h-[40vh]">
                        <div className="w-full h-full bg-center bg-no-repeat bg-cover"
                            data-alt="Modern luxury interior of a professional hair salon"
                            style={{ backgroundImage: `url(${shop.hero_image})` }}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent"></div>
                    </div>
                    <div className="px-5 -mt-16 relative z-10">
                        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div
                                    className="bg-primary/20 border border-primary/30 text-primary text-[10px] uppercase font-bold tracking-[0.1em] w-fit px-2.5 py-1 rounded-md">

                                    {shop.is_verified ? "Verified" : "Unverified"} Provider
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-md">
                                    <span className="material-symbols-outlined text-yellow-400 text-sm"
                                        style={{ "fontVariationSettings": "'FILL' 1" }}>star</span>
                                    <span className="text-yellow-400 font-bold text-xs">{RATING_DUMMY}</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">{shop.name}</h1>
                                <div className="flex items-center gap-2 text-navy-muted text-sm">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span>{shop.location}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-white/5">
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Status</p>
                                    <p className="text-sm font-bold text-green-400">Open Now</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Total Bookings</p>
                                    <p className="text-sm font-bold text-white">{shop.total_bookings}</p>
                                </div>
                                <div className="flex flex-col items-center border-x border-white/10">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Experience</p>
                                    <p className="text-sm font-bold text-white">{shop.year_of_experience}+ Yrs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 flex flex-col gap-4 pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold">Service Catalog</h2>
                            <button className="glass-card p-1.5 rounded-lg">
                                {/* <span className="material-symbols-outlined text-navy-muted text-xl">tune</span> */}
                            </button>
                        </div>
                        {catalog.map((item) => {
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
                                                        ? "bg-primary  hover:text-white"
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
                                {TIME_SLOTS.map((time) => {
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
                            <WorkingHours />
                        </div>
                    </div>

                </div>
                <div
                    className="fixed bottom-20 left-0 right-0 p-5 bg-navy-deep/95 backdrop-blur-2xl border-t border-white/10 z-[60]">
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