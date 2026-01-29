"use client"
import { useRouter } from "next/navigation";

export default function DetailPage() {
    const router = useRouter();
    return (
        <>
            <div className="relative flex h-screen w-full flex-col overflow-x-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                    <div className="relative w-full h-[40vh]">
                        <div className="w-full h-full bg-center bg-no-repeat bg-cover"
                            data-alt="Modern luxury interior of a professional hair salon"
                            style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuA699cNhnG0fEkFg4tALoMy6bJHZeDz68OUenoI2EntA7xwe6iHHv5zFFXmqnxvv_f0UFLPJmVzhyzUo3vAHBt0OKk90ctRN-2qZ-FCV3giW6U0Dw91paHD7Sc703LLKYXq8PzTml8_04UUXBcz0VJJSzQ1nm_BP7KEmBw1wo8b0r5Z1BSatcAgQ1Hd5Tv7ZIV6Apue5RCb7feUCvRB4ZkK-gDhA5HfiAjFDlPYSywFJRiaqoMLVPI09PspZdG51IRWKmtwXgFo3v8X)` }}>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/20 to-transparent"></div>
                    </div>
                    <div className="px-5 -mt-16 relative z-10">
                        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div
                                    className="bg-primary/20 border border-primary/30 text-primary text-[10px] uppercase font-bold tracking-[0.1em] w-fit px-2.5 py-1 rounded-md">
                                    Verified Provider
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-md">
                                    <span className="material-symbols-outlined text-yellow-400 text-sm"
                                        style={{ "font-variation-settings": "'FILL' 1" }}>star</span>
                                    <span className="text-yellow-400 font-bold text-xs">4.9</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">Luxe Grooming Studio</h1>
                                <div className="flex items-center gap-2 text-navy-muted text-sm">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span>2.4 miles away • Downtown Plaza</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 pt-4 border-t border-white/5">
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Status</p>
                                    <p className="text-sm font-bold text-green-400">Open Now</p>
                                </div>
                                <div className="flex flex-col items-center border-x border-white/10">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Experience</p>
                                    <p className="text-sm font-bold text-white">8+ Yrs</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] text-navy-muted uppercase font-semibold">Price</p>
                                    <p className="text-sm font-bold text-white">$$$</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sticky top-0 bg-navy-deep/80 backdrop-blur-xl z-40 mt-6 px-5">
                        <div className="flex border-b border-white/5 gap-8">
                            <a className="flex flex-col items-center justify-center border-b-2 border-primary text-primary pb-3 pt-2"
                                href="#">
                                <p className="text-sm font-bold tracking-wide">Services</p>
                            </a>
                            <a className="flex flex-col items-center justify-center border-b-2 border-transparent text-navy-muted pb-3 pt-2"
                                href="#">
                                <p className="text-sm font-bold tracking-wide">About</p>
                            </a>
                            <a className="flex flex-col items-center justify-center border-b-2 border-transparent text-navy-muted pb-3 pt-2"
                                href="#">
                                <p className="text-sm font-bold tracking-wide">Reviews</p>
                            </a>
                        </div>
                    </div>
                    <div className="px-5 py-6">
                        <h2 className="text-lg font-bold mb-2">About Studio</h2>
                        <p className="text-navy-muted leading-relaxed text-sm">
                            Premium grooming and wellness treatments. Our master stylists bring over 15 years of experience to
                            provide the ultimate relaxation and precision styling...
                            <button className="text-primary font-bold ml-1">Read more</button>
                        </p>
                    </div>
                    <div className="px-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold">Recommended</h2>
                            <button className="glass-card p-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-navy-muted text-xl">tune</span>
                            </button>
                        </div>
                        <div className="glass-card rounded-2xl p-4 flex gap-4 items-center">
                            <div className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5"
                                data-alt="Close up of a professional haircut service"
                                style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuCwMyLE2JRqV7y0BpYEYbQcQah_0DgDIsLzauhrmwnF3oi0hbL8kA-wOpdBF82QJH545A5M04QcxhC80SA9uV0Z_dVtZccVWHNxejHsMd9KFKTnqxuch9bp3sW75StvWF7zj7Ydqx8Vu4qNGblpC4ofr0_EZzkvWvhbuH4aQcF03dfgHKXX47BIvJOQGzpOX80XfOnYfvYUi56EzyRqcaKqgO2Hbt81fSNBSHjtqkQanwVsS2hh9RccruEXiDX8JTZqFZqnz3G1BpJb)` }}>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-base">Signature Haircut</h3>
                                <p className="text-xs text-navy-muted mt-0.5">45 min • Styling included</p>
                                <p className="text-primary font-bold mt-2 text-lg">$65.00</p>
                            </div>
                            <button
                                className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
                                <span className="material-symbols-outlined font-bold">add</span>
                            </button>
                        </div>
                        <div className="glass-card rounded-2xl p-4 flex gap-4 items-center ring-1 ring-primary/50 bg-primary/5">
                            <div className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5"
                                data-alt="Beard grooming and trimming tools"
                                style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuAa2HGA6r5474ZBXmKPXjMczhQrzc0WaFghXQttvrzDPNJ701GvCj8MbghytS2tKjUCPwce_dGPTsqOxA1fXFF_qz2731zqiu0mq53gbXq6jPTp8paFv83bUXTUR3QtlSFomU43Zk52rxWGGLDPXuNDBKMnSqeqcRlFFn5Ge8zpuHytIh_6GQJLIllHH_tKuTcvvhiCk42fUIQmKKFh2KuLm_gjU_mTsym5C41f0TSHAAGj_AuUcWjaMLBtazyLQu26AZKpbrLWhb1F)` }}>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-base">Royal Beard Groom</h3>
                                <p className="text-xs text-navy-muted mt-0.5">30 min • Hot towel</p>
                                <p className="text-primary font-bold mt-2 text-lg">$45.00</p>
                            </div>
                            <button
                                className="size-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined font-bold">check</span>
                            </button>
                        </div>
                        <div className="glass-card rounded-2xl p-4 flex gap-4 items-center">
                            <div className="size-20 rounded-xl bg-cover bg-center shrink-0 border border-white/5"
                                data-alt="Relaxing head massage treatment"
                                style={{ backgroundImage: `url(https://lh3.googleusercontent.com/aida-public/AB6AXuAlTQ95_yiXLiVs34q-yclG8hFqgraZUKbyPzaOGkI7PmLW0_eaMzTyhcuQA3w3NtybTAAv7SUJxCTaBkhA_nI9-M_mJQTUKNHeuaOmGaZQDaHwSXC1fyy4GR6MrFCABonp5GSFFikd6mW2LGD6ssP8FNrgoYdFUL5diiF9aX5oHPba8Nfyn9VZuihwOVgQScB-up3qnm_36_06sUuhbn3himOhsw2fz_xA4fVyt072FnjRJ5ZDWmsRbel6cIK6oShX8hpMssawSTZL)` }}>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-base">Scalp Therapy</h3>
                                <p className="text-xs text-navy-muted mt-0.5">20 min • Organic oils</p>
                                <p className="text-primary font-bold mt-2 text-lg">$35.00</p>
                            </div>
                            <button
                                className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined font-bold">add</span>
                            </button>
                        </div>
                    </div>
                    <div className="px-5 py-10">
                        <div className="glass-card rounded-2xl p-5">
                            <h2 className="text-lg font-bold mb-4">Working Hours</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-navy-muted">Mon - Tue</span>
                                    <span className="font-medium text-white">9:00 AM - 9:00 PM</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-primary font-bold">Wednesday (Today)</span>
                                    <span className="font-bold text-primary">9:00 AM - 9:00 PM</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-navy-muted">Thu - Fri</span>
                                    <span className="font-medium text-white">9:00 AM - 10:00 PM</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-navy-muted">Sat - Sun</span>
                                    <span className="font-medium text-white">10:00 AM - 6:00 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="fixed bottom-20 left-0 right-0 p-5 bg-navy-deep/95 backdrop-blur-2xl border-t border-white/10 z-[60]">
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex flex-col">
                            <p className="text-[10px] text-navy-muted uppercase font-bold tracking-wider">1 Service</p>
                            <p className="text-xl font-extrabold text-white">$45.00</p>
                        </div>
                        <button onClick={() => router.push('/booking-confirmation')}
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