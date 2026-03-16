import { useCallback, useRef, useState } from "react";
import { supabase } from "@gl/integrations/supabase/client";
import { realtimeTools, VOICE_ASSISTANT_INSTRUCTIONS } from "@gl/lib/voice-tools";
import type { ToolResultData } from "@gl/components/voice/VoiceToolCards";

/** Strip heavy nested payloads from a meeting/object for voice output */
function simplifyMeeting(m: any): any {
  if (!m || typeof m !== "object") return m;
  const { meeting_assessments, assessment_payload, analysis_payload, attachments, reflection_cards, feedback_summary, dimension_scores, executive_summary, ...rest } = m;
  if (rest.attendees) {
    rest.attendees = (rest.attendees as any[]).slice(0, 5).map((a: any) => ({ name: a.name, role: a.role }));
  }
  if (rest.agenda_items) {
    rest.agenda_items = (rest.agenda_items as any[]).map((a: any) => ({ agenda_item: a.agenda_item, order: a.order }));
  }
  return rest;
}

export type VoiceStatus = "idle" | "connecting" | "connected" | "speaking" | "listening" | "error";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  id: string;
  toolResult?: ToolResultData;
}

interface PendingToolCall {
  call_id: string;
  name: string;
  arguments: string;
}

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const pendingToolCallsRef = useRef<Map<string, PendingToolCall>>(new Map());
  const toolCallArgsRef = useRef<Map<string, string>>(new Map());

  const addTranscript = useCallback((role: "user" | "assistant", text: string, toolResult?: ToolResultData) => {
    setTranscript((prev) => {
      // For tool results, always add a new entry
      if (toolResult) {
        return [...prev, { role, text, id: `tool-${Date.now()}-${Math.random()}`, toolResult }];
      }
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.toolResult) {
        return [...prev.slice(0, -1), { ...last, text }];
      }
      return [...prev, { role, text, id: `${role}-${Date.now()}` }];
    });
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!audioContextRef.current) return;
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    playbackQueueRef.current.push(float32);
    if (!isPlayingRef.current) drainPlaybackQueue();
  }, []);

  const drainPlaybackQueue = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      isSpeakingRef.current = false;
      setStatus((s) => (s === "speaking" ? "listening" : s));
      return;
    }
    isPlayingRef.current = true;
    setStatus("speaking");
    isSpeakingRef.current = true;
    const chunk = playbackQueueRef.current.shift()!;
    const buffer = ctx.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => drainPlaybackQueue();
    source.start();
    sourceNodeRef.current = source;
  }, []);

  const executeToolCall = useCallback(async (callId: string, toolName: string, argsStr: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(argsStr);
    } catch {
      args = {};
    }

    console.log(`Executing tool: ${toolName}`, args);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("execute-tool", {
        body: { tool_name: toolName, arguments: args },
      });

      const rawOutput = error ? JSON.stringify({ error: error.message }) : (data?.result || JSON.stringify({ error: "No result" }));

      // If we got structured data, add it as a visual card in the transcript
      if (data?.structured_data) {
        addTranscript("assistant", "", data.structured_data as ToolResultData);
      }

      // Summarize/trim tool results so the realtime model gets accurate data
      // without choking on huge payloads
      let voiceOutput = rawOutput;
      try {
        const parsed = typeof rawOutput === "string" ? JSON.parse(rawOutput) : rawOutput;
        if (Array.isArray(parsed) && parsed.length > 5) {
          const count = parsed.length;
          const sample = parsed.slice(0, 5).map((m: any) => simplifyMeeting(m));
          voiceOutput = JSON.stringify({
            total_count: count,
            note: `هذه النتيجة تحتوي على ${count} عنصر. العدد الإجمالي هو ${count}. استخدم هذا الرقم دائماً.`,
            sample_items: sample,
          });
        } else if (Array.isArray(parsed)) {
          voiceOutput = JSON.stringify(parsed.map((m: any) => simplifyMeeting(m)));
        } else if (parsed && typeof parsed === "object" && (parsed.title || parsed.id)) {
          // Single meeting/object — trim heavy fields
          voiceOutput = JSON.stringify(simplifyMeeting(parsed));
        } else if (typeof voiceOutput === "string" && voiceOutput.length > 8000) {
          voiceOutput = voiceOutput.slice(0, 8000) + "...(truncated)";
        }
      } catch {}

      // Send tool result back to the realtime API
      ws.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: typeof voiceOutput === "string" ? voiceOutput : JSON.stringify(voiceOutput),
        },
      }));

      // Trigger the model to generate a response based on tool output
      ws.send(JSON.stringify({ type: "response.create" }));
    } catch (err) {
      console.error("Tool execution error:", err);
      ws.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify({ error: err instanceof Error ? err.message : "Tool execution failed" }),
        },
      }));
      ws.send(JSON.stringify({ type: "response.create" }));
    } finally {
      setIsProcessing(false);
    }
  }, [addTranscript]);

  const connect = useCallback(async () => {
    try {
      setStatus("connecting");
      setErrorMessage(null);
      setTranscript([]);

      const { data, error } = await supabase.functions.invoke("azure-realtime-token");
      if (error || !data) throw new Error(error?.message || "Failed to get connection token");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      let wsUrl: string;
      if (data.type === "websocket") {
        wsUrl = data.url;
        wsUrl += `&api-key=${data.apiKey}`;
      } else {
        const endpoint = data.endpoint.replace(/\/+$/, "");
        wsUrl = `${endpoint.replace("https://", "wss://")}/openai/realtime?api-version=${data.apiVersion}&deployment=${data.deployment}`;
        wsUrl += `&api-key=${data.token}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");

        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["audio", "text"],
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: { model: "whisper-1" },
            turn_detection: {
              type: "server_vad",
              threshold: 0.6,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
            },
            instructions: VOICE_ASSISTANT_INSTRUCTIONS,
            tools: realtimeTools,
          },
        }));

        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN || isMuted || isSpeakingRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          const bytes = new Uint8Array(int16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: btoa(binary),
          }));
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        setStatus("listening");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "response.audio.delta":
              if (msg.delta) playAudioChunk(msg.delta);
              break;

            case "response.audio_transcript.done":
              if (msg.transcript) addTranscript("assistant", msg.transcript);
              break;

            case "conversation.item.input_audio_transcription.completed":
              if (msg.transcript) addTranscript("user", msg.transcript);
              break;

            case "response.function_call_arguments.delta":
              if (msg.call_id) {
                const existing = toolCallArgsRef.current.get(msg.call_id) || "";
                toolCallArgsRef.current.set(msg.call_id, existing + (msg.delta || ""));
              }
              break;

            case "response.function_call_arguments.done":
              if (msg.call_id && msg.name) {
                const args = msg.arguments || toolCallArgsRef.current.get(msg.call_id) || "{}";
                toolCallArgsRef.current.delete(msg.call_id);
                addTranscript("assistant", `🔍 جارٍ البحث...`);
                executeToolCall(msg.call_id, msg.name, args);
              }
              break;

            case "input_audio_buffer.speech_started":
              playbackQueueRef.current = [];
              if (sourceNodeRef.current) {
                try { sourceNodeRef.current.stop(); } catch { /* ok */ }
              }
              setStatus("listening");
              break;

            case "response.done":
              setStatus("listening");
              break;

            case "error":
              console.error("Realtime API error:", msg);
              setErrorMessage(msg.error?.message || "حدث خطأ في الاتصال");
              break;
          }
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setErrorMessage("فشل الاتصال بالمساعد الصوتي");
        setStatus("error");
      };

      ws.onclose = () => {
        setStatus("idle");
        cleanup();
      };
    } catch (err) {
      console.error("Connection error:", err);
      setErrorMessage(err instanceof Error ? err.message : "فشل الاتصال");
      setStatus("error");
    }
  }, [addTranscript, playAudioChunk, isMuted, executeToolCall]);

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    pendingToolCallsRef.current.clear();
    toolCallArgsRef.current.clear();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  /** Send a text message to the agent via the open WebSocket session */
  const sendTextMessage = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // Add user message to transcript immediately
    addTranscript("user", text);
    // Send as a conversation item
    ws.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    }));
    // Trigger a response
    ws.send(JSON.stringify({ type: "response.create" }));
  }, [addTranscript]);

  return { status, transcript, errorMessage, isMuted, isProcessing, connect, disconnect, toggleMute, sendTextMessage };
}
