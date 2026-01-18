import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook for handling infinite scroll pagination
 * 
 * @param onLoadMore - Callback when user scrolls near bottom
 * @param hasMore - Whether there are more items to load
 * @param loading - Whether a request is in progress
 * @param threshold - Distance from bottom to trigger load (px)
 * @returns Ref to attach to scrollable container
 */
export function useInfinitePagination(
  onLoadMore: () => void,
  hasMore: boolean,
  loading: boolean,
  threshold: number = 100
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);

  // Find the actual scrollable element (might be nested)
  const findScrollableElement = useCallback((element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;

    // Check if element itself is scrollable
    const style = window.getComputedStyle(element);
    const isScrollable = 
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight;

    if (isScrollable) {
      return element;
    }

    // Look for nested scrollable elements (cmdk-list, etc.)
    const scrollableChildren = element.querySelectorAll('[cmdk-list], [data-radix-scroll-area-viewport]');
    for (const child of Array.from(scrollableChildren)) {
      if (child instanceof HTMLElement) {
        const childStyle = window.getComputedStyle(child);
        if (
          (childStyle.overflowY === 'auto' || childStyle.overflowY === 'scroll') &&
          child.scrollHeight > child.clientHeight
        ) {
          return child;
        }
      }
    }

    // Fallback: return element itself
    return element;
  }, []);

  const handleScroll = useCallback(() => {
    if (loading || isLoadingRef.current || !hasMore) {
      return;
    }

    const scrollableElement = findScrollableElement(containerRef.current);
    if (!scrollableElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollableElement;

    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    // Trigger load when within threshold
    if (distanceFromBottom <= threshold) {
      isLoadingRef.current = true;
      onLoadMore();
      // Reset flag after a short delay to prevent rapid firing
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  }, [onLoadMore, hasMore, loading, threshold, findScrollableElement]);

  // Set up scroll listener
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let scrollableElement: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const setupListener = () => {
      scrollableElement = findScrollableElement(element);
      if (scrollableElement) {
        scrollableElement.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        // Retry if element not found yet
        timeoutId = setTimeout(setupListener, 50);
      }
    };

    // Delay to ensure DOM is ready
    timeoutId = setTimeout(setupListener, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollableElement) {
        scrollableElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, findScrollableElement]);

  // Note: Intersection Observer approach removed in favor of scroll listener
  // which is more reliable for this use case

  return containerRef;
}
