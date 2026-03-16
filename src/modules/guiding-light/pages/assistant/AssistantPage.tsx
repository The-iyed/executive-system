import { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
import { useVoiceAssistant } from "@gl/hooks/useVoiceAssistant";
import { VoiceToolCards } from "@gl/components/voice/VoiceToolCards";
import { NeuronSVG } from "@gl/components/assistant/NeuronSVG";
import { Mic, MicOff, Send, Volume2, VolumeOff, Power, Loader2 } from "lucide-react";
import { cn } from "@gl/lib/utils";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { assistantTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";

function AssistantPage() {
  const { status, transcript, errorMessage, isMuted, isProcessing, connect, disconnect, toggleMute, sendTextMessage } = useVoiceAssistant();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState("");
  const pendingMessageRef = useRef<string | null>(null);
  const assistantTour = useProductTour("assistant");
  const setOpenTour = useTourStore((s) => s.setOpenTour);

  useEffect(() => {
    setOpenTour(assistantTour.open);
    return () => setOpenTour(null);
  }, [assistantTour.open, setOpenTour]);

  const isActive = status === "connected" || status === "listening" || status === "speaking";
  const isConnecting = status === "connecting";

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  // Auto-scroll when new transcript entries arrive
  useEffect(() => {
    if (scrollRef.current && transcript.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [transcript.length]);

  // Send pending message once connection is active
  useEffect(() => {
    if (isActive && pendingMessageRef.current) {
      sendTextMessage(pendingMessageRef.current);
      pendingMessageRef.current = null;
    }
  }, [isActive, sendTextMessage]);

  const handleSendText = useCallback(() => {
    if (!textInput.trim()) return;
    if (isActive) {
      sendTextMessage(textInput.trim());
    } else {
      pendingMessageRef.current = textInput.trim();
      connect();
    }
    setTextInput("");
  }, [textInput, isActive, connect, sendTextMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  const showIdleState = transcript.length === 0 && !isActive && !isConnecting;

  // Compact status for bottom bar
  const compactStatus = (() => {
    if (isProcessing) return "جارٍ المعالجة...";
    if (status === "listening") return "مُنصت";
    if (status === "speaking") return "يتحدث";
    if (status === "connected") return "متصل";
    if (status === "connecting") return "جارٍ الاتصال";
    if (status === "error") return "خطأ";
    return "";
  })();

  return (
    <>
    <div className="flex flex-col h-full min-h-0 overflow-hidden assistant-page-bg" dir="rtl">
      {showIdleState ? (
        /* ── Idle State ── */
        <div className="flex-1 flex flex-col items-center text-center px-6">
          {/* Neuron + text centered in available space */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div data-tour="assistant-orb" className="relative mb-4">
              <NeuronSVG isActive={false} size={280} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-16 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/10">
                  <img src={aounLogo} alt="عون" className="size-8" />
                </div>
              </div>
            </div>
            <h2 data-tour="assistant-status" className="text-xl font-bold text-foreground">المساعد الذكي</h2>
            <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">تحدث أو اكتب للتواصل مع المساعد</p>
          </div>

          <div data-tour="assistant-input" className="w-full max-w-lg mt-6">
            <div className="assistant-input-bar flex items-center gap-3 rounded-2xl px-4 py-3">
              <button
                onClick={connect}
                className="shrink-0 size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:brightness-105 active:scale-95 transition-all shadow-sm shadow-primary/20"
                aria-label="بدء التسجيل الصوتي"
              >
                <Mic className="size-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/35 text-right"
                dir="rtl"
              />

              <button
                onClick={handleSendText}
                disabled={!textInput.trim()}
                className="shrink-0 size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 disabled:opacity-30 transition-all"
              >
                <Send className="size-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Active / Has Transcript ── */
        <>
          <div ref={scrollRef} className="flex-1 w-full max-w-5xl mx-auto overflow-y-auto px-6 pt-6 pb-4 scrollbar-hide">
            {transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <NeuronSVG isActive={isActive} size={200} />
                <p className="text-sm text-muted-foreground/60 animate-pulse">
                  {compactStatus}
                </p>
              </div>
            )}

            {(() => {
              // Only show the latest tool result
              const latestToolEntry = [...transcript].reverse().find(e => e.toolResult);
              if (!latestToolEntry) return null;
              return (
                <div
                  key={latestToolEntry.id}
                  className="mb-3 w-full animate-[voiceCardIn_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                >
                  <VoiceToolCards toolResult={latestToolEntry.toolResult!} />
                </div>
              );
            })()}

            {/* Processing loader */}
            {isProcessing && (
              <div className="flex items-center gap-2.5 py-4 px-1 animate-fade-in">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="size-4 text-primary animate-spin" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">جارٍ جلب البيانات</span>
                  <span className="flex gap-0.5">
                    <span className="size-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-1 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="shrink-0 w-full max-w-2xl mx-auto px-6 pb-5 pt-2">
            <div className="assistant-input-bar flex items-center gap-2 rounded-2xl px-3 py-2.5">
              {/* Disconnect button */}
              <button
                onClick={isActive || isConnecting ? disconnect : connect}
                disabled={isConnecting}
                className={cn(
                  "shrink-0 size-11 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
                  isActive
                    ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20"
                    : isConnecting
                    ? "bg-muted text-muted-foreground cursor-wait"
                    : "bg-primary text-primary-foreground hover:brightness-105 shadow-primary/20"
                )}
                aria-label={isActive ? "إيقاف الاتصال" : "بدء التسجيل"}
              >
                {isActive ? <Power className="size-5" /> : <Mic className="size-5" />}
              </button>

              {/* Mute/Unmute toggle — Volume icons */}
              {isActive && (
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
                  className={cn(
                    "shrink-0 size-10 rounded-xl flex items-center justify-center transition-all",
                    isMuted
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {isMuted ? <VolumeOff className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isProcessing ? (
                  <Loader2 className="size-3 text-primary animate-spin" />
                ) : (
                  <div className={cn(
                    "size-2 rounded-full transition-colors",
                    isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/20"
                  )} />
                )}
                <span className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  status === "error" ? "text-destructive" : "text-muted-foreground/50"
                )}>
                  {compactStatus}
                </span>
              </div>

              {/* Text input */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
                className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/30 text-right"
                dir="rtl"
              />

              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || isProcessing}
                className="shrink-0 size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 disabled:opacity-30 transition-all"
              >
                <Send className="size-4 rotate-180" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    <ProductTour tourId="assistant" steps={assistantTourSteps} isOpen={assistantTour.isOpen} onClose={assistantTour.close} />
    </>
  );
}

export { AssistantPage };
