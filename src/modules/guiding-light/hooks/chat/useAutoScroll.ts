import { useRef, useEffect, useCallback, useState } from "react";

interface UseAutoScrollOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  isStreaming?: boolean;
  messageCount?: number;
  threshold?: number;
  scrollThreshold?: number;
  onScrollRequest?: (shouldScroll: boolean) => void;
}

export function useAutoScroll({
  containerRef,
  isStreaming = false,
  messageCount = 0,
  threshold = 50,
  scrollThreshold = 20,
  onScrollRequest,
}: UseAutoScrollOptions) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const lastScrollTopRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTimeRef = useRef(0);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom <= threshold || Math.abs(distanceFromBottom) < 1;
  }, [containerRef, threshold]);

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const container = containerRef.current;
      if (!container) return;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
        setShouldAutoScroll(true);
        isUserScrollingRef.current = false;
      } else {
        container.scrollTop = container.scrollHeight;
        setIsAtBottom(checkIfAtBottom());
        setShouldAutoScroll(true);
        isUserScrollingRef.current = false;
      }
    },
    [containerRef, checkIfAtBottom]
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const currentScrollTop = container.scrollTop;
    const wasAtBottom = checkIfAtBottom();
    const previousScrollTop = lastScrollTopRef.current;
    const scrolledUp = currentScrollTop < previousScrollTop;
    const scrollDelta = Math.abs(currentScrollTop - previousScrollTop);
    setIsAtBottom(wasAtBottom);
    if (scrolledUp && scrollDelta > scrollThreshold) {
      isUserScrollingRef.current = true;
      setShouldAutoScroll(false);
    }
    if (wasAtBottom) {
      isUserScrollingRef.current = false;
      setShouldAutoScroll(true);
    }
    lastScrollTopRef.current = currentScrollTop;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const finalAtBottom = checkIfAtBottom();
      setIsAtBottom(finalAtBottom);
      if (finalAtBottom) {
        isUserScrollingRef.current = false;
        setShouldAutoScroll(true);
      }
    }, 100);
  }, [checkIfAtBottom, scrollThreshold, containerRef]);

  const smoothScrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container || !shouldAutoScroll || !isAtBottom) return;
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTimeRef.current;
    const scrollThrottleDelay = isStreaming ? 100 : 0;
    if (scrollThrottleRef.current) {
      clearTimeout(scrollThrottleRef.current);
      scrollThrottleRef.current = null;
    }
    const performScroll = () => {
      if (!containerRef.current) return;
      if (isStreaming && timeSinceLastScroll < scrollThrottleDelay) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      lastScrollTimeRef.current = Date.now();
    };
    if (timeSinceLastScroll >= scrollThrottleDelay) {
      requestAnimationFrame(performScroll);
    } else {
      scrollThrottleRef.current = setTimeout(
        () => requestAnimationFrame(performScroll),
        scrollThrottleDelay - timeSinceLastScroll
      );
    }
  }, [isStreaming, containerRef, shouldAutoScroll, isAtBottom]);

  useEffect(() => {
    if (!shouldAutoScroll || !isAtBottom || isUserScrollingRef.current) {
      onScrollRequest?.(false);
      return;
    }
    onScrollRequest?.(true);
    smoothScrollToBottom();
  }, [
    isStreaming,
    messageCount,
    shouldAutoScroll,
    isAtBottom,
    onScrollRequest,
    smoothScrollToBottom,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    lastScrollTopRef.current = container.scrollTop;
    setTimeout(() => setIsAtBottom(checkIfAtBottom()), 0);
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
    };
  }, [handleScroll, checkIfAtBottom, containerRef]);

  return { isAtBottom, shouldAutoScroll, scrollToBottom, checkIfAtBottom };
}
