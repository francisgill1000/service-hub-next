import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icons } from '@/components/Icons';

type Tab = { id: string; label: string; href: string; icon: keyof typeof Icons };

const tabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { id: 'favourites', label: 'Favourites', href: '/favourites', icon: 'Heart' },
  { id: 'near', label: 'Near Me', href: '/near-me', icon: 'MapPin' },
  { id: 'account', label: 'Account', href: '/account', icon: 'User' },
];

function activeTab(path: string): string {
  if (path === '/' || path.startsWith('/shop')) return 'home';
  if (path.startsWith('/bookings') || path.startsWith('/booking')) return 'bookings';
  if (path.startsWith('/favourites')) return 'favourites';
  if (path.startsWith('/near-me')) return 'near';
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
          return (
            <Link key={tab.id} to={tab.href} className={`tab ${active === tab.id ? 'active' : ''}`}>
              <span className="icon"><Icon size={20} /></span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
