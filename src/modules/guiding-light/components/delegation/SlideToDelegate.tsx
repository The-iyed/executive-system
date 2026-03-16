import { useRef, useState, useCallback } from "react";
import { ChevronsLeft } from "lucide-react";
import { cn } from "@gl/lib/utils";

interface SlideToDelegateProps {
  onComplete: () => void;
}

const THUMB_WIDTH = 56;
const COMPLETION_THRESHOLD = 0.85;

function SlideToDelegate({ onComplete }: SlideToDelegateProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !trackRef.current || isCompleted) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      const trackWidth = trackRect.width - THUMB_WIDTH;

      // RTL: thumb starts on the right, drags toward left
      const pointerFromRight = trackRect.right - e.clientX;
      const offset = Math.max(
        0,
        Math.min(1, (pointerFromRight - THUMB_WIDTH / 2) / trackWidth),
      );

      setDragOffset(offset);
    },
    [isDragging, isCompleted],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);

    if (dragOffset >= COMPLETION_THRESHOLD) {
      setDragOffset(1);
      setIsCompleted(true);
      onComplete();
    } else {
      setDragOffset(0);
    }
  }, [dragOffset, onComplete]);

  const thumbTranslate = trackRef.current
    ? dragOffset *
      (trackRef.current.getBoundingClientRect().width - THUMB_WIDTH)
    : 0;

  return (
    <div
      ref={trackRef}
      className="relative h-12 w-full overflow-hidden rounded-full border border-primary/10 bg-primary/5"
    >
      {/* Background text */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-foreground">
        مرّر لمنح التفويض
      </span>

      {/* Draggable thumb */}
      <div
        className={cn(
          "absolute top-1 right-1 flex h-10 w-25 touch-none items-center justify-center rounded-full text-white select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          !isDragging &&
            !isCompleted &&
            "transition-transform duration-300 ease-out",
        )}
        style={{
          transform: `translateX(-${thumbTranslate}px)`,
          background: "linear-gradient(to left, #048F86, #6DCDCD)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <ChevronsLeft className="size-5" />
      </div>
    </div>
  );
}

export { SlideToDelegate };
