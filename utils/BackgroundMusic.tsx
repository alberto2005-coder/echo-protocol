import React, {useEffect, useRef, useState} from 'react';

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

  useEffect(() => {
    if (!audioRef.current && url) {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;
    }
  }, [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

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
