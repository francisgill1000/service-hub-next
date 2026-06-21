import { useEffect, useRef, useState } from 'react';

/** Bundled clip of the assistant speaking the static greeting (HeyGen-rendered). */
export const AVATAR_STATIC_CLIP = '/avatar-static.mp4';

type Props = {
  /** Video to play. Defaults to the bundled static greeting clip. */
  src?: string;
  onClose: () => void;
};

/**
 * Plays a pre-rendered avatar clip in a full-screen modal. Phase 1 plays the
 * bundled static greeting; phase 2 will pass a per-reply clip URL via `src`.
 *
 * Opening is a user gesture (the chat header button), so autoplay-with-sound is
 * normally allowed — but if the browser still blocks it we fall back to a
 * tap-to-play overlay rather than playing silently.
 */
export default function AvatarSpeakModal({ src = AVATAR_STATIC_CLIP, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    tryPlay();
  }, [src]);

  function tryPlay() {
    // jsdom returns undefined from play(); real browsers return a promise that
    // rejects when autoplay-with-sound is blocked.
    const p = videoRef.current?.play();
    if (p && typeof p.catch === 'function') p.catch(() => setNeedsTap(true));
  }

  const handleTapPlay = () => {
    setNeedsTap(false);
    tryPlay();
  };

  return (
    <div className="c-avatar-modal" role="dialog" aria-label="Video assistant">
      <video
        ref={videoRef}
        className="c-avatar-video"
        src={src}
        playsInline
        autoPlay
        onError={() => setFailed(true)}
      />
      {failed && <div className="c-avatar-status">Video assistant is unavailable right now.</div>}
      {needsTap && !failed && (
        <button className="c-avatar-tap" aria-label="Play" onClick={handleTapPlay}>▶ Play</button>
      )}
      <button className="c-avatar-close" aria-label="Close" onClick={onClose}>Close</button>
    </div>
  );
}
