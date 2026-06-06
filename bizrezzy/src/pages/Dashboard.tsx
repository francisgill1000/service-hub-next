import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar } from '@/layout/AppBar';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { getShopBookings } from '@/lib/bookings';
import { getWaAccount } from '@/lib/chats';
import { storage } from '@/lib/storage';
import { formatLocalDate } from '@/lib/date';
import type { Booking } from '@/types';

function formatTime(t?: string): string {
  if (!t) return 'TBD';
  try {
    const norm = t.length === 5 ? `${t}:00` : t;
    return new Date(`1970-01-01T${norm}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch { return t; }
}

function dateOf(b: Booking): string {
  return String(b.date ?? '').slice(0, 10);
}

const QUICK_ACTIONS: { label: string; sub: string; to: string }[] = [
  { label: 'All Bookings', sub: 'View & manage', to: '/bookings' },
  { label: 'Chats', sub: 'WhatsApp conversations', to: '/chats' },
  { label: 'Reminders', sub: "Tomorrow's WhatsApp nudges", to: '/reminders' },
  { label: 'Staff', sub: 'Add & toggle staff', to: '/staff' },
  { label: 'Services', sub: 'Add or edit', to: '/services' },
  { label: 'Working Hours', sub: 'Set open & close', to: '/working-hours' },
  { label: 'Business Profile', sub: 'Edit info & images', to: '/profile' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { shop, logoutShop } = useShop();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // One-time onboarding nudge: after first login, offer WhatsApp setup.
  useEffect(() => {
    if (!shop?.id || storage.get('wa_setup_prompted')) return;
    let alive = true;
    getWaAccount()
      .then((acc) => {
        if (!alive) return;
        storage.set('wa_setup_prompted', '1');
        if (!acc.connected) navigate('/chats/setup');
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [shop?.id, navigate]);

  const fetchData = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getShopBookings(shop.id);
      const list = res.data;
      const rev = list.reduce((s, b) => s + Number(b.charges ?? 0), 0);
      setBookings(list);
      setTotalBookings(res.total_bookings ?? list.length);
      setTotalRevenue(res.total_revenue != null ? Number(res.total_revenue) : rev);
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } })?.response?.status === 401) { logoutShop(); navigate('/login'); return; }
      setError('Could not load bookings.');
      setBookings([]);
      setTotalBookings(0);
      setTotalRevenue(0);
    } finally {
      setLoading(false);
    }
  }, [shop?.id, logoutShop, navigate]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const todayISO = formatLocalDate(new Date());
  const todayCount = bookings.filter((b) => dateOf(b) === todayISO).length;
  const completedCount = bookings.filter((b) => String(b.status).toLowerCase() === 'completed').length;
  const upcoming = bookings
    .filter((b) => dateOf(b) >= todayISO && String(b.status).toLowerCase() !== 'cancelled')
    .sort((a, b) => (dateOf(a) === dateOf(b)
      ? (a.start_time ?? '').localeCompare(b.start_time ?? '')
      : dateOf(a).localeCompare(dateOf(b))))
    .slice(0, 5);

  return (
    <div className="m-screen">
      <AppBar
        title={shop?.name ?? 'Dashboard'}
        sub={shop?.is_open ? '● Open Now' : '● Closed'}
        actions={
          <button className="c-icon-btn" aria-label="Log out" onClick={() => { logoutShop(); navigate('/login'); }}>
            <Icons.Logout size={20} />
          </button>
        }
      />
      <div className="m-scroll">
        {error && <div className="c-error-box">{error}</div>}

        <div className="c-stat-grid">
          <div className="c-stat"><div className="c-stat-label">Total Bookings</div><div className="c-stat-value">{totalBookings ?? '—'}</div></div>
          <div className="c-stat"><div className="c-stat-label">Total Revenue</div><div className="c-stat-value">{totalRevenue != null ? `AED ${totalRevenue.toLocaleString()}` : '—'}</div></div>
          <div className="c-stat"><div className="c-stat-label">Today</div><div className="c-stat-value">{todayCount}</div></div>
          <div className="c-stat"><div className="c-stat-label">Completed</div><div className="c-stat-value">{completedCount}</div></div>
        </div>

        <div className="c-section-title">Quick Actions</div>
        <div className="c-card" style={{ padding: 0 }}>
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={a.to} to={a.to} className="c-row-link" style={{ borderBottom: i < QUICK_ACTIONS.length - 1 ? '1px solid var(--border-1)' : 'none' }}>
              <div>
                <div className="c-row-title">{a.label}</div>
                <div className="c-row-sub">{a.sub}</div>
              </div>
              <Icons.Chevron size={18} />
            </Link>
          ))}
        </div>

        <div className="c-section-title">Upcoming Bookings</div>
        {loading ? (
          <Spinner label="Loading bookings…" />
        ) : upcoming.length > 0 ? (
          upcoming.map((b) => {
            const name = b.customer?.name || b.customer_name || 'Guest';
            const services = b.services?.map((s) => s.title || s.name).filter(Boolean).join(', ') || 'Service';
            return (
              <button key={b.id} className="c-card c-booking-card" onClick={() => navigate(`/booking/${b.id}`)}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div className="c-row-title">{name}</div>
                  <div className="c-row-sub">{services}</div>
                  <div className="c-row-sub"><Icons.Clock size={12} /> {b.start_time ? formatTime(b.start_time) : (b.show_date ?? 'TBD')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="c-row-title">AED {b.charges ?? 0}</div>
                  <Icons.Chevron size={16} />
                </div>
              </button>
            );
          })
        ) : (
          <EmptyState title="No upcoming bookings" subtitle="New bookings will appear here." />
        )}
      </div>
    </div>
  );
}
