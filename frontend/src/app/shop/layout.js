"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { useNotifications } from "@/context/NotificationsContext";
import ThemeToggle from "@/components/ThemeToggle";
import ThemePicker from "@/components/ThemePicker";

const SHOP_NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/shop/dashboard" },
  { label: "Bookings", icon: "calendar_today", path: "/shop/bookings" },
  { label: "Customers", icon: "group", path: "/shop/customers" },
  { label: "Reminders", icon: "notifications_active", path: "/shop/reminders" },
  { label: "Reports", icon: "bar_chart", path: "/shop/reports" },
  { label: "Insights", icon: "insights", path: "/shop/insights" },
  { label: "Marketing", icon: "campaign", path: "/shop/marketing" },
  { label: "Services", icon: "inventory_2", path: "/shop/catalogs" },
  { label: "Staff", icon: "groups", path: "/shop/staff" },
  { label: "Working Hours", icon: "schedule", path: "/shop/working_hours" },
  { label: "Login Activity", icon: "history", path: "/shop/login-activity" },
  { label: "Profile", icon: "person", path: "/shop/profile" },
];

function SidebarContent({ shop, pathname, bookingCount, onItemClick, onLogout, onClose }) {
  return (
    <>
      <div className="flex items-center gap-3 p-5 border-b border-brand-sidebarborder">
        <div
          className="size-10 rounded-full border-2 border-brand-accent/60 bg-slate-300 bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${shop?.logo || "/barber-shop-image.png"})` }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-brand-sidebarmuted font-medium">Welcome back,</p>
          <h2 className="text-sm font-bold truncate text-brand-sidebarfg">{shop?.name ?? "Your Business"}</h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden size-9 rounded-xl text-brand-sidebarmuted hover:bg-brand-sidebarhover hover:text-brand-sidebarfg flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-1 overflow-y-auto sidebar-scroll">
        {SHOP_NAV_ITEMS.map((item) => {
          const active =
            pathname === item.path || pathname?.startsWith(item.path + "/");
          const isBookings = item.path === "/shop/bookings";
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? "bg-brand-sidebaractive text-white"
                  : "text-brand-sidebarmuted hover:bg-brand-sidebarhover hover:text-brand-sidebarfg"
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

      {/* Theme controls + Logout */}
      <div className="p-4 border-t border-brand-sidebarborder space-y-1">
        <ThemePicker />
        <ThemeToggle variant="sidebar" />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-brand-sidebarmuted hover:bg-brand-sidebarhover hover:text-brand-sidebarfg transition-all"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">logout</span>
          Logout
        </button>
      </div>
    </>
  );
}

export default function ShopLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { shop, logoutShop } = useShop();
  const { notifications } = useNotifications();
  const bookingCount = notifications.length;

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  const handleLogout = () => {
    logoutShop();
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* MOBILE TOP BAR — replaces the global Header on business routes */}
      <header className="md:hidden sticky top-0 z-40 bg-brand-sidebar border-b border-brand-sidebarborder px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="size-10 rounded-xl bg-brand-sidebarhover text-brand-sidebarfg flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <div
          className="size-9 rounded-full border-2 border-brand-accent/60 bg-slate-300 bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${shop?.logo || "/barber-shop-image.png"})` }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-brand-sidebarmuted font-medium leading-tight">Welcome back,</p>
          <h2 className="text-sm font-bold truncate text-brand-sidebarfg leading-tight">{shop?.name ?? "Your Business"}</h2>
        </div>
        {bookingCount > 0 && (
          <Link
            href="/shop/bookings"
            aria-label={`${bookingCount} pending bookings`}
            className="relative size-10 rounded-xl bg-brand-sidebarhover text-brand-sidebarfg flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {bookingCount > 99 ? "99+" : bookingCount}
            </span>
          </Link>
        )}
      </header>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-brand-sidebar border-r border-brand-sidebarborder flex flex-col shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <SidebarContent
              shop={shop}
              pathname={pathname}
              bookingCount={bookingCount}
              onItemClick={() => setMobileOpen(false)}
              onLogout={handleLogout}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-brand-sidebar border-r border-brand-sidebarborder z-50">
        <SidebarContent
          shop={shop}
          pathname={pathname}
          bookingCount={bookingCount}
          onLogout={handleLogout}
        />
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 md:ml-64">
        {children}
      </div>
    </div>
  );
}
