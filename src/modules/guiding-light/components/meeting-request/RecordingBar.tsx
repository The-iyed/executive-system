import { useRef, useEffect } from "react";
import { Pause, Send, Mic, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@gl/components/ui/button";
import { RecordedWaveform } from "./RecordedWaveform";
import type { RecordingState } from "@gl/hooks/useAudioRecorder";

interface RecordingBarProps {
  state: RecordingState;
  analyser: AnalyserNode | null;
  waveformData: number[];
  isPlaying: boolean;
  playbackProgress: number;
  onStart: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStop: () => void;
  onSend: () => void;
  onCancel: () => void;
  onPlay: () => void;
  onPausePlayback: () => void;
  onReset: () => void;
}

function LiveWaveformCanvas({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!canvas || !ctx) return;
      animationRef.current = requestAnimationFrame(draw);

      analyser!.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#048F86";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={40}
      className="h-10 w-full"
    />
  );
}

function StaticWaveform() {
  return (
    <div className="flex h-10 w-full items-center justify-center gap-[2px]">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-[#048F86]/30"
          style={{ height: `${4 + Math.random() * 16}px` }}
        />
      ))}
    </div>
  );
}

function RecordingBar({
  state,
  analyser,
  waveformData,
  isPlaying,
  playbackProgress,
  onStart,
  onPauseRecording,
  onResumeRecording,
  onStop,
  onSend,
  onCancel,
  onPlay,
  onPausePlayback,
  onReset,
}: RecordingBarProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Waveform + controls row */}
      <div className="flex w-full items-center gap-3 rounded-full border border-border bg-muted/30 px-3 py-2">
        {/* Send button */}
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-full bg-gradient-to-l from-[#048F86] to-[#6DCDCD] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          onClick={onSend}
          disabled={state !== "recorded"}
        >
          <Send className="size-4" />
        </Button>

        {/* Waveform visualization */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {(state === "recording" || state === "paused") && analyser ? (
            <LiveWaveformCanvas analyser={analyser} />
          ) : state === "recorded" && waveformData.length > 0 ? (
            <RecordedWaveform
              waveformData={waveformData}
              progress={playbackProgress}
            />
          ) : (
            <StaticWaveform />
          )}
        </div>

        {/* Action buttons */}
        {state === "idle" && (
          <Button
            size="icon"
            variant="ghost"
            className="size-10 shrink-0 rounded-full"
            onClick={onStart}
          >
            <Mic className="size-5 text-primary" />
          </Button>
        )}

        {state === "recording" && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={onPauseRecording}
            >
              <Pause className="size-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={onStop}
            >
              <Square className="size-4 fill-red-500 text-red-500" />
            </Button>
          </div>
        )}

        {state === "paused" && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={onResumeRecording}
            >
              <Play className="size-4 text-primary" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={onStop}
            >
              <Square className="size-4 fill-red-500 text-red-500" />
            </Button>
          </div>
        )}

        {state === "recorded" && (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={isPlaying ? onPausePlayback : onPlay}
            >
              {isPlaying ? (
                <Pause className="size-4 text-primary" />
              ) : (
                <Play className="size-4 text-primary" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-9 rounded-full"
              onClick={onReset}
            >
              <RotateCcw className="size-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* Cancel text */}
      <button
        onClick={onCancel}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        إلغاء
      </button>
    </div>
  );
}

export { RecordingBar };
