import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { getWaContacts } from '@/lib/chats';
import type { WaContact } from '@/types';

const POLL_MS = 10000;

export function chatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export default function Chats() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async (first = false) => {
      try {
        const res = await getWaContacts();
        if (!alive) return;
        setConnected(res.connected);
        setContacts(res.data);
        setError('');
      } catch {
        if (alive && first) setError('Could not load chats.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    void load(true);
    timer.current = setInterval(() => void load(), POLL_MS);
    return () => { alive = false; if (timer.current) clearInterval(timer.current); };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? contacts.filter((c) => (c.name || '').toLowerCase().includes(q) || c.wa_number.includes(q))
    : contacts;

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-page-head">
        <h1 className="c-page-title">Chats</h1>
        <p className="c-page-sub">WhatsApp conversations with your customers.</p>
      </div>

      {error && <div className="c-error-box">{error}</div>}

      {loading ? (
        <Spinner label="Loading chats…" />
      ) : !connected ? (
        <EmptyState
          icon={<Icons.WhatsApp size={28} />}
          title="WhatsApp not connected"
          subtitle="Connect your WhatsApp Business number to chat with customers here."
          action={
            <button className="c-btn" onClick={() => navigate('/chats/setup')}>
              Set up WhatsApp
            </button>
          }
        />
      ) : (
        <>
          <div className="c-input-row" style={{ margin: '0 16px 12px' }}>
            <input
              type="search"
              placeholder="Search name or number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icons.Chat size={28} />}
              title={q ? 'No matches' : 'No chats yet'}
              subtitle={q ? 'Try a different search.' : 'When customers message your WhatsApp number, chats appear here.'}
            />
          ) : (
            filtered.map((c) => {
              const name = c.name || c.wa_number;
              const unread = c.unread_count || 0;
              return (
                <Link key={c.id} to={`/chats/${c.id}`} className="c-chat-row">
                  <div className="c-staff-avatar">{name.charAt(0).toUpperCase()}</div>
                  <div className="c-chat-row-body">
                    <div className="c-chat-row-top">
                      <span className="c-chat-row-name">{name}</span>
                      <span className="c-chat-row-time">{chatTime(c.last_message_at)}</span>
                    </div>
                    <div className="c-chat-row-bottom">
                      <span className="c-chat-row-preview">
                        {c.last_message_direction === 'out' ? 'You: ' : ''}
                        {c.last_message_preview || ''}
                      </span>
                      {unread > 0 && <span className="c-chat-unread">{unread}</span>}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </>
      )}
    </div></div>
  );
}
