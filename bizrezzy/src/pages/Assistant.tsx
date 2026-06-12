import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';
import { getPersona, savePersona } from '@/lib/persona';

/**
 * The shop's AI assistant: see exactly what the auto-reply bot is told to
 * say (its system prompt) and customise it. One prompt drives both WhatsApp
 * and Live Chat replies.
 */
export default function Assistant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const [usingCustom, setUsingCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getPersona()
      .then((info) => {
        if (!alive) return;
        setDraft(info.persona ?? info.default_prompt);
        setUsingCustom(info.using_custom);
      })
      .catch(() => { if (alive) setError('Could not load your assistant settings.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const apply = (persona: string | null) => {
    setSaving(true);
    setError('');
    setNotice('');
    return savePersona(persona)
      .then((info) => {
        setDraft(info.persona ?? info.default_prompt);
        setUsingCustom(info.using_custom);
        setNotice(info.using_custom ? 'Saved — your assistant now uses this prompt.' : 'Back to the standard assistant.');
      })
      .catch(() => setError('Could not save. Please try again.'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-page-head" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="c-page-title">AI Assistant</h1>
          <p className="c-page-sub">
            This is the instruction your assistant follows when it replies to customers on
            WhatsApp and Live Chat.
          </p>
        </div>
        <button className="c-icon-btn" aria-label="Back to settings" onClick={() => navigate('/settings')}>
          <Icons.ChevronLeft size={18} />
        </button>
      </div>

      {error && <div className="c-error-box">{error}</div>}
      {notice && (
        <div style={{ margin: '0 16px 12px', padding: 12, borderRadius: 'var(--r-md)', background: 'var(--mint-soft)', border: '1px solid var(--border-mint)', color: 'var(--mint-300)', fontSize: 13, textAlign: 'center' }}>
          {notice}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading assistant…" />
      ) : (
        <div style={{ padding: '0 16px' }}>
          <div className="c-field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 8px' }}>
            <span>System prompt</span>
            <span style={{ color: usingCustom ? 'var(--mint-300)' : 'var(--text-4)', textTransform: 'none', letterSpacing: 0 }}>
              {usingCustom ? 'Custom' : 'Standard (based on your category)'}
            </span>
          </div>

          <div className="c-input-row c-input-area" style={{ marginBottom: 14 }}>
            <textarea
              aria-label="System prompt"
              rows={14}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setNotice(''); }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-1)', font: 'inherit', fontSize: 13.5, lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          <button className="c-btn c-btn-block" disabled={saving || !draft.trim()} onClick={() => void apply(draft)}>
            {saving ? 'Saving…' : 'Save prompt'}
          </button>

          {usingCustom && (
            <button className="c-btn-ghost" style={{ width: '100%', marginTop: 10 }} disabled={saving}
              onClick={() => void apply(null)}>
              Reset to standard
            </button>
          )}

          <p style={{ color: 'var(--text-4)', fontSize: 12, lineHeight: 1.5, margin: '14px 4px 24px' }}>
            Tip: keep it short and concrete — your services, prices, tone, and anything the
            assistant should never promise. Changes apply to the next customer message.
          </p>
        </div>
      )}
    </div></div>
  );
}
