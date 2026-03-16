import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@gl/lib/utils";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

export interface TourStep {
  /** CSS selector or data-tour attribute value to target */
  target: string;
  title: string;
  description: string;
  /** Tooltip placement relative to the element */
  placement?: "top" | "bottom" | "left" | "right";
}

interface SpotlightTourProps {
  tourId: string;
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

function getStorageKey(tourId: string) {
  return `tour-completed-${tourId}`;
}

export function useProductTour(tourId: string, autoShow = true) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!autoShow) return;
    const seen = localStorage.getItem(getStorageKey(tourId));
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [tourId, autoShow]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(getStorageKey(tourId), "true");
  }, [tourId]);

  return { isOpen, open, close };
}

const PADDING = 8;
const TOOLTIP_GAP = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getElementRect(step: TourStep): Rect | null {
  // Try data-tour attribute first, then CSS selector
  let el = document.querySelector(`[data-tour="${step.target}"]`);
  if (!el) el = document.querySelector(step.target);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
  };
}

function getTooltipPosition(
  rect: Rect,
  placement: TourStep["placement"] = "bottom",
  tooltipWidth: number,
  tooltipHeight: number
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = rect.top - tooltipHeight - TOOLTIP_GAP - PADDING;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = rect.top + rect.height + TOOLTIP_GAP + PADDING;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - TOOLTIP_GAP - PADDING;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left + rect.width + TOOLTIP_GAP + PADDING;
      break;
  }

  // Clamp within viewport
  if (left < 12) left = 12;
  if (left + tooltipWidth > vw - 12) left = vw - tooltipWidth - 12;
  if (top < 12) top = rect.top + rect.height + TOOLTIP_GAP + PADDING;
  if (top + tooltipHeight > vh + window.scrollY - 12) {
    top = rect.top - tooltipHeight - TOOLTIP_GAP - PADDING;
  }

  return { top, left };
}

function SpotlightTour({ tourId, steps, isOpen, onClose }: SpotlightTourProps) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrent(0);
      setVisible(false);
      setTimeout(() => setVisible(true), 100);
    }
  }, [isOpen]);

  // Compute target rect
  useEffect(() => {
    if (!isOpen || !step) return;

    setAnimating(true);
    setVisible(false);

    const update = () => {
      const r = getElementRect(step);
      setRect(r);

      if (r) {
        const el = document.querySelector(`[data-tour="${step.target}"]`) ?? document.querySelector(step.target);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Fade in tooltip after position settles
      setTimeout(() => {
        setVisible(true);
        setAnimating(false);
      }, 250);
    };

    const timer = setTimeout(update, 100);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, step, current]);

  // Position tooltip after rect updates
  useEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const pos = getTooltipPosition(rect, step?.placement ?? "bottom", tt.width, tt.height);
    setTooltipPos(pos);
  }, [rect, step]);

  const next = () => {
    if (isLast) onClose();
    else setCurrent((c) => c + 1);
  };

  const prev = () => {
    if (!isFirst) setCurrent((c) => c - 1);
  };

  if (!isOpen || !step) return null;

  const spotlightStyle = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: "auto" }}>
      {/* Dark overlay with hole */}
      <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 1 }}>
        <defs>
          <mask id={`tour-mask-${tourId}`}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightStyle && (
              <rect
                x={spotlightStyle.left}
                y={spotlightStyle.top}
                width={spotlightStyle.width}
                height={spotlightStyle.height}
                rx="12"
                fill="black"
                style={{ transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask={`url(#tour-mask-${tourId})`}
          onClick={onClose}
          style={{ transition: "opacity 0.3s ease" }}
        />
      </svg>

      {/* Spotlight ring */}
      {spotlightStyle && (
        <div
          className="absolute rounded-xl border-2 border-primary shadow-[0_0_0_4px_rgba(58,168,124,0.15)]"
          style={{
            zIndex: 2,
            top: spotlightStyle.top,
            left: spotlightStyle.left,
            width: spotlightStyle.width,
            height: spotlightStyle.height,
            pointerEvents: "none",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        dir="rtl"
        className="absolute z-[3] w-[340px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          pointerEvents: "auto",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
          transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, hsl(var(--primary)) ${((current + 1) / steps.length) * 100}%, hsl(var(--border)) ${((current + 1) / steps.length) * 100}%)`,
            transition: "background 0.4s ease",
          }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute left-3 top-4 rounded-full p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-200"
        >
          <X className="size-3.5" />
        </button>

        <div className="px-5 pt-5 pb-4 space-y-3">
          {/* Step badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-6 rounded-lg bg-primary/10">
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-primary/80 uppercase">
              الخطوة {current + 1} من {steps.length}
            </span>
          </div>

          <h4 className="text-[15px] font-bold text-foreground leading-snug">
            {step.title}
          </h4>
          <p className="text-[12.5px] text-muted-foreground leading-[1.7]">
            {step.description}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-border/50" />

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full",
                  i === current
                    ? "w-6 h-[5px] bg-primary"
                    : i < current
                    ? "size-[5px] bg-primary/50"
                    : "size-[5px] bg-border"
                )}
                style={{ transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-muted-foreground border border-border/60 hover:bg-muted/50 hover:text-foreground transition-all duration-200"
              >
                <ChevronRight className="size-3" />
                السابق
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm"
            >
              {isLast ? "إنهاء الجولة ✓" : "التالي"}
              {!isLast && <ChevronLeft className="size-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { SpotlightTour, SpotlightTour as ProductTour };
