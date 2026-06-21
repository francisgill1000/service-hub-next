import { useEffect, useState } from 'react';

/** What the assistant says in the verification phase. Phase 2 passes a reply. */
export const AVATAR_STATIC_MESSAGE =
  "Hi! I'm your assistant. I can help you with prices, timings and availability. How can I help today?";

type Props = {
  /** Shop logo to show as the assistant's face. Falls back to a glyph. */
  logo?: string;
  /** Text the assistant speaks. Defaults to the static greeting. */
  message?: string;
  onClose: () => void;
};

const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Branded voice assistant: shows the shop logo (pulsing while it talks) and
 * speaks the message via the browser's Web Speech API — no avatar face, no
 * video, no per-shop render. Phase 2 will pass real reply text as `message`.
 */
export default function AvatarSpeakModal({ logo, message = AVATAR_STATIC_MESSAGE, onClose }: Props) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (!canSpeak()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(message);
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  useEffect(() => {
    speak();
    return () => { if (canSpeak()) window.speechSynthesis.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  return (
    <div className="c-avatar-modal" role="dialog" aria-label="Assistant">
      <div className={`c-avatar-logo-wrap ${speaking ? 'talking' : ''}`}>
        {logo
          ? <img className="c-avatar-logo" src={logo} alt="" />
          : <span className="c-avatar-logo-fallback" aria-hidden>💬</span>}
      </div>
      <p className="c-avatar-caption">{message}</p>
      <button className="c-avatar-replay" aria-label="Replay" onClick={speak}>▶ Replay</button>
      <button className="c-avatar-close" aria-label="Close" onClick={onClose}>Close</button>
    </div>
  );
}
