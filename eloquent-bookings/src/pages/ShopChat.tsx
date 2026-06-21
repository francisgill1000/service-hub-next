import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { getChatMessages, sendChatMessage, sendChatVoice } from '@/lib/chat';
import { linkify } from '@/lib/linkify';
import { Icons } from '@/components/Icons';
import { Spinner } from '@/components/Spinner';
import { VoiceMessage } from '@/components/VoiceMessage';
import { AiCoreOrb, type OrbState } from '@/components/AiCoreOrb';
import AvatarSpeakModal from '@/components/AvatarSpeakModal';
import type { ChatMessage } from '@/types';

const POLL_MS = 4000;

function bubbleTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  const navState = useLocation().state as { shopName?: string; shopLogo?: string } | null;
  const stateShopName = navState?.shopName;

  const [shopName, setShopName] = useState(stateShopName ?? '');
  const [shopLogo, setShopLogo] = useState(navState?.shopLogo ?? '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const lastIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const outCountRef = useRef(0);

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
    // Fetch the shop when name or logo wasn't handed over via navigation state
    // (e.g. a direct link), so the assistant modal can show the shop's logo.
    if (!stateShopName || !navState?.shopLogo) {
      void api.get(`/shops/${shopId}`)
        .then((res) => {
          if (!alive) return;
          const shop = res.data?.data ?? res.data;
          if (!stateShopName) setShopName(shop?.name ?? '');
          if (!navState?.shopLogo) setShopLogo(shop?.logo ?? '');
        })
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

  // The orb is "thinking" from when I send until the AI's next reply lands.
  useEffect(() => {
    const outCount = messages.reduce((n, m) => (m.direction === 'out' ? n + 1 : n), 0);
    if (outCount > outCountRef.current) setAwaitingReply(false);
    outCountRef.current = outCount;
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendChatMessage(shopId, text);
      appendMessages([sent]);
      setDraft('');
      setAwaitingReply(true);
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
      setAwaitingReply(true);
    } catch {
      setError('Could not send your voice note. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Phase 2: the assistant speaks the most recent reply ('out' = AI/salon side),
  // falling back to the greeting when there's none yet. Strip any leading emoji
  // (voice replies are prefixed with 🔊) so it isn't read aloud.
  const latestReply = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.direction === 'out' && m.body) {
        return m.body.replace(/^[^\p{L}\d]+/u, '').trim() || undefined;
      }
    }
    return undefined;
  }, [messages]);

  const title = shopName || 'Chat';
  const monogram = (Array.from(title)[0] || '?').toUpperCase();
  const orbState: OrbState =
    recording ? 'listening'
      : speaking ? 'talking'
        : (awaitingReply || uploading) ? 'thinking'
          : 'idle';
  const statusText =
    orbState === 'listening' ? 'listening…'
      : orbState === 'thinking' ? 'thinking…'
        : orbState === 'talking' ? 'replying…'
          : 'AI assistant · online';

  return (
    <div className="m-screen c-thread-screen">
      <div className="c-thread-head">
        <button className="c-icon-btn" aria-label="Back" onClick={() => navigate(`/shop/${shopId}`)}>
          <Icons.ChevronLeft size={18} />
        </button>
        <div className="c-thread-avatar">{monogram}</div>
        <div className="c-thread-head-text">
          <span className="c-thread-title">{title}</span>
          <span className="c-thread-sub">
            <span className="c-live-dot" />
            {statusText}
          </span>
        </div>
        <button
          className="c-icon-btn"
          style={{ marginLeft: 'auto' }}
          aria-label="Assistant"
          onClick={() => setAvatarOpen(true)}
        >
          <Icons.Video size={18} />
        </button>
      </div>

      <div className="c-core-hero">
        <AiCoreOrb state={orbState} letter={monogram} imageSrc="/influencer-orb.png" />
        <span className="c-core-sub">Ask about prices, timings or availability</span>
      </div>

      <div className="c-thread-scroll" ref={scrollRef}>
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="c-thread-empty">Say hi! Ask about prices, timings or availability.</p>
        ) : (
          messages.map((m) => {
            // direction is from the shop's side: 'in' = sent by me (customer),
            // 'out' = the AI/salon. Audio messages render the voice player.
            const isAudio = !!m.media_url && (m.type === 'audio' || m.type === 'voice');
            const isBot = m.direction === 'out';
            return (
              <div key={m.id} className={`c-bubble ${isBot ? 'in' : 'out'}`}>
                {isAudio ? (
                  <VoiceMessage src={m.media_url!} onSpeakingChange={isBot ? setSpeaking : undefined} />
                ) : (
                  <span className="c-bubble-text">{linkify(m.body)}</span>
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

      {avatarOpen && (
        <AvatarSpeakModal logo={shopLogo} message={latestReply} onClose={() => setAvatarOpen(false)} />
      )}
    </div>
  );
}
