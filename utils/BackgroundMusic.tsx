import React, {useEffect, useRef} from 'react';

export interface BackgroundMusicProps {
  readonly url: string;
  readonly isPlaying: boolean;
  readonly isMuted?: boolean;
  readonly volume?: number;
}

export function BackgroundMusic({
  url,
  isPlaying,
  isMuted = false,
  volume = 0.25,
}: BackgroundMusicProps): React.ReactElement | null {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const failedRef = useRef(false);

  useEffect(() => {
    if (audioRef.current || !url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;

    // La pista se sirve desde la red: si no se puede descargar (sin conexión,
    // bucket caído, bloqueador) el juego sigue funcionando en silencio en
    // lugar de reintentar en bucle (BUG-016).
    audio.addEventListener('error', () => {
      if (failedRef.current) return;
      failedRef.current = true;
      console.warn(
        `[BackgroundMusic] No se pudo cargar la pista "${url}". El juego continúa sin música.`,
      );
    });

    audioRef.current = audio;
  }, [url, isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || failedRef.current) return;

    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, volume]);

  return null;
}

export default BackgroundMusic;
