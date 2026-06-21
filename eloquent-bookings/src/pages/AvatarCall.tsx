import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveAvatarSession, SessionEvent } from '@heygen/liveavatar-web-sdk';
import { createAvatarSession, tokenFromCreds } from '../lib/avatar';

type Phase = 'connecting' | 'live' | 'mic-denied' | 'error';

export default function AvatarCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [error, setError] = useState<string>('');
  const leftRef = useRef(false);
  const phaseRef = useRef<Phase>('connecting');

  // Leave to the shop page deterministically (navigate(-1) bounced to Home on a
  // hard refresh, where there was no in-app history). Guard against double-fire.
  function leave() {
    if (leftRef.current) return;
    leftRef.current = true;
    void sessionRef.current?.stop();
    sessionRef.current = null;
    navigate(`/shop/${id}`);
  }

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
          phaseRef.current = 'live';
          setPhase('live');
        });
        // Only treat a disconnect as "call over" once we were actually live, so
        // connection churn during setup doesn't bounce the user off the page.
        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          if (!cancelled && phaseRef.current === 'live') leave();
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

  return (
    <div className="c-avatar-stage">
      <video ref={videoRef} className="c-avatar-video" autoPlay playsInline />
      {phase === 'connecting' && <div className="c-avatar-status">Connecting…</div>}
      {phase === 'mic-denied' && (
        <div className="c-avatar-status">Microphone access is needed to talk. Enable it and retry.</div>
      )}
      {phase === 'error' && <div className="c-avatar-status">{error || 'Something went wrong.'}</div>}
      <button className="c-avatar-end" onClick={leave}>End</button>
    </div>
  );
}
