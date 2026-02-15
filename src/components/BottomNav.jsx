"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useShop } from '@/context/ShopContext';

const GUEST_NAV_ITEMS = [
  { label: 'Explore', icon: 'explore', path: '/explore' },
  { label: 'Bookings', icon: 'calendar_today', path: '/bookings' },
  { label: 'Home', icon: 'home', path: '/' },
  { label: 'Favourites', icon: 'favorite', path: '/favourites' },
  { label: 'Near Me', icon: 'near_me', path: '/near-me' },
];

const SHOP_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: '/shop/dashboard' },
  { label: 'Services', icon: 'inventory_2', path: '/shop/catalogs' },
  { label: 'Hours', icon: 'schedule', path: '/shop/working_hours' },
  { label: 'Bookings', icon: 'calendar_today', path: '/shop/bookings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { shop } = useShop();

  const hideNav = ['/login', '/register', '/forgot-password'].includes(pathname);
  if (hideNav) return null;

  // Determine if shop owner or guest
  const isShopRoute = pathname?.startsWith("/shop");
  const navItems = isShopRoute ? SHOP_NAV_ITEMS : GUEST_NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-20 bg-white/10 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] flex items-center justify-around px-2 z-[100] pb-2">
      {navItems.map((item, index) => {
        const active = pathname === item.path;

        return (
          <Link
            key={index}
            href={item.path}
            className="relative flex flex-col items-center justify-center w-full h-full group"
          >
            {/* The Floating Indicator */}
            {active && (
              <motion.div
                layoutId="nav-indicator"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute -top-6 size-14 bg-primary rounded-full shadow-lg shadow-primary/40 border-[4px] border-[#0a0a0a] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-white text-2xl [fontVariationSettings:'FILL'_1]">
                  {item.icon}
                </span>
              </motion.div>
            )}

            {/* The Regular Icon (hidden when active) */}
            <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
              <span className="material-symbols-outlined text-muted-text">
                {item.icon}
              </span>
              <span className="text-[10px] text-muted-text font-medium">
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}