import { AnimatedOrb } from "./AnimatedOrb";
import { RecordingBar } from "./RecordingBar";
import { AudioWaveform } from "./AudioWaveform";
import { useAudioRecorder } from "@gl/hooks/useAudioRecorder";

interface VoiceRequestTabProps {
  onClose: () => void;
}

const STATUS_TEXT: Record<string, string> = {
  idle: "اضغط على زر التسجيل للبدء",
  recording: "أنا مُنصتٌ لمعاليكم.",
  paused: "التسجيل متوقف مؤقتًا",
  recorded: "تم التسجيل. يمكنك الإرسال الآن.",
};

function VoiceRequestTab({ onClose }: VoiceRequestTabProps) {
  const {
    state,
    analyser,
    waveformData,
    isRecording,
    isPlaying,
    playbackProgress,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resetRecording,
  } = useAudioRecorder();

  function handleSend() {
    // Future: submit audioBlob to API
    resetRecording();
    onClose();
  }

  function handleCancel() {
    resetRecording();
    onClose();
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Animated orb */}
      <AnimatedOrb isActive={isRecording || state === "paused"} />

      {/* Status text */}
      <p className="text-lg font-semibold text-foreground">
        {STATUS_TEXT[state]}
      </p>

      {/* Center waveform (CSS animated bars) */}
      <AudioWaveform isActive={isRecording} />

      {/* Recording bar with controls */}
      <div className="w-full max-w-md px-4">
        <RecordingBar
          state={state}
          analyser={analyser}
          waveformData={waveformData}
          isPlaying={isPlaying}
          playbackProgress={playbackProgress}
          onStart={startRecording}
          onPauseRecording={pauseRecording}
          onResumeRecording={resumeRecording}
          onStop={stopRecording}
          onSend={handleSend}
          onCancel={handleCancel}
          onPlay={playRecording}
          onPausePlayback={pausePlayback}
          onReset={resetRecording}
        />
      </div>
    </div>
  );
}

export { VoiceRequestTab };
