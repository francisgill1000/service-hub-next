import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSearch } from '@/lib/ai';
import { toggleFavourite } from '@/lib/shops';
import { Icons } from '@/components/Icons';
import { ShopCard } from '@/components/ShopCard';
import type { Shop } from '@/types';

type AiMsg = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  shops?: Shop[];
};

const GREETING: AiMsg = {
  id: 0,
  role: 'ai',
  text: 'Hey! 👋 How can I help you? Try "find a barber near me" or "AC repair".',
};

export default function AI() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AiMsg[]>([GREETING]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const coordsRef = useRef<{ lat: number; lon: number } | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  // Best-effort location once, so "near me" queries rank by distance.
  // Non-blocking: if denied, search still works without distance.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { coordsRef.current = { lat: pos.coords.latitude, lon: pos.coords.longitude }; },
      () => { /* denied — ignore */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  // Auto-scroll on new messages / typing indicator.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const onFavourite = useCallback(async (id: number) => {
    setMessages((prev) => prev.map((m) => (m.shops
      ? { ...m, shops: m.shops.map((s) => (s.id === id ? { ...s, is_favourite: !s.is_favourite } : s)) }
      : m)));
    try { await toggleFavourite(id); } catch { /* optimistic — leave as toggled */ }
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text }]);
    setDraft('');
    setSending(true);
    try {
      const res = await aiSearch(text, coordsRef.current);
      setMessages((prev) => [...prev, {
        id: nextId.current++,
        role: 'ai',
        text: res.reply,
        shops: res.shops?.length ? res.shops : undefined,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: nextId.current++,
        role: 'ai',
        text: 'Something went wrong. Please try again.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="m-screen">
      <div className="c-thread-head">
        <div className="c-thread-avatar"><Icons.Sparkle size={20} /></div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">AI Assistant</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            {sending ? 'thinking…' : 'Ask me to find a service'}
          </span>
        </div>
      </div>

      <div className="c-thread-scroll" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className="c-ai-turn">
            <div className={`c-bubble ${m.role === 'user' ? 'out' : 'in'}`}>
              <span className="c-bubble-text">{m.text}</span>
            </div>
            {m.shops && m.shops.length > 0 && (
              <div className="c-ai-results">
                {m.shops.map((s) => (
                  <ShopCard key={s.id} shop={s} onOpen={(id) => navigate(`/shop/${id}`)} onFavourite={onFavourite} />
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="c-bubble in"><span className="c-bubble-text">Thinking…</span></div>
        )}
      </div>

      <div className="c-composer">
        <input
          type="text"
          placeholder="Ask me to find a service…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
        />
        <button
          className="c-composer-send"
          aria-label="Send"
          disabled={!draft.trim() || sending}
          onClick={() => void handleSend()}
        >
          <Icons.Send size={18} />
        </button>
      </div>
    </div>
  );
}
