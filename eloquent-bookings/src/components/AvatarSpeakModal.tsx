import { useEffect, useRef, useState } from 'react';
import { LiveAvatarSession, SessionEvent } from '@heygen/liveavatar-web-sdk';
import { createAvatarSession, tokenFromCreds } from '@/lib/avatar';

export const AVATAR_STATIC_MESSAGE =
  "Hi! I'm your assistant. I can help you with prices, timings and availability. How can I help today?";

type Phase = 'connecting' | 'live' | 'error';

type Props = {
  shopId: string | number;
  message?: string;
  onClose: () => void;
};

/**
 * Avatar that SPEAKS a line of text (no microphone). Verification phase uses a
 * static message; phase 2 passes the real chat reply via `message`. Uses the
 * SDK's repeat() — which speaks literal text — not message(), which would route
 * to the AI brain.
 */
export default function AvatarSpeakModal({ shopId, message, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const line = message ?? AVATAR_STATIC_MESSAGE;

    async function start() {
      try {
        const creds = await createAvatarSession(shopId);
        if (cancelled) return;

        const token = tokenFromCreds(creds);
        if (!token) throw new Error('No session token returned.');

        // No mic: voiceChat:false, so the SDK won't request getUserMedia.
        const session = new LiveAvatarSession(token, { voiceChat: false });
        sessionRef.current = session;

        // The video track only exists once the stream is ready — attach then,
        // not before, or the <video> stays black. Speak once we're live.
        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          if (cancelled) return;
          if (videoRef.current) {
            session.attach(videoRef.current);
            void videoRef.current.play().catch(() => {});
          }
          setPhase('live');
          session.repeat(line);
        });

        await session.start();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start the assistant.');
          setPhase('error');
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      void sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [shopId, message]);

  return (
    <div className="c-avatar-modal" role="dialog" aria-label="Video assistant">
      <video ref={videoRef} className="c-avatar-video" autoPlay playsInline />
      {phase === 'connecting' && <div className="c-avatar-status">Connecting…</div>}
      {phase === 'error' && <div className="c-avatar-status">{error || 'Something went wrong.'}</div>}
      <button className="c-avatar-close" aria-label="Close" onClick={onClose}>Close</button>
    </div>
  );
}
