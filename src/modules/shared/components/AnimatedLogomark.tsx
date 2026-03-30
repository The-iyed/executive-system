import React from 'react';

/**
 * Animated Logomark – decomposes the platform logo SVG into layers
 * and animates them: grid fades in, circle rings scale up, calendar
 * icon assembles piece by piece, with a gentle float on the whole thing.
 */
export const AnimatedLogomark: React.FC<{ size?: number }> = ({ size = 56 }) => {
  return (
    <div
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes gridFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes ringScale {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.08); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes calSlideDown {
          0% { transform: translateY(-12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes calFadeUp {
          0% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pinPop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { opacity: 0.15; }
          50% { opacity: 0.35; }
          100% { opacity: 0.15; }
        }
        .logo-float { }
        .glass-overlay { animation: shimmer 1.5s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox="0 0 44 44"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-float drop-shadow-lg"
      >
        <defs>
          <linearGradient id="anim-bg-grad" x1="21.6" y1="2.28" x2="21.6" y2="38.74" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#D0D5DD" />
          </linearGradient>
          <clipPath id="anim-clip">
            <rect x="3.42" y="2.28" width="36.46" height="36.46" rx="9.11" />
          </clipPath>
          <filter id="anim-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#101828" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Card background */}
        <g filter="url(#anim-shadow)">
          <g clipPath="url(#anim-clip)">
            <rect x="3.42" y="2.28" width="36.46" height="36.46" rx="9.11" fill="white" />
            <rect x="3.42" y="2.28" width="36.46" height="36.46" rx="9.11" fill="url(#anim-bg-grad)" />

            {/* Grid lines - staggered fade in */}
            <g className="grid-line" style={{ animationDelay: '0.05s' }}>
              <path d="M21.6 2.28H21.69V38.74H21.6V2.28Z" fill="#D0D5DD" />
              <path d="M39.87 20.46V20.55H3.42V20.46H39.87Z" fill="#D0D5DD" />
            </g>
            <g className="grid-line" style={{ animationDelay: '0.12s' }}>
              <path d="M33.72 2.28H33.81V38.74H33.72V2.28Z" fill="#D0D5DD" />
              <path d="M15.54 2.28H15.63V38.74H15.54V2.28Z" fill="#D0D5DD" />
            </g>
            <g className="grid-line" style={{ animationDelay: '0.19s' }}>
              <path d="M27.66 2.28H27.75V38.74H27.66V2.28Z" fill="#D0D5DD" />
              <path d="M9.48 2.28H9.57V38.74H9.48V2.28Z" fill="#D0D5DD" />
            </g>
            <g className="grid-line" style={{ animationDelay: '0.26s' }}>
              <path d="M39.87 32.59V32.67H3.42V32.59H39.87Z" fill="#D0D5DD" />
              <path d="M39.87 14.4V14.49H3.42V14.4H39.87Z" fill="#D0D5DD" />
            </g>
            <g className="grid-line" style={{ animationDelay: '0.33s' }}>
              <path d="M39.87 26.52V26.61H3.42V26.52H39.87Z" fill="#D0D5DD" />
              <path d="M39.87 8.34V8.43H3.42V8.34H39.87Z" fill="#D0D5DD" />
            </g>

            {/* Circle rings */}
            <path className="ring-outer" fillRule="evenodd" clipRule="evenodd" d="M21.65 4.6C12.86 4.6 5.74 11.72 5.74 20.51C5.74 29.29 12.86 36.41 21.65 36.41C30.43 36.41 37.55 29.29 37.55 20.51C37.55 11.72 30.43 4.6 21.65 4.6ZM5.65 20.51C5.65 11.67 12.81 4.51 21.65 4.51C30.48 4.51 37.64 11.67 37.64 20.51C37.64 29.34 30.48 36.5 21.65 36.5C12.81 36.5 5.65 29.34 5.65 20.51Z" fill="#D0D5DD" />
            <path className="ring-mid" fillRule="evenodd" clipRule="evenodd" d="M21.65 16.04C19.18 16.04 17.18 18.04 17.18 20.51C17.18 22.98 19.18 24.98 21.65 24.98C24.11 24.98 26.11 22.98 26.11 20.51C26.11 18.04 24.11 16.04 21.65 16.04ZM17.09 20.51C17.09 17.99 19.13 15.95 21.65 15.95C24.16 15.95 26.2 17.99 26.2 20.51C26.2 23.02 24.16 25.06 21.65 25.06C19.13 25.06 17.09 23.02 17.09 20.51Z" fill="#D0D5DD" />
            <path className="ring-inner" fillRule="evenodd" clipRule="evenodd" d="M21.65 17.45C19.96 17.45 18.59 18.82 18.59 20.51C18.59 22.19 19.96 23.56 21.65 23.56C23.33 23.56 24.7 22.19 24.7 20.51C24.7 18.82 23.33 17.45 21.65 17.45ZM18.5 20.51C18.5 18.77 19.91 17.37 21.65 17.37C23.38 17.37 24.79 18.77 24.79 20.51C24.79 22.24 23.38 23.65 21.65 23.65C19.91 23.65 18.5 22.24 18.5 20.51Z" fill="#D0D5DD" />

            {/* Calendar icon - pins */}
            <g className="cal-pins">
              <path d="M17.7 12.66V9.9C17.7 9.47 17.35 9.11 16.91 9.11C16.48 9.11 16.13 9.47 16.13 9.9V12.66C16.13 13.1 16.48 13.45 16.91 13.45C17.35 13.45 17.7 13.1 17.7 12.66Z" fill="#00A991" />
              <path d="M27.17 12.66V9.9C27.17 9.47 26.81 9.11 26.38 9.11C25.94 9.11 25.59 9.47 25.59 9.9V12.66C25.59 13.1 25.94 13.45 26.38 13.45C26.81 13.45 27.17 13.1 27.17 12.66Z" fill="#00A991" />
            </g>

            {/* Calendar icon - top bar */}
            <path className="cal-top" d="M24.8 12.66V11.48H18.49V12.66C18.49 13.54 17.79 14.24 16.91 14.24C16.04 14.24 15.34 13.54 15.34 12.66V11.48H14.22C13.09 11.48 12.18 12.39 12.18 13.52V16.61H31.11V13.52C31.11 12.39 30.2 11.48 29.08 11.48H27.96V12.66C27.96 13.54 27.25 14.24 26.38 14.24C25.51 14.24 24.8 13.54 24.8 12.66Z" fill="#00A991" />

            {/* Calendar icon - body */}
            <path className="cal-body" d="M31.11 27.59V17.4H12.18V27.59C12.18 28.71 13.09 29.62 14.22 29.62H29.08C30.2 29.62 31.11 28.71 31.11 27.59Z" fill="#00A991" />

            {/* Glass overlay */}
            <path className="glass-overlay" d="M3.42 20.51H39.87V24.15C39.87 29.26 39.87 31.81 38.88 33.76C38.01 35.47 36.61 36.87 34.9 37.74C32.95 38.74 30.4 38.74 25.29 38.74H18C12.9 38.74 10.34 38.74 8.39 37.74C6.68 36.87 5.28 35.47 4.41 33.76C3.42 31.81 3.42 29.26 3.42 24.15V20.51Z" fill="white" fillOpacity="0.2" />
          </g>
          <rect x="3.53" y="2.39" width="36.23" height="36.23" rx="9" stroke="#D0D5DD" strokeWidth="0.23" />
        </g>
      </svg>
    </div>
  );
};
