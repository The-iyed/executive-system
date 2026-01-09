import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when navigating to a new page
    const scrollContainer = containerRef.current?.closest('.overflow-y-auto') as HTMLElement;
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }

    // Skip animation on initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      className={`page-transition ${isAnimating ? 'page-transition-fadeIn' : ''}`}
    >
      {children}
      <style>{`
        .page-transition {
          width: 100%;
          height: 100%;
        }
        
        .page-transition-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
