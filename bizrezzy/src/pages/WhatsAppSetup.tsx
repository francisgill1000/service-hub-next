import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/components/Icons';
import { getWaAccount, saveWaAccount } from '@/lib/chats';
import type { WaAccountInfo } from '@/types';

export default function WhatsAppSetup() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<WaAccountInfo | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    getWaAccount()
      .then((acc) => {
        if (!alive) return;
        setAccount(acc);
        if (acc.connected) {
          setPhoneNumber(acc.phone_number || '');
          setPhoneNumberId(acc.phone_number_id || '');
          setWabaId(acc.waba_id || '');
        }
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const handleSave = async () => {
    if (!phoneNumberId.trim()) { setError('Phone Number ID is required.'); return; }
    if (!account?.connected && !token.trim()) { setError('Access token is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await saveWaAccount({
        phone_number: phoneNumber.trim() || undefined,
        phone_number_id: phoneNumberId.trim(),
        waba_id: wabaId.trim() || undefined,
        token: token.trim() || undefined,
      });
      setAccount(res);
      setSaved(true);
      setTimeout(() => navigate('/chats'), 900);
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not save WhatsApp settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={16} /> Back</button>
      <div className="c-page-head">
        <h1 className="c-page-title">WhatsApp Setup</h1>
        <p className="c-page-sub">
          Connect your WhatsApp Business number so customer chats appear in Rezzy.
          Not sure about these values? We can set this up for you — just reach out.
        </p>
      </div>

      {error && <div className="c-error-box">{error}</div>}
      {saved && (
        <div className="c-page-sub" style={{ margin: '0 16px 12px', color: 'var(--mint-300)' }}>
          Saved ✓ WhatsApp connected.
        </div>
      )}
      {account?.connected && !saved && (
        <div className="c-page-sub" style={{ margin: '0 16px 12px', color: 'var(--mint-300)' }}>
          Connected — token {account.token_preview}. Leave the token empty to keep the current one.
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        <label className="c-field-label" htmlFor="wa-number">WhatsApp number</label>
        <div className="c-input-row">
          <input id="wa-number" type="tel" placeholder="+9715xxxxxxxx" value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>

        <label className="c-field-label" htmlFor="wa-pnid">Phone Number ID *</label>
        <div className="c-input-row">
          <input id="wa-pnid" type="text" placeholder="e.g. 1112015568668083" value={phoneNumberId}
            onChange={(e) => { setPhoneNumberId(e.target.value); setError(''); }} />
        </div>

        <label className="c-field-label" htmlFor="wa-waba">WhatsApp Business Account ID</label>
        <div className="c-input-row">
          <input id="wa-waba" type="text" placeholder="optional" value={wabaId}
            onChange={(e) => setWabaId(e.target.value)} />
        </div>

        <label className="c-field-label" htmlFor="wa-token">Access token {account?.connected ? '' : '*'}</label>
        <div className="c-input-row">
          <input id="wa-token" type="password" placeholder={account?.connected ? 'Leave empty to keep current' : 'EAAxxxxxxxx…'}
            value={token} onChange={(e) => { setToken(e.target.value); setError(''); }} />
        </div>

        <button className="c-btn c-btn-block" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : account?.connected ? 'Update' : 'Connect WhatsApp'}
        </button>

        {!account?.connected && (
          <button className="c-btn-ghost" style={{ marginTop: 10 }} onClick={() => navigate('/')}>
            Skip for now
          </button>
        )}
      </div>
    </div></div>
  );
}
