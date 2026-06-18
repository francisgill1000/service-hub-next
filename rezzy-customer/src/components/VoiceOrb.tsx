import { useRef, useState } from 'react';
import { Icons } from './Icons';

const BAR_COUNT = 9;

/**
 * A "speaking" avatar for the AI's voice replies: tap the orb to play, and
 * while it talks it comes alive — glow rings pulse out and an equalizer
 * dances beside it. The animation is CSS-driven (the audio is cross-origin,
 * so the Web Audio analyser can't read it) but reads as voice-reactive.
 */
export function VoiceOrb({ src, letter }: { src: string; letter: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  return (
    <div className={`c-orb ${playing ? 'playing' : ''}`}>
      <button
        type="button"
        className="c-orb-face"
        onClick={toggle}
        aria-label={playing ? 'Pause voice reply' : 'Play voice reply'}
      >
        <span className="c-orb-ring" />
        <span className="c-orb-ring" />
        <span className="c-orb-letter">{letter}</span>
        <span className="c-orb-toggle">{playing ? <Icons.Pause size={16} /> : <Icons.Play size={16} />}</span>
      </button>

      <div className="c-orb-bars" aria-hidden="true">
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span key={i} style={{ ['--i' as string]: String(i) } as React.CSSProperties} />
        ))}
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
