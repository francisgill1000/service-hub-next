import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { pickFemaleVoice } from '@/lib/voice';

/** What the assistant says when there's no reply yet (greeting / verify phase). */
export const AVATAR_STATIC_MESSAGE =
  "Hi! I'm your assistant. I can help you with prices, timings and availability. How can I help today?";

type Props = {
  /** Shop logo to show as the assistant's face. Falls back to a glyph. */
  logo?: string;
  /** Text the assistant speaks. Defaults to the static greeting. */
  message?: string;
  onClose: () => void;
};

const hasBrowserTts = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Branded voice assistant: shows the shop logo (pulsing while it talks) and
 * speaks the message. Primary voice is ElevenLabs via our /tts backend (one
 * consistent female voice); if that fails we fall back to the browser's voice
 * so the assistant still talks.
 */
export default function AvatarSpeakModal({ logo, message = AVATAR_STATIC_MESSAGE, onClose }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function speakViaBrowser() {
    if (!hasBrowserTts()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(message);
    const voice = pickFemaleVoice(synth.getVoices());
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.pitch = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
  }

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    setLoading(true);

    (async () => {
      try {
        const { data } = await api.post('/tts', { text: message }, { responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(data as Blob);
        const audio = new Audio(objectUrl);
        audioRef.current = audio;
        audio.onplay = () => setSpeaking(true);
        audio.onended = () => setSpeaking(false);
        audio.onpause = () => setSpeaking(false);
        setLoading(false);
        // Opening the modal is a user gesture, so playback is normally allowed;
        // if the browser still blocks it, the Replay button is a direct gesture.
        await audio.play().catch(() => {});
      } catch {
        // Backend TTS unavailable (not deployed / error) — use the browser voice.
        if (cancelled) return;
        setLoading(false);
        speakViaBrowser();
      }
    })();

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (hasBrowserTts()) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  function replay() {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } else {
      speakViaBrowser();
    }
  }

  return (
    <div className="c-avatar-modal" role="dialog" aria-label="Assistant">
      <div className={`c-avatar-logo-wrap ${speaking ? 'talking' : ''}`}>
        {logo
          ? <img className="c-avatar-logo" src={logo} alt="" />
          : <span className="c-avatar-logo-fallback" aria-hidden>💬</span>}
      </div>
      <p className="c-avatar-caption">{loading ? 'Connecting…' : message}</p>
      <button className="c-avatar-replay" aria-label="Replay" onClick={replay}>▶ Replay</button>
      <button className="c-avatar-close" aria-label="Close" onClick={onClose}>Close</button>
    </div>
  );
}
