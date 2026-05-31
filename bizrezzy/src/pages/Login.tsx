import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { shopLogin } from '@/lib/shops';
import { useShop } from '@/context/ShopContext';
import { storage } from '@/lib/storage';
import { Icons } from '@/components/Icons';

export default function Login() {
  const navigate = useNavigate();
  const { loginShop } = useShop();
  const [shopCode, setShopCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState<'code' | 'pin'>('code');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prefill after a PIN reset takes priority over remembered credentials.
    const prefill = storage.get('post_reset_login_prefill');
    if (prefill) {
      try {
        const obj = JSON.parse(prefill) as { shopCode?: string; pin?: string };
        if (obj.shopCode) setShopCode(obj.shopCode);
        if (obj.pin) { setPin(obj.pin); setStep('pin'); }
      } catch { /* ignore */ }
      storage.remove('post_reset_login_prefill');
      return;
    }
    if (storage.get('remember_shop_login') === 'true') {
      setRememberMe(true);
      const code = storage.get('remember_shop_code') ?? '';
      const savedPin = storage.get('remember_shop_pin') ?? '';
      setShopCode(code);
      setPin(savedPin);
      if (savedPin) setStep('pin');
    }
  }, []);

  const handleContinue = () => {
    if (!shopCode.trim()) { setError('Please enter your Business ID.'); return; }
    setError('');
    setStep('pin');
  };

  const handleLogin = async () => {
    if (submitting) return;
    if (!pin.trim()) { setError('Please enter your PIN.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { token, shop } = await shopLogin(shopCode.trim(), pin);
      if (token && shop) {
        if (rememberMe) {
          storage.set('remember_shop_login', 'true');
          storage.set('remember_shop_code', shopCode.trim());
          storage.set('remember_shop_pin', pin);
        } else {
          storage.remove('remember_shop_login');
          storage.remove('remember_shop_code');
          storage.remove('remember_shop_pin');
        }
        loginShop(shop, token);
        navigate('/');
      } else {
        setError('Invalid response from server.');
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setError(data?.message || 'Login failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-auth">
        <h1 className="c-auth-title">{step === 'code' ? 'Enter your Business ID' : 'Enter your PIN'}</h1>
        <p className="c-auth-sub">
          {step === 'code' ? 'Use your business code to continue.' : 'Verify your PIN to access the dashboard.'}
        </p>

        {error && <div className="c-error-box">{error}</div>}

        {step === 'code' ? (
          <>
            <label className="c-field-label" htmlFor="shop-code">Business ID</label>
            <div className="c-input-row">
              <input
                id="shop-code"
                type="text"
                placeholder="Enter business code"
                autoCapitalize="none"
                value={shopCode}
                onChange={(e) => { setShopCode(e.target.value); setError(''); }}
              />
            </div>
            <button className="c-btn c-btn-block" onClick={handleContinue}>Continue</button>
          </>
        ) : (
          <>
            <button className="c-back" onClick={() => { setStep('code'); setError(''); }}>
              <Icons.ChevronLeft size={16} /> Change Business ID
            </button>

            <div className="c-card" style={{ marginBottom: 16 }}>
              <div className="c-field-label" style={{ marginBottom: 4 }}>Current Business ID</div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{shopCode}</div>
            </div>

            <label className="c-field-label" htmlFor="pin">PIN</label>
            <div className="c-input-row">
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {showPin ? 'Hide' : 'Show'}
              </button>
            </div>

            <Link className="c-link" to="/forgot-pin" state={{ shopCode }} style={{ display: 'inline-block', marginBottom: 16 }}>
              Forgot PIN?
            </Link>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-2)', fontSize: 14 }}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember ID &amp; PIN
            </label>

            <button className="c-btn c-btn-block" disabled={submitting} onClick={() => void handleLogin()}>
              {submitting ? 'Logging in…' : 'Log In'}
            </button>
          </>
        )}

        <p className="c-muted-center">
          Don't have a business? <Link className="c-link" to="/register">Create Account</Link>
        </p>
      </div>
    </div></div>
  );
}
