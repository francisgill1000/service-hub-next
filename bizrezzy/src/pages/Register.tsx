import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerShop, reverseGeocode } from '@/lib/shops';
import { useShop } from '@/context/ShopContext';
import { Icons } from '@/components/Icons';
import type { Shop } from '@/types';

type Form = {
  name: string;
  category_id: number;
  lat: number | null;
  lon: number | null;
  location: string;
  address: string;
  phone: string;
  website: string;
  is_verified: boolean;
  logo: string | null;
  hero_image: string | null;
};

const EMPTY: Form = {
  name: '', category_id: 1, lat: null, lon: null, location: '', address: '',
  phone: '', website: '', is_verified: true, logo: null, hero_image: null,
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Register() {
  const navigate = useNavigate();
  const { loginShop } = useShop();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ shop: Shop; token?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const change = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation is not available in this browser.'); return; }
    setScanning(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await reverseGeocode(coords.latitude, coords.longitude);
          const address = (res.address as string) || '';
          setForm((f) => ({
            ...f,
            lat: res.lat ? parseFloat(String(res.lat)) : coords.latitude,
            lon: res.lon ? parseFloat(String(res.lon)) : coords.longitude,
            location: address,
            address,
          }));
        } catch {
          setForm((f) => ({ ...f, lat: coords.latitude, lon: coords.longitude }));
        } finally {
          setScanning(false);
        }
      },
      () => { setError('Failed to get your location. Please try again.'); setScanning(false); },
    );
  };

  const pickImage = async (key: 'logo' | 'hero_image', file?: File) => {
    if (!file) return;
    change(key, await fileToDataUrl(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Business name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await registerShop(form as unknown as Record<string, unknown>);
      if (res.shop) {
        setCreated({ shop: res.shop, token: res.token });
      } else {
        navigate('/login');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setError(data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    const { shop, token } = created;
    const creds = `Business ID: ${shop.shop_code ?? ''}\nPIN: ${shop.pin ?? ''}`;

    const copyCreds = async () => {
      try {
        await navigator.clipboard.writeText(creds);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* clipboard unavailable — values stay visible on screen */ }
    };

    const continueIn = () => {
      if (token) {
        loginShop(shop, token); // already authenticated — go straight in
        navigate('/');
      } else {
        navigate('/login');
      }
    };

    return (
      <div className="m-screen"><div className="m-scroll">
        <div className="c-auth">
          <h1 className="c-auth-title">Business Registered 🎉</h1>
          <p className="c-auth-sub">
            Save these login details — you need them every time you log in.
          </p>

          <div className="c-cred-card">
            <div className="c-cred-row">
              <span className="c-cred-label">Business ID</span>
              <span className="c-cred-value">{String(shop.shop_code ?? '—')}</span>
            </div>
            <div className="c-cred-row">
              <span className="c-cred-label">PIN</span>
              <span className="c-cred-value">{String(shop.pin ?? '—')}</span>
            </div>
            <button className="c-btn-ghost" style={{ width: '100%' }} onClick={() => void copyCreds()}>
              <Icons.Copy size={15} /> {copied ? 'Copied ✓' : 'Copy details'}
            </button>
          </div>

          <button className="c-btn c-btn-block" onClick={continueIn}>
            {token ? 'Continue to Dashboard' : 'Continue to Login'}
          </button>
        </div>
      </div></div>
    );
  }

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-auth">
        <button className="c-back" onClick={() => navigate('/login')}>
          <Icons.ChevronLeft size={16} /> Back to Login
        </button>
        <h1 className="c-auth-title">Register Your Business</h1>
        <p className="c-auth-sub">Tell us about your business to get started.</p>

        {error && <div className="c-error-box">{error}</div>}

        <label className="c-field-label" htmlFor="name">Business Name</label>
        <div className="c-input-row">
          <input id="name" type="text" placeholder="Business Name" value={form.name}
            onChange={(e) => { change('name', e.target.value); setError(''); }} />
        </div>

        <label className="c-field-label" htmlFor="phone">Phone</label>
        <div className="c-input-row">
          <input id="phone" type="tel" placeholder="Phone number" value={form.phone}
            onChange={(e) => change('phone', e.target.value)} />
        </div>

        <label className="c-field-label" htmlFor="website">Website</label>
        <div className="c-input-row">
          <input id="website" type="url" placeholder="https://" value={form.website}
            onChange={(e) => change('website', e.target.value)} />
        </div>

        <label className="c-field-label" htmlFor="location">Location</label>
        <div className="c-input-row">
          <input id="location" type="text" placeholder="Address / area" value={form.location}
            onChange={(e) => change('location', e.target.value)} />
        </div>
        <button className="c-btn-ghost" style={{ width: '100%', marginBottom: 16 }} disabled={scanning} onClick={useMyLocation}>
          <Icons.Locate size={16} /> {scanning ? 'Detecting…' : 'Use my location'}
        </button>

        <label className="c-field-label" htmlFor="logo">Business Logo</label>
        <input id="logo" type="file" accept="image/*" style={{ marginBottom: 12 }}
          onChange={(e) => void pickImage('logo', e.target.files?.[0])} />

        <label className="c-field-label" htmlFor="hero">Cover Banner</label>
        <input id="hero" type="file" accept="image/*" style={{ marginBottom: 16 }}
          onChange={(e) => void pickImage('hero_image', e.target.files?.[0])} />

        <button className="c-btn c-btn-block" disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Registering…' : 'Register Business'}
        </button>

        <p className="c-muted-center">
          Already have a business? <Link className="c-link" to="/login">Log In</Link>
        </p>
      </div>
    </div></div>
  );
}
