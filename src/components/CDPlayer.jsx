// Music dock: a CD that spins while the track plays, with the elapsed position
// drawn as a ring around it. Separate from the ♪ toggle, which only governs the
// interface blips. Nothing autoplays — browsers block it and it would be rude.
// If the audio file is missing the whole dock hides rather than sitting broken.
import { useEffect, useRef, useState } from 'react';
import { MUSIC } from '../content';

const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R;

export default function CDPlayer() {
  const audioRef = useRef(null);
  const ringRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    const onTime = () => {
      if (!a.duration || !ringRef.current) return;
      const p = Math.min(a.currentTime / a.duration, 1);
      ringRef.current.style.strokeDashoffset = String(RING_C * (1 - p));
    };
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    const onError = () => setMissing(true);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('error', onError);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (a.paused) a.play().catch(() => setMissing(true));
    else a.pause();
  }

  return (
    <div
      className={`cd-dock${playing ? ' cd-dock--on' : ''}${missing ? ' cd-dock--gone' : ''}`}
    >
      <button
        className="cd glass"
        onClick={toggle}
        aria-label={playing ? `pause ${MUSIC.title}` : `play ${MUSIC.title}`}
        data-cursor={playing ? 'pause' : 'play'}
      >
        <svg className="cd-ring" viewBox="0 0 80 80" aria-hidden="true">
          <circle className="cd-ring-track" cx="40" cy="40" r={RING_R} />
          <circle
            ref={ringRef}
            className="cd-ring-fill"
            cx="40"
            cy="40"
            r={RING_R}
            style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C }}
          />
        </svg>
        <span className="cd-disc" aria-hidden="true" />
        <span className="cd-hole" aria-hidden="true" />
      </button>

      <span className="cd-meta">
        <span className="cd-title">{MUSIC.title}</span>
        <span className="cd-artist">{MUSIC.artist}</span>
      </span>

      <audio ref={audioRef} src={MUSIC.src} loop preload="metadata" />
    </div>
  );
}
