"use client";
import { usePathname } from "next/navigation";

export default function GuestHeader() {
  const pathname = usePathname();

  // Show header on guest routes only
  const isGuestRoute = [
    "/",
    "/detail",
    "/booking",
    "/explore",
    "/near-me",
    "/favourites"
  ].some(route => pathname?.startsWith(route));

  // Hide on auth routes and shop routes
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isShopRoute = pathname?.startsWith("/shop");

  // Show header only on guest routes
  const shouldShowHeader = isGuestRoute && !isAuthRoute && !isShopRoute;

  if (!shouldShowHeader) return null;

  // Get page title based on route
  const getHeaderTitle = () => {
    if (pathname === "/") return "ServiceHub";
    if (pathname?.startsWith("/detail")) return "Shop Details";
    if (pathname?.startsWith("/booking")) return "Booking";
    if (pathname === "/explore") return "Explore";
    if (pathname === "/near-me") return "Near Me";
    if (pathname === "/favourites") return "Favorites";
    return "ServiceHub";
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[#0B121B] via-[#0B121B]/95 to-[#0B121B]/80 backdrop-blur-xl border-b border-white/10 py-4">
      <div className="max-w-[480px] mx-auto px-4">
        <h1 className="text-center text-lg font-bold text-white">{getHeaderTitle()}</h1>
      </div>
    </header>
  );
}
