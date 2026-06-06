import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { getMasterShops } from '@/lib/shops';
import type { MasterShop } from '@/types';

function shortDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function MasterShops() {
  const navigate = useNavigate();
  const { shop, logoutShop } = useShop();
  const [shops, setShops] = useState<MasterShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    // server enforces this too — the redirect is just UX
    if (shop && !shop.is_master) { navigate('/'); return; }
    let alive = true;
    getMasterShops()
      .then((list) => { if (alive) setShops(list); })
      .catch(() => { if (alive) setError('Could not load businesses.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [shop, navigate]);

  const copyCreds = async (s: MasterShop) => {
    try {
      await navigator.clipboard.writeText(`Business ID: ${s.shop_code}\nPIN: ${s.pin}`);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch { /* values stay visible */ }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? shops.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shop_code || '').includes(q) ||
        (s.phone || '').includes(q))
    : shops;

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-page-head" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="c-page-title">All Businesses</h1>
          <p className="c-page-sub">Master view — credentials and activity for every account.</p>
        </div>
        <button className="c-icon-btn" aria-label="Log out" onClick={() => { logoutShop(); navigate('/login'); }}>
          <Icons.Logout size={18} />
        </button>
      </div>

      {error && <div className="c-error-box">{error}</div>}

      <div className="c-input-row" style={{ margin: '0 16px 12px' }}>
        <input type="search" placeholder="Search name, code or phone" value={query}
          onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <Spinner label="Loading businesses…" />
      ) : filtered.length === 0 ? (
        <EmptyState title={q ? 'No matches' : 'No businesses yet'} />
      ) : (
        filtered.map((s) => (
          <div key={s.id} className="c-master-card">
            <div className="c-master-top">
              <span className="c-master-name">
                {s.name}
                {s.is_master && <em> · master</em>}
              </span>
              <span className={`c-master-wa${s.wa_connected ? ' on' : ''}`}>
                <Icons.WhatsApp size={13} /> {s.wa_connected ? 'Connected' : 'Not set up'}
              </span>
            </div>

            <div className="c-master-creds">
              <span><b>ID</b> {s.shop_code || '—'}</span>
              <span><b>PIN</b> {s.pin || '—'}</span>
              <button className="c-icon-btn" aria-label="Copy credentials" onClick={() => void copyCreds(s)}>
                {copiedId === s.id ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
              </button>
            </div>

            <div className="c-master-meta">
              <span>{s.category || 'No category'}</span>
              <span>{s.phone || 'No phone'}</span>
              <span>{s.bookings_count ?? 0} bookings</span>
              <span>Joined {shortDate(s.created_at)}</span>
              <span>Last login {shortDate(s.last_login_at)}</span>
            </div>
          </div>
        ))
      )}
    </div></div>
  );
}
