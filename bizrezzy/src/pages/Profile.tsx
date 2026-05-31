import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar } from '@/layout/AppBar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { updateShop, reverseGeocode } from '@/lib/shops';

type Form = {
  name: string;
  location: string;
  phone: string;
  email: string;
  lat: number | '';
  lon: number | '';
  logo: string | null;
  hero_image: string | null;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const { shop, token, loginShop, logoutShop } = useShop();
  const [form, setForm] = useState<Form>({ name: '', location: '', phone: '', email: '', lat: '', lon: '', logo: null, hero_image: null });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name || '',
      location: shop.location || '',
      phone: shop.phone || '',
      email: shop.email || '',
      lat: (shop.latitude as number) ?? '',
      lon: (shop.longitude as number) ?? '',
      logo: null,
      hero_image: null,
    });
  }, [shop]);

  const change = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = () => {
    if (locating || !navigator.geolocation) { if (!navigator.geolocation) setError('Geolocation unavailable.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        let location = form.location;
        try {
          const res = await reverseGeocode(coords.latitude, coords.longitude);
          if (res.address) location = res.address as string;
        } catch { /* use coords only */ }
        setForm((f) => ({ ...f, lat: coords.latitude, lon: coords.longitude, location }));
        setLocating(false);
      },
      () => { setError('Unable to fetch your location.'); setLocating(false); },
    );
  };

  const handleSave = async () => {
    if (!shop?.id) return;
    if (!form.name.trim()) { setError('Business name is required.'); return; }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        name: form.name, location: form.location, phone: form.phone, email: form.email,
      };
      if (form.lat !== '') payload.lat = Number(form.lat);
      if (form.lon !== '') payload.lon = Number(form.lon);
      if (form.logo) payload.logo = form.logo;
      if (form.hero_image) payload.hero_image = form.hero_image;
      const updated = await updateShop(shop.id, payload);
      if (updated?.id && token) loginShop(updated, token);
      setForm((f) => ({ ...f, logo: null, hero_image: null }));
      setMessage('Profile updated.');
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setError(d?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) { logoutShop(); navigate('/login'); }
  };

  return (
    <div className="m-screen">
      <AppBar title="Business Profile" actions={<WhatsAppButton />} />
      <div className="m-scroll">
        {error && <div className="c-error-box">{error}</div>}
        {message && <div className="c-card" style={{ color: 'var(--mint-300)' }}>{message}</div>}

        <div style={{ padding: '0 16px' }}>
          <label className="c-field-label" htmlFor="name">Business Name</label>
          <div className="c-input-row">
            <input id="name" type="text" value={form.name} onChange={(e) => { change('name', e.target.value); setError(''); }} />
          </div>

          <label className="c-field-label" htmlFor="location">Location</label>
          <div className="c-input-row">
            <input id="location" type="text" value={form.location} onChange={(e) => change('location', e.target.value)} />
          </div>
          <button className="c-btn-ghost" style={{ width: '100%', marginBottom: 16 }} disabled={locating} onClick={useMyLocation}>
            <Icons.Locate size={16} /> {locating ? 'Detecting…' : 'Use my location'}
          </button>

          <label className="c-field-label" htmlFor="phone">Phone</label>
          <div className="c-input-row">
            <input id="phone" type="tel" value={form.phone} onChange={(e) => change('phone', e.target.value)} />
          </div>

          <label className="c-field-label" htmlFor="email">Email</label>
          <div className="c-input-row">
            <input id="email" type="email" value={form.email} onChange={(e) => change('email', e.target.value)} />
          </div>

          <label className="c-field-label" htmlFor="logo">Logo</label>
          <input id="logo" type="file" accept="image/*" style={{ marginBottom: 12 }}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) change('logo', await fileToDataUrl(f)); }} />

          <label className="c-field-label" htmlFor="hero">Cover Banner</label>
          <input id="hero" type="file" accept="image/*" style={{ marginBottom: 16 }}
            onChange={async (e) => { const f = e.target.files?.[0]; if (f) change('hero_image', await fileToDataUrl(f)); }} />

          <button className="c-btn c-btn-block" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        <div className="c-section-title">Manage</div>
        <div className="c-card" style={{ padding: 0 }}>
          <Link to="/staff" className="c-row-link" style={{ borderBottom: '1px solid var(--border-1)' }}>
            <span className="c-row-title">Staff</span><Icons.Chevron size={18} />
          </Link>
          <Link to="/working-hours" className="c-row-link">
            <span className="c-row-title">Working Hours</span><Icons.Chevron size={18} />
          </Link>
        </div>

        <div style={{ padding: '8px 16px 24px' }}>
          <button className="c-btn-ghost" style={{ width: '100%', color: 'var(--danger)' }} onClick={handleLogout}>
            <Icons.Logout size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
