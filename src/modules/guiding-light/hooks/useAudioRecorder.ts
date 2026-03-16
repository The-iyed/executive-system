import { useState, useRef, useCallback, useEffect } from "react";

type RecordingState = "idle" | "recording" | "paused" | "recorded";

function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  // Decode audio blob into waveform data for visualization
  useEffect(() => {
    if (!audioBlob) {
      setWaveformData([]);
      return;
    }

    const ctx = new AudioContext();
    audioBlob.arrayBuffer().then((buffer) => {
      ctx.decodeAudioData(buffer).then((audioBuffer) => {
        const rawData = audioBuffer.getChannelData(0);
        const samples = 80;
        const blockSize = Math.floor(rawData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          peaks.push(sum / blockSize);
        }

        // Normalize to 0-1
        const max = Math.max(...peaks);
        setWaveformData(max > 0 ? peaks.map((p) => p / max) : peaks);
        ctx.close();
      });
    });
  }, [audioBlob]);

  const startRecording = useCallback(async () => {
    // Clean up previous playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      audioContextRef.current = audioContext;
      setAnalyser(analyserNode);

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState("recording");
    } catch {
      console.error("Could not access microphone");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorderState = mediaRecorderRef.current?.state;
    if (recorderState === "recording" || recorderState === "paused") {
      mediaRecorderRef.current!.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    setAnalyser(null);
    setState("recorded");
  }, []);

  const playRecording = useCallback(() => {
    if (!audioBlob) return;

    // If already playing, just resume tracking — but audio element handles it
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    } else {
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;
      audioElementRef.current = new Audio(url);
    }

    const audio = audioElementRef.current!;

    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      cancelAnimationFrame(rafRef.current);
    };

    function updateProgress() {
      if (audio.duration && isFinite(audio.duration)) {
        setPlaybackProgress(audio.currentTime / audio.duration);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    }

    audio.play();
    setIsPlaying(true);
    updateProgress();
  }, [audioBlob]);

  const pausePlayback = useCallback(() => {
    audioElementRef.current?.pause();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const resetRecording = useCallback(() => {
    const recorderState = mediaRecorderRef.current?.state;
    if (recorderState === "recording" || recorderState === "paused") {
      mediaRecorderRef.current!.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    cancelAnimationFrame(rafRef.current);
    setAnalyser(null);
    setAudioBlob(null);
    setWaveformData([]);
    setIsPlaying(false);
    setPlaybackProgress(0);
    chunksRef.current = [];
    setState("idle");
  }, []);

  return {
    state,
    audioBlob,
    analyser,
    waveformData,
    isRecording: state === "recording",
    isPlaying,
    playbackProgress,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resetRecording,
  };
}

export { useAudioRecorder };
export type { RecordingState };
