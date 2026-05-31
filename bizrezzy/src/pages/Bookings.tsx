import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '@/layout/AppBar';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { getShopBookings } from '@/lib/bookings';
import type { Booking } from '@/types';

const FILTERS = ['All', 'Queued', 'Booked', 'Completed', 'Cancelled'] as const;
type Filter = (typeof FILTERS)[number];

function chipClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return 'c-chip c-chip-completed';
  if (s === 'cancelled') return 'c-chip c-chip-cancelled';
  if (s === 'queued') return 'c-chip c-chip-pending';
  return 'c-chip c-chip-booked';
}

export default function Bookings() {
  const navigate = useNavigate();
  const { shop, logoutShop } = useShop();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const fetchBookings = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await getShopBookings(shop.id);
      setBookings(res.data);
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } })?.response?.status === 401) { logoutShop(); navigate('/login'); return; }
      setError('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [shop?.id, logoutShop, navigate]);

  useEffect(() => { void fetchBookings(); }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const matchFilter = filter === 'All' || String(b.status).toLowerCase() === filter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q
      || (b.customer?.name || b.customer_name || '').toLowerCase().includes(q)
      || (b.booking_reference || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="m-screen">
      <AppBar title="Bookings" sub={`${filtered.length} shown`} />
      <div className="m-scroll">
        <div className="c-input-row" style={{ margin: '0 16px 12px' }}>
          <Icons.Search size={18} />
          <input type="text" placeholder="Search by name or reference…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={f === filter ? 'c-btn' : 'c-btn-ghost'}
              style={{ padding: '6px 14px', fontSize: 12, whiteSpace: 'nowrap' }}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <div className="c-error-box">{error}</div>}

        {loading ? (
          <Spinner label="Loading bookings…" />
        ) : filtered.length > 0 ? (
          <div className="c-card" style={{ padding: '0 16px' }}>
            {filtered.map((b) => {
              const status = String(b.status || 'Booked');
              const name = b.customer?.name || b.customer_name || 'Guest';
              const services = b.services?.map((s) => s.title || s.name).filter(Boolean).join(', ') || 'Service';
              return (
                <button key={b.id} className="c-list-row" style={{ width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--border-1)', cursor: 'pointer', textAlign: 'left' }} onClick={() => navigate(`/booking/${b.id}`)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span className="c-row-title">{name}</span>
                      <span className={chipClass(status)}>{status}</span>
                    </div>
                    <div className="c-row-sub">{services}</div>
                    <div className="c-row-sub">
                      {b.staff?.name ? <span><Icons.User size={11} /> {b.staff.name}</span> : null}
                      {b.start_time ? <span><Icons.Clock size={11} /> {b.start_time}</span> : null}
                      <span style={{ marginLeft: 'auto', color: 'var(--text-2)', fontWeight: 700 }}>AED {b.charges ?? 0}</span>
                    </div>
                  </div>
                  <Icons.Chevron size={18} />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No bookings found" subtitle="Bookings matching your filters will appear here." />
        )}
      </div>
    </div>
  );
}
