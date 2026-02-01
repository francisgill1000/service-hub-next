
export default function BookingDetailHeader({ shop }) {
    return (
        <>
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
                            <span className="text-yellow-400 font-bold text-xs">{shop.rating}</span>
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
        </>
    );
}