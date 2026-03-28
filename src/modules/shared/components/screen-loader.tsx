import React from 'react';
import { cn } from '@/lib/ui';

interface ScreenLoaderProps {
  message?: string;
  className?: string;
  /** Size multiplier (default 1) */
  size?: number;
}

export const ScreenLoader: React.FC<ScreenLoaderProps> = ({
  message = 'جاري التحميل...',
  className = '',
  size = 1,
}) => {
  return (
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center bg-background z-50',
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo animation container */}
        <div className="relative" style={{ width: 120 * size, height: 120 * size }}>
          {/* Outer rotating ring */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 120 120"
            style={{ animation: 'loader-ring-spin 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          >
            <defs>
              <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#loader-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Inner pulsing circle */}
          <div
            className="absolute inset-0 m-auto rounded-full"
            style={{
              width: '85%',
              height: '85%',
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
              animation: 'loader-pulse 2s ease-in-out infinite',
            }}
          />

          {/* App Logomark — breathe + subtle float */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'loader-float 3s ease-in-out infinite' }}
          >
            <img
              src="/assets/Logomark.png"
              alt="المنصة الموحدة"
              className="drop-shadow-lg"
              style={{
                width: 52 * size,
                height: 52 * size,
                objectFit: 'contain',
                animation: 'loader-breathe 2.4s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Ministry logo — fade-in slide */}
        <div style={{ animation: 'loader-slide-up 0.6s ease-out 0.3s both' }}>
          <img
            src="/assets/ministry.svg"
            alt="الوزارة"
            className="opacity-60"
            style={{
              width: 140 * size,
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5" style={{ animation: 'loader-slide-up 0.6s ease-out 0.5s both' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-full bg-primary/60"
              style={{
                width: 6 * size,
                height: 6 * size,
                animation: `loader-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Message */}
        {message && (
          <p
            className="text-sm text-muted-foreground font-medium"
            style={{
              animation: 'loader-slide-up 0.6s ease-out 0.7s both',
              fontFamily: "'Almarai', sans-serif",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes loader-ring-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loader-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes loader-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes loader-pulse {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes loader-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes loader-slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export const Loader: React.FC<ScreenLoaderProps> = ({
  message = 'جاري التحميل...',
  className = '',
  size = 0.8,
}) => {
  return (
    <div
      className={cn('flex flex-col justify-center w-full h-full items-center gap-4', className)}
      role="status"
      aria-busy="true"
    >
      <div className="relative" style={{ width: 90 * size, height: 90 * size }}>
        {/* Rotating ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 90 90"
          style={{ animation: 'loader-ring-spin 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
        >
          <defs>
            <linearGradient id="loader-gradient-sm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="45" cy="45" r="40" fill="none" stroke="url(#loader-gradient-sm)" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Logo */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: 'loader-breathe 2.4s ease-in-out infinite' }}
        >
          <img
            src="/assets/Logomark.png"
            alt="المنصة الموحدة"
            className="drop-shadow-md"
            style={{ width: 38 * size, height: 38 * size, objectFit: 'contain' }}
          />
        </div>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground font-medium" style={{ fontFamily: "'Almarai', sans-serif" }}>
          {message}
        </p>
      )}

      <style>{`
        @keyframes loader-ring-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loader-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
