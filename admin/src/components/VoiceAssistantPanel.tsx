import { useRef, useState } from 'react';
import { Icons } from '@/components/Icons';
import { postText, postVoice, type AssistantTurn } from '@/lib/assistant';
import { useRecorder } from '@/hooks/useRecorder';

export function VoiceAssistantPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<AssistantTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const { recording, start, stop, supported } = useRecorder();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playReply(url: string | null) {
    if (!url) return;
    const a = audioRef.current ?? new Audio();
    audioRef.current = a;
    a.src = url;
    void a.play().catch(() => undefined);
  }

  async function send(text: string) {
    if (!text.trim()) return;
    setBusy(true); setError('');
    const userTurn: AssistantTurn = { role: 'user', content: text };
    setHistory((h) => [...h, userTurn]);
    try {
      const res = await postText(text, history);
      const next = res.history.length > 0
        ? res.history
        : [...history, userTurn, { role: 'assistant' as const, content: res.reply_text }];
      setHistory(next);
      playReply(res.reply_audio_url);
    } catch { setError('Could not reach the assistant.'); }
    finally { setBusy(false); setDraft(''); }
  }

  async function toggleMic() {
    if (recording) {
      setBusy(true);
      const blob = await stop();
      if (!blob) { setBusy(false); return; }
      const userTurn: AssistantTurn = { role: 'user', content: '🎤 …' };
      setHistory((h) => [...h, userTurn]);
      try {
        const res = await postVoice(blob, history);
        const next = res.history.length > 0
          ? res.history
          : [...history, userTurn, { role: 'assistant' as const, content: res.reply_text }];
        setHistory(next);
        playReply(res.reply_audio_url);
      } catch { setError('Could not reach the assistant.'); }
      finally { setBusy(false); }
    } else {
      setError('');
      try { await start(); } catch { setError('Microphone permission needed.'); }
    }
  }

  return (
    <div className="va-overlay" role="dialog" aria-label="Voice assistant">
      <div className="va-panel">
        <div className="va-head">
          <span className="va-title">Ask about your business</span>
          <button className="c-icon-btn" aria-label="Close" onClick={onClose}><Icons.ChevronLeft size={18} /></button>
        </div>

        <div className="va-thread">
          {history.length === 0 && <p className="va-hint">Tap the mic and ask, e.g. "How much did I make this month?"</p>}
          {history.map((m, i) => (
            <div key={i} className={`va-bubble ${m.role === 'user' ? 'va-user' : 'va-ai'}`}>{m.content}</div>
          ))}
          {error && <div className="c-error-box">{error}</div>}
        </div>

        <div className="va-controls">
          <input className="va-input" placeholder="Type a question…" value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send(draft); }} disabled={busy} />
          <button className="c-btn" aria-label="Send" disabled={busy || !draft.trim()} onClick={() => void send(draft)}>
            <Icons.Send size={16} />
          </button>
          {supported && (
            <button className={`va-mic ${recording ? 'recording' : ''}`} aria-label="Microphone" disabled={busy && !recording} onClick={() => void toggleMic()}>
              <Icons.Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
