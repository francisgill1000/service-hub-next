export default function DetailPage() {
    return (
        <>
            <main className="flex-1 overflow-y-auto pb-48 max-w-md mx-auto w-full px-4">
                <div className="mt-4">
                    <div className="flex items-center gap-4 bg-surface-dark p-4 rounded-2xl border border-border-dark shadow-lg">
                        <div className="size-16 rounded-xl overflow-hidden shrink-0">
                            <img alt="Deep Clean Service" className="w-full h-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr_J_6Zy2FitesY5PuGpFuqZH6oKceo_MfXuorbZXoPK1SuqhY5_0hWsNKq0up4bP1WyhQlIbR_47Tv1HgErUM_EMEqlof7Mh4TLBay2WtyWEpFj7L7CxV9DK__MoGnXANmQhddqUcR43kmCFRrX9eVO0MIBnfIPDsGBeJglWUyS-_XRzMPJooPSV4Euuo10n0IahpitGGtFMmOq9Gsa6855txAyh90R1GpkRxq09636CTjzq6if_I4vHzWADN2m90dkcg21bJetXM" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base">Deep Kitchen Cleaning</h4>
                            <p className="text-sm text-slate-400">Professional cleaning • 2-3 hours</p>
                        </div>
                    </div>
                </div>
                <section className="mt-8">
                    <div className="flex items-center justify-between pb-3">
                        <h3 className="text-lg font-bold tracking-tight">Select Date</h3>
                        <span className="text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full">October 2023</span>
                    </div>
                    <div className="bg-surface-dark rounded-2xl border border-border-dark p-3">
                        <div className="grid grid-cols-7 mb-1">
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                S</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                M</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                T</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                W</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                T</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                F</p>
                            <p
                                className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] flex h-8 items-center justify-center">
                                S</p>
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                            <button className="h-11 w-full text-slate-700 text-sm font-medium">27</button>
                            <button className="h-11 w-full text-slate-700 text-sm font-medium">28</button>
                            <button className="h-11 w-full text-slate-700 text-sm font-medium">29</button>
                            <button className="h-11 w-full text-slate-700 text-sm font-medium">30</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">1</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">2</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">3</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">4</button>
                            <button className="h-11 w-full relative group">
                                <div
                                    className="flex size-10 mx-auto items-center justify-center rounded-xl bg-primary text-white font-bold shadow-[0_0_15px_rgba(0,122,255,0.4)]">
                                    5</div>
                            </button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">6</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">7</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">8</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">9</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">10</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">11</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">12</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">13</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">14</button>
                            <button className="h-11 w-full text-sm font-medium text-slate-300">15</button>
                        </div>
                    </div>
                </section>
                <section className="mt-8">
                    <h3 className="text-lg font-bold tracking-tight pb-3">Available Times</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-surface-dark border border-border-dark active:bg-slate-800 transition-all">
                            <p className="text-sm font-medium text-slate-300">09:00 AM</p>
                        </button>
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-primary text-white border border-primary/50 shadow-[0_0_15px_rgba(0,122,255,0.3)]">
                            <p className="text-sm font-bold">10:30 AM</p>
                        </button>
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-surface-dark border border-border-dark/50 opacity-30 cursor-not-allowed">
                            <p className="text-sm font-medium line-through">12:00 PM</p>
                        </button>
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-surface-dark border border-border-dark">
                            <p className="text-sm font-medium text-slate-300">01:30 PM</p>
                        </button>
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-surface-dark border border-border-dark">
                            <p className="text-sm font-medium text-slate-300">03:00 PM</p>
                        </button>
                        <button
                            className="flex h-12 items-center justify-center rounded-xl bg-surface-dark border border-border-dark">
                            <p className="text-sm font-medium text-slate-300">04:30 PM</p>
                        </button>
                    </div>
                </section>
                <section className="mt-8">
                    <div className="flex items-center justify-between pb-3">
                        <h3 className="text-lg font-bold tracking-tight">Service Address</h3>
                        <button className="text-primary text-sm font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">add_circle</span> Add New
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div
                            className="relative p-5 rounded-2xl border-2 border-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(0,122,255,0.05)]">
                            <div className="flex gap-4">
                                <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary">home</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-base">Home</p>
                                        <span className="material-symbols-outlined text-primary text-xl fill-1">check_circle</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">123 Maple Street, Apt 4B, Brooklyn,
                                        NY 11201</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            <button
                                className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border-dark bg-surface-dark shrink-0 active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-slate-500">work</span>
                                <span className="text-sm font-semibold">Office (Wall St)</span>
                            </button>
                            <button
                                className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-border-dark bg-surface-dark shrink-0 active:scale-95 transition-transform">
                                <span className="material-symbols-outlined text-slate-500">favorite</span>
                                <span className="text-sm font-semibold">Parents' House</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

        </>
    );
}