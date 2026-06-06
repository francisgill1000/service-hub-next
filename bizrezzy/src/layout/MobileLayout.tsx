import { Link, Outlet, useLocation } from 'react-router-dom';
import { Icons } from '@/components/Icons';

type Tab = { id: string; label: string; href: string; icon: keyof typeof Icons };

const tabs: Tab[] = [
  { id: 'home', label: 'Home', href: '/', icon: 'Home' },
  { id: 'bookings', label: 'Bookings', href: '/bookings', icon: 'Calendar' },
  { id: 'chats', label: 'Chats', href: '/chats', icon: 'Chat' },
  // Reminders tab hidden for now — page still reachable at /reminders and via
  // the Dashboard quick action.
  { id: 'services', label: 'Services', href: '/services', icon: 'Grid' },
  { id: 'profile', label: 'Profile', href: '/profile', icon: 'Store' },
];

function activeTab(path: string): string {
  if (path === '/') return 'home';
  if (path.startsWith('/bookings') || path.startsWith('/booking')) return 'bookings';
  if (path.startsWith('/chats')) return 'chats';
  if (path.startsWith('/reminders')) return 'reminders';
  if (path.startsWith('/services')) return 'services';
  if (path.startsWith('/profile') || path.startsWith('/staff') || path.startsWith('/working-hours')) return 'profile';
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
