import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icons } from '@/components/Icons';

type Tab = { id: string; label: string; href: string; icon: keyof typeof Icons };

// AI sits dead-centre as a raised button; the other four flank it 2+2.
// (Near Me moved off the bar — it's reachable from the Home header, and the
// AI finder now handles "near me" queries directly.)
const tabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { id: 'ai', label: 'AI', href: '/ai', icon: 'Sparkle' },
  { id: 'favourites', label: 'Favourites', href: '/favourites', icon: 'Heart' },
  { id: 'account', label: 'Account', href: '/account', icon: 'User' },
];

function activeTab(path: string): string {
  if (path === '/' || path.startsWith('/shop')) return 'home';
  if (path.startsWith('/bookings') || path.startsWith('/booking')) return 'bookings';
  if (path.startsWith('/ai')) return 'ai';
  if (path.startsWith('/favourites')) return 'favourites';
  if (path.startsWith('/account') || path.startsWith('/login') || path.startsWith('/register')) return 'account';
  return 'home';
}

export function MobileLayout() {
  const { pathname } = useLocation();
  const active = activeTab(pathname);

  return (
    <div className="mobile-app">
      <main className="mobile-main"><Outlet /></main>
      <div className="m-tabbar">
        {tabs.map((tab) => {
          const Icon = Icons[tab.icon];
          const isActive = active === tab.id;
          if (tab.id === 'ai') {
            return (
              <Link key={tab.id} to={tab.href} className={`tab tab-ai ${isActive ? 'active' : ''}`}>
                <span className="tab-ai-orb"><Icon size={24} /></span>
                <span>{tab.label}</span>
              </Link>
            );
          }
          return (
            <Link key={tab.id} to={tab.href} className={`tab ${isActive ? 'active' : ''}`}>
              <span className="icon"><Icon size={20} /></span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
