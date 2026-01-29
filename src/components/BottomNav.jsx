"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  // Helper to check if a link is active
  const isActive = (path) => pathname === path;

  // We hide the nav on login/register pages
  const hideNav = ['/login', '/register', '/forgot-password'].includes(pathname);
  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-20 bg-white/5 backdrop-blur-xl border-t border-white/10 rounded-t-3xl flex items-center justify-around px-4 z-[100]">
      <Link href="/" className="flex flex-col items-center gap-1 group">
        <span className={`material-symbols-outlined ${isActive('/') ? 'text-primary [font-variation-settings:"FILL"_1]' : 'text-muted-text'}`}>explore</span>
        <span className={`text-[10px] ${isActive('/') ? 'text-primary font-bold' : 'text-muted-text font-medium'}`}>Explore</span>
      </Link>

      <Link href="/bookings" className="flex flex-col items-center gap-1 group">
        <span className={`material-symbols-outlined ${isActive('/bookings') ? 'text-primary [font-variation-settings:"FILL"_1]' : 'text-muted-text'}`}>calendar_today</span>
        <span className={`text-[10px] ${isActive('/bookings') ? 'text-primary font-bold' : 'text-muted-text font-medium'}`}>Bookings</span>
      </Link>

      <Link href="/detail" className="flex flex-col items-center gap-1 group">
        <div className="relative -top-8 size-16 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/40 border-[6px] border-brand-dark cursor-pointer active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-white text-3xl">add</span>
        </div>
      </Link>

      <Link href="/favourites" className="flex flex-col items-center gap-1 group">
        <span className={`material-symbols-outlined ${isActive('/favourites') ? 'text-primary [font-variation-settings:"FILL"_1]' : 'text-muted-text'}`}>favorite</span>
        <span className={`text-[10px] ${isActive('/favourites') ? 'text-primary font-bold' : 'text-muted-text font-medium'}`}>Favourites</span>
      </Link>

      <Link href="/notifications" className="flex flex-col items-center gap-1 group">
        <span className={`material-symbols-outlined ${isActive('/notifications') ? 'text-primary [font-variation-settings:"FILL"_1]' : 'text-muted-text'}`}>notifications</span>
        <span className={`text-[10px] ${isActive('/notifications') ? 'text-primary font-bold' : 'text-muted-text font-medium'}`}>Notifications</span>
      </Link>
    </nav>
  );
}