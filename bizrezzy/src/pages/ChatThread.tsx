import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';
import { getWaContacts, getWaMessages, markWaRead, sendWaMessage } from '@/lib/chats';
import type { WaContact, WaMessage } from '@/types';

const POLL_MS = 4000;

function bubbleTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatThread() {
  const navigate = useNavigate();
  const { id } = useParams();
  const contactId = Number(id);

  const [contact, setContact] = useState<WaContact | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const appendMessages = useCallback((incoming: WaMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      return [...prev, ...fresh];
    });
    const maxId = Math.max(...incoming.map((m) => m.id));
    if (maxId > lastIdRef.current) lastIdRef.current = maxId;
  }, []);

  // initial load: contact info + history, mark read
  useEffect(() => {
    if (!contactId) return;
    let alive = true;
    (async () => {
      try {
        const [contactsRes, history] = await Promise.all([
          getWaContacts(),
          getWaMessages(contactId),
        ]);
        if (!alive) return;
        setContact(contactsRes.data.find((c) => c.id === contactId) ?? null);
        appendMessages(history);
        void markWaRead(contactId).catch(() => undefined);
      } catch {
        if (alive) setError('Could not load this chat.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [contactId, appendMessages]);

  // poll for new messages
  useEffect(() => {
    if (!contactId) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await getWaMessages(contactId, lastIdRef.current);
        if (fresh.length > 0) {
          appendMessages(fresh);
          void markWaRead(contactId).catch(() => undefined);
        }
      } catch {
        /* transient poll error — next tick retries */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [contactId, appendMessages]);

  // auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendWaMessage(contactId, text);
      appendMessages([sent]);
      setDraft('');
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not send. WhatsApp only allows free replies within 24h of the customer’s last message.');
    } finally {
      setSending(false);
    }
  };

  const title = contact?.name || contact?.wa_number || 'Chat';

  return (
    <div className="m-screen c-thread-screen">
      <div className="c-thread-head">
        <button className="c-icon-btn" aria-label="Back" onClick={() => navigate('/chats')}>
          <Icons.ChevronLeft size={18} />
        </button>
        <div className="c-staff-avatar" style={{ width: 38, height: 38, fontSize: 15 }}>
          {title.charAt(0).toUpperCase()}
        </div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">{title}</span>
          {contact?.name && <span className="c-thread-sub">{contact.wa_number}</span>}
        </div>
      </div>

      <div className="c-thread-scroll" ref={scrollRef}>
        {loading ? (
          <Spinner label="Loading messages…" />
        ) : messages.length === 0 ? (
          <p className="c-thread-empty">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const isAudio = !!m.media_url && (m.type === 'audio' || m.type === 'voice');
            const isImage = !!m.media_url && m.type === 'image';
            return (
              <div key={m.id} className={`c-bubble ${m.direction === 'out' ? 'out' : 'in'}`}>
                {isAudio && <audio controls preload="none" src={m.media_url!} className="c-bubble-audio" />}
                {isImage && <img src={m.media_url!} alt="" className="c-bubble-img" loading="lazy" />}
                {((!isAudio && !isImage) || !m.body.startsWith('[')) && <span className="c-bubble-text">{m.body}</span>}
                <span className="c-bubble-time">{bubbleTime(m.created_at)}</span>
              </div>
            );
          })
        )}
      </div>

      {error && <div className="c-error-box" style={{ margin: '0 16px 8px' }}>{error}</div>}

      <div className="c-composer">
        <input
          type="text"
          placeholder="Type a reply…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
        />
        <button
          className="c-btn c-composer-send"
          aria-label="Send"
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend()}
        >
          <Icons.Send size={18} />
        </button>
      </div>
    </div>
  );
}
