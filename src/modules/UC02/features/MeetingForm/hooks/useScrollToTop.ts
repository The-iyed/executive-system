import { useEffect, useRef, RefObject } from 'react';

export const useScrollToTop = (currentStep: number): RefObject<HTMLDivElement> => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  return scrollContainerRef;
};
