import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Progress } from './progress';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/ui/lib/utils';

export interface AudioPlayerProps {
  src: string;
  className?: string;
  onError?: (error: Error) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  className,
  onError,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    // Create audio element programmatically
    const audio = new Audio();
    audio.preload = 'auto';
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      const errorMsg = audio.error
        ? `Audio error: ${audio.error.code} - ${audio.error.message}`
        : 'Failed to load audio';
      setError(errorMsg);
      setIsLoading(false);
      if (onError) {
        onError(new Error(errorMsg));
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Set source
    audio.src = src;
    audio.load();

    audioRef.current = audio;

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, [src, onError]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        setError(`Playback error: ${err.message}`);
        setIsPlaying(false);
        if (onError) {
          onError(err);
        }
      });
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 p-2 text-sm text-red-600', className)}>
        <Volume2 className="w-4 h-4" />
        <span>Audio playback unavailable</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 w-full', className)}>
      {/* Play/Pause Button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={isLoading || !duration}
        className="h-8 w-8 flex-shrink-0"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {/* Progress Bar and Time */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Progress value={progress} className="h-1.5 flex-1" />
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0" dir="ltr">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

