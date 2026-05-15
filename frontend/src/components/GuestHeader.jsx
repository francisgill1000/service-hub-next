"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import WhatsAppSupportButton from "./WhatsAppSupportButton";

const NAV_ITEMS = [
  { label: "Home",        path: "/" },
  { label: "Explore",     path: "/explore" },
  { label: "Near Me",     path: "/near-me" },
  { label: "Bookings",    path: "/bookings" },
  { label: "Favourites",  path: "/favourites" },
];

export default function GuestHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { shop } = useShop();

  const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  const isShopRoute = pathname?.startsWith("/shop");
  const isLandingRoute = pathname === "/"; // landing has its own desktop nav
  if (isAuthRoute || isShopRoute) return null;

  const getHeaderTitle = () => {
    if (pathname === "/") return "Rezzy";
    if (pathname?.startsWith("/detail")) return "Business Details";
    if (pathname?.startsWith("/booking")) return "Booking";
    if (pathname === "/explore") return "Explore";
    if (pathname === "/near-me") return "Near Me";
    if (pathname === "/favourites") return "Favorites";
    if (pathname === "/account") return "Account";
    return "Rezzy";
  };

  const isActive = (path) => (path === "/" ? pathname === "/" : pathname?.startsWith(path));

  return (
    <>
      {/* Mobile header — centered title bar */}
      <header className="md:hidden sticky top-0 z-50 bg-gradient-to-b from-[#0B121B] via-[#0B121B]/95 to-[#0B121B]/80 backdrop-blur-xl border-b border-white/10 py-4">
        <div className="max-w-[480px] mx-auto px-4 flex items-center">
          <div className="w-10" aria-hidden="true" />
          <h1 className="flex-1 text-center text-lg font-bold text-white">{getHeaderTitle()}</h1>
          <WhatsAppSupportButton />
        </div>
      </header>

      {/* Desktop header — full-width navbar (skipped on landing route, which has its own nav) */}
      <header className={`${isLandingRoute ? "hidden" : "hidden md:block"} sticky top-0 z-50 bg-[#0B121B]/95 backdrop-blur-xl border-b border-white/10`}>
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="text-xl font-black text-white tracking-tight shrink-0">
            Rezzy
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive(item.path)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <WhatsAppSupportButton />
            {shop ? (
              <Link
                href="/shop/dashboard"
                className="h-10 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors flex items-center"
              >
                My Business
              </Link>
            ) : (
              <button
                onClick={() => router.push("/account")}
                className={`h-10 px-4 rounded-xl text-sm font-bold transition-colors ${
                  isActive("/account")
                    ? "bg-primary text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                Account
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
