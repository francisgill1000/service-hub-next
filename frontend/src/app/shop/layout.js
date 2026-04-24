"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import { useNotifications } from "@/context/NotificationsContext";

const SHOP_NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/shop/dashboard" },
  { label: "Services", icon: "inventory_2", path: "/shop/catalogs" },
  { label: "Bookings", icon: "calendar_today", path: "/shop/bookings" },
  { label: "Hours", icon: "schedule", path: "/shop/working_hours" },
  { label: "Profile", icon: "person", path: "/shop/profile" },
];

export default function ShopLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { shop, logoutShop } = useShop();
  const { notifications } = useNotifications();
  const bookingCount = notifications.length;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-[#f5f6f8] dark:bg-[#101622] border-r border-slate-200 dark:border-slate-800 z-50">
        {/* Shop identity */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-200 dark:border-slate-800">
          <div
            className="size-10 rounded-full border-2 border-blue-600/30 bg-slate-300 bg-cover bg-center shrink-0"
            style={{ backgroundImage: `url(${shop?.logo || "/barber-shop-image.png"})` }}
          />
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Welcome back,</p>
            <h2 className="text-sm font-bold truncate">{shop?.name ?? "Your Business"}</h2>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {SHOP_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.path || pathname?.startsWith(item.path + "/");
            const isBookings = item.path === "/shop/bookings";
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-600/15 text-blue-600"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] leading-none ${
                    active ? "[font-variation-settings:'FILL'_1]" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isBookings && bookingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none">
                    {bookingCount > 99 ? "99+" : bookingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              logoutShop();
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 min-w-0 md:ml-64">
        {children}
      </div>
    </div>
  );
}
