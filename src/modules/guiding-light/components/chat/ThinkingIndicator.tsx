import { useEffect, useRef, useState, useMemo } from "react";

interface ThinkingIndicatorProps {
  thinkingText: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

function processThinkingText(raw: string): string {
  if (!raw?.trim()) return "";
  let text = raw.trim();
  text = text.replace(/\[AGENTS\][\s\S]*?\[AGENTS\/?\]/gi, "");
  text = text.replace(/\[QUESTIONS\][\s\S]*?\[QUESTIONS\/?\]/gi, "");
  text = text.replace(/\[AGENTS\][\s\S]*/gi, "");
  text = text.replace(/\[QUESTIONS\][\s\S]*/gi, "");
  text = text.replace(/\[\/?(QUESTIONS|AGENTS|thinking|TOOLS|SEARCH|ACTION)\/?\]/gi, "");
  text = text.replace(/[a-zA-Z_]+\|/g, "\n");
  text = text.replace(/\|/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractSteps(text: string): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 3 && l.length < 200);
}

function ThinkingIndicator({ thinkingText, isCompleted = false, isActive = false }: ThinkingIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const lastTextLengthRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  const processedText = useMemo(() => processThinkingText(thinkingText), [thinkingText]);
  const steps = useMemo(() => extractSteps(processedText), [processedText]);
  const isStreaming = isActive && !isCompleted;
  const shouldShow = !!processedText || isStreaming;

  // Timer
  useEffect(() => {
    if (!isStreaming) return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !thinkingText || isCompleted) return;
    const hasNew = thinkingText.length > lastTextLengthRef.current;
    lastTextLengthRef.current = thinkingText.length;
    if (hasNew) requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight; });
  }, [thinkingText, isCompleted]);

  // Collapse when done
  useEffect(() => {
    if (!isActive && isCompleted) setExpanded(false);
  }, [isActive, isCompleted]);

  if (!shouldShow) return null;

  const formatTime = (s: number) => `${s}ث`;

  return (
    <div className="w-full" dir="rtl">
      {/* Clickable header row */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 w-full text-right group py-1"
      >
        {/* Animated indicator */}
        {isStreaming ? (
          <div className="thinking-bars">
            <span /><span /><span />
          </div>
        ) : (
          <svg className="size-4 text-muted-foreground/30" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="3" />
          </svg>
        )}

        <span className={`text-[13px] font-medium ${isStreaming ? "text-foreground/70" : "text-muted-foreground/40"}`}>
          {isStreaming ? "يفكّر" : "فكّر"}
        </span>

        {isStreaming && (
          <span className="text-[11px] text-muted-foreground/30 tabular-nums">{formatTime(elapsed)}</span>
        )}

        {!isStreaming && (
          <svg className={`size-3 text-muted-foreground/25 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        )}
      </button>

      {/* Expandable content */}
      {expanded && steps.length > 0 && (
        <div className="mr-6 mt-0.5 relative">
          <div
            ref={containerRef}
            className="max-h-44 overflow-y-auto scrollbar-hide thinking-steps-container"
          >
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              return (
                <p
                  key={i}
                  className={`text-[12.5px] leading-[1.7] py-[1px] transition-colors duration-300 ${
                    isStreaming && isLast
                      ? "text-muted-foreground/55"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {step}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { ThinkingIndicator };
