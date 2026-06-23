import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiSearch, type AiCategory } from '@/lib/ai';
import { toggleFavourite } from '@/lib/shops';
import { Icons } from '@/components/Icons';
import { ShopCard } from '@/components/ShopCard';
import { VoiceMic, type MicState } from '@/components/VoiceMic';
import type { Shop } from '@/types';

type AiMsg = {
  id: number;
  role: 'user' | 'ai';
  text: string;
  shops?: Shop[];
  categories?: AiCategory[];
};

/** Browser speech-to-text (Chrome/Edge/Safari). Undefined where unsupported. */
function getSpeechRecognition(): (new () => any) | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
}

export default function AI() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [typing, setTyping] = useState(false);

  const coordsRef = useRef<{ lat: number; lon: number } | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef('');
  const speechSupported = useRef(!!getSpeechRecognition());

  // Best-effort location once, so "near me" queries rank by distance.
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

  // Stop recognition if we navigate away mid-listen.
  useEffect(() => () => { recognitionRef.current?.abort?.(); }, []);

  const onFavourite = useCallback(async (id: number) => {
    setMessages((prev) => prev.map((m) => (m.shops
      ? { ...m, shops: m.shops.map((s) => (s.id === id ? { ...s, is_favourite: !s.is_favourite } : s)) }
      : m)));
    try { await toggleFavourite(id); } catch { /* optimistic — leave as toggled */ }
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: trimmed }]);
    setDraft('');
    setSending(true);
    try {
      const res = await aiSearch(trimmed, coordsRef.current);
      setMessages((prev) => [...prev, {
        id: nextId.current++,
        role: 'ai',
        text: res.reply,
        shops: res.shops?.length ? res.shops : undefined,
        categories: res.categories?.length ? res.categories : undefined,
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
  }, [sending]);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR || sending) { if (!SR) setTyping(true); return; }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    finalRef.current = '';
    setHeard('');

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t;
        else interim += t;
      }
      setHeard((finalRef.current + ' ' + interim).trim());
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') setTyping(true);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      const text = finalRef.current.trim();
      setHeard('');
      if (text) void send(text);
    };

    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }, [sending, send]);

  const toggleListen = useCallback(() => {
    if (!speechSupported.current) { setTyping(true); return; }
    if (listening) recognitionRef.current?.stop();
    else startListening();
  }, [listening, startListening]);

  const micState: MicState = sending ? 'thinking' : listening ? 'listening' : 'idle';
  const statusText = !speechSupported.current
    ? 'Voice isn’t supported here — tap "Type instead".'
    : sending ? 'Thinking…'
      : listening ? (heard || 'Listening…')
        : 'Tap the mic and ask for a service';

  return (
    <div className="m-screen ai-screen">
      <div className="c-thread-head">
        <div className="c-thread-avatar"><Icons.Sparkle size={20} /></div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">AI Assistant</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            {sending ? 'thinking…' : listening ? 'listening…' : 'Voice service finder'}
          </span>
        </div>
      </div>

      <div className="c-thread-scroll" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className="c-ai-turn">
            <div className={`c-bubble ${m.role === 'user' ? 'out' : 'in'}`}>
              <span className="c-bubble-text">{m.text}</span>
            </div>
            {m.categories && m.categories.length > 0 && (
              <div className="c-ai-chips">
                {m.categories.map((c) => (
                  <button key={c.id} type="button" className="c-ai-chip" disabled={sending} onClick={() => void send(c.name)}>
                    {c.name} <span className="c-ai-chip-count">{c.count}</span>
                  </button>
                ))}
              </div>
            )}
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

      {typing ? (
        <div className="c-composer">
          <button className="c-composer-mic" aria-label="Use voice" onClick={() => setTyping(false)}>
            <Icons.Mic size={18} />
          </button>
          <input
            type="text"
            placeholder="Ask me to find a service…"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send(draft); }}
          />
          <button className="c-composer-send" aria-label="Send" disabled={!draft.trim() || sending} onClick={() => void send(draft)}>
            <Icons.Send size={18} />
          </button>
        </div>
      ) : (
        <div className="c-voice-dock">
          <div className={`c-voice-status ${listening && heard ? 'heard' : ''}`}>{statusText}</div>
          <VoiceMic state={micState} onClick={toggleListen} />
          <button className="c-voice-toggle" onClick={() => setTyping(true)}>Type instead</button>
        </div>
      )}
    </div>
  );
}
