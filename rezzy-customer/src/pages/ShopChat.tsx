import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { getChatMessages, sendChatMessage, sendChatVoice } from '@/lib/chat';
import { Icons } from '@/components/Icons';
import { Spinner } from '@/components/Spinner';
import type { ChatMessage } from '@/types';

const POLL_MS = 4000;

function bubbleTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Render message text with URLs (e.g. a Ziina pay link) as tappable links. */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a>
      : part,
  );
}

/** The recorder MIME this browser supports (Chrome: webm, Safari: mp4). */
function pickAudioMime(): string {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const c of cands) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(c)) return c;
  }
  return '';
}

export default function ShopChat() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const shopId = Number(id);
  const stateShopName = (useLocation().state as { shopName?: string } | null)?.shopName;

  const [shopName, setShopName] = useState(stateShopName ?? '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const appendMessages = useCallback((incoming: ChatMessage[]) => {
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

  // initial load: history (+ shop name when not passed via navigation state)
  useEffect(() => {
    if (!shopId) return;
    let alive = true;
    (async () => {
      try {
        const history = await getChatMessages(shopId);
        if (!alive) return;
        appendMessages(history);
      } catch {
        if (alive) setError('Could not load this chat.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    if (!stateShopName) {
      void api.get(`/shops/${shopId}`)
        .then((res) => { if (alive) setShopName((res.data?.data ?? res.data)?.name ?? ''); })
        .catch(() => undefined);
    }
    return () => { alive = false; };
  }, [shopId, stateShopName, appendMessages]);

  // poll for replies
  useEffect(() => {
    if (!shopId) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await getChatMessages(shopId, lastIdRef.current);
        appendMessages(fresh);
      } catch {
        /* transient poll error — next tick retries */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [shopId, appendMessages]);

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
      const sent = await sendChatMessage(shopId, text);
      appendMessages([sent]);
      setDraft('');
    } catch {
      setError('Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (recording || uploading) return;
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickAudioMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        void uploadVoice(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError('Microphone access is needed to record. Please allow it and try again.');
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    recorderRef.current?.stop();
  };

  const uploadVoice = async (blob: Blob) => {
    if (blob.size === 0) return;
    setUploading(true);
    setError('');
    try {
      const sent = await sendChatVoice(shopId, blob);
      appendMessages([sent]);
    } catch {
      setError('Could not send your voice note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const title = shopName || 'Chat';

  return (
    <div className="m-screen c-thread-screen">
      <div className="c-thread-head">
        <button className="c-icon-btn" aria-label="Back" onClick={() => navigate(`/shop/${shopId}`)}>
          <Icons.ChevronLeft size={18} />
        </button>
        <div className="c-thread-avatar">{(Array.from(title)[0] || '?').toUpperCase()}</div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">{title}</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            AI assistant · replies in seconds
          </span>
        </div>
      </div>

      <div className="c-thread-scroll" ref={scrollRef}>
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="c-thread-empty">Say hi! Ask about prices, timings or availability.</p>
        ) : (
          messages.map((m) => {
            // direction is from the shop's side: 'in' = sent by me
            const isAudio = !!m.media_url && (m.type === 'audio' || m.type === 'voice');
            const caption = m.body.replace(/^(🎤|🔊)\s*/u, '').trim();
            return (
              <div key={m.id} className={`c-bubble ${m.direction === 'in' ? 'out' : 'in'}`}>
                {isAudio && <audio controls preload="none" src={m.media_url!} className="c-bubble-audio" />}
                {(!isAudio || (caption && caption !== '…')) && (
                  <span className="c-bubble-text">{linkify(isAudio ? caption : m.body)}</span>
                )}
                <span className="c-bubble-time">{bubbleTime(m.created_at)}</span>
              </div>
            );
          })
        )}
      </div>

      {error && <div className="c-error-box" style={{ margin: '0 16px 8px' }}>{error}</div>}

      <div className="c-composer">
        {recording ? (
          <>
            <span className="c-rec-dot" />
            <span className="c-rec-label">Recording… tap to send</span>
            <button className="c-composer-send" aria-label="Stop and send" onClick={() => stopRecording()}>
              <Icons.Send size={18} />
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder={uploading ? 'Sending voice…' : 'Type a message…'}
              value={draft}
              disabled={uploading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
            />
            {draft.trim() ? (
              <button className="c-composer-send" aria-label="Send" disabled={sending} onClick={() => void handleSend()}>
                <Icons.Send size={18} />
              </button>
            ) : (
              <button className="c-composer-send" aria-label="Record voice" disabled={uploading} onClick={() => void startRecording()}>
                {uploading ? <span className="c-mini-spin" /> : <Icons.Mic size={18} />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
