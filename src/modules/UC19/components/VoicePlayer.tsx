import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoicePlayerProps {
  url: string;
  compact?: boolean;
}

export function VoicePlayer({ url, compact = false }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onLoaded = () => {
      setDuration(audio.duration);
      setError(false);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onError = () => setError(true);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setError(true));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    // RTL: right edge is 0%
    const clickX = rect.right - e.clientX;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = pct * duration;
  }, [duration]);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Volume2 className="size-3.5" />
        <span>تعذر تشغيل الملاحظة الصوتية</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 w-full">
      <button
        onClick={togglePlay}
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95 ${
          compact ? 'size-7' : 'size-8'
        }`}
      >
        {isPlaying ? (
          <Pause className={compact ? 'size-3' : 'size-3.5'} fill="currentColor" />
        ) : (
          <Play className={compact ? 'size-3' : 'size-3.5'} fill="currentColor" style={{ marginInlineStart: '2px' }} />
        )}
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="flex-1 h-1.5 rounded-full bg-border/60 cursor-pointer overflow-hidden group"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100"
            style={{ width: `${progress}%`, float: 'right' }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8 text-center">
          {isPlaying ? formatTime(currentTime) : formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
