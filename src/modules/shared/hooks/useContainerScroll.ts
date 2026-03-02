import { useEffect, useState } from 'react';

export const useContainerScroll = (
  ref: React.RefObject<HTMLElement>,
  offset: number = 30
) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      setIsScrolled(element.scrollTop > offset);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [ref, offset]);

  return isScrolled;
};