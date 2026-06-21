import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveAvatarSession, SessionEvent } from '@heygen/liveavatar-web-sdk';
import { createAvatarSession, type AvatarSession } from '../lib/avatar';

type Phase = 'connecting' | 'live' | 'mic-denied' | 'error';

/**
 * Pull the SDK session-access token out of whatever the backend broker returns.
 * The exact field is reconciled during the LiveAvatar end-to-end pass; we try
 * the common names so a contract tweak there doesn't require a frontend change.
 */
function tokenFromCreds(creds: AvatarSession): string | undefined {
  const c = creds as Record<string, unknown>;
  const candidate =
    c.session_token ?? c.token ?? c.access_token ?? c.livekit_client_token ?? c.session_id;
  return typeof candidate === 'string' ? candidate : undefined;
}

export default function AvatarCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      // Voice conversation needs the mic — ask up front so a denial is clear.
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) setPhase('mic-denied');
        return;
      }

      try {
        const creds = await createAvatarSession(id!);
        if (cancelled) return;

        const token = tokenFromCreds(creds);
        if (!token) throw new Error('No session token returned.');

        const session = new LiveAvatarSession(token, { voiceChat: true });
        sessionRef.current = session;

        // The avatar video track only exists once the stream is ready — attach
        // then, not before, or the <video> stays black.
        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          if (cancelled) return;
          if (videoRef.current) {
            session.attach(videoRef.current);
            void videoRef.current.play().catch(() => {});
          }
          setPhase('live');
        });
        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          if (!cancelled) navigate(-1);
        });

        await session.start();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start the assistant.');
          setPhase('error');
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      void sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [id]);

  function endCall() {
    void sessionRef.current?.stop();
    sessionRef.current = null;
    navigate(-1);
  }

  return (
    <div className="c-avatar-stage">
      <video ref={videoRef} className="c-avatar-video" autoPlay playsInline />
      {phase === 'connecting' && <div className="c-avatar-status">Connecting…</div>}
      {phase === 'mic-denied' && (
        <div className="c-avatar-status">Microphone access is needed to talk. Enable it and retry.</div>
      )}
      {phase === 'error' && <div className="c-avatar-status">{error || 'Something went wrong.'}</div>}
      <button className="c-avatar-end" onClick={endCall}>End</button>
    </div>
  );
}
