// @ts-nocheck — Deno edge function, not compiled by Vite
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const endpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT")!;
    const apiKey = Deno.env.get("AZURE_OPENAI_API_KEY")!;
    const deployment = Deno.env.get("AZURE_OPENAI_DEPLOYMENT") || "gpt-realtime";
    const apiVersion = Deno.env.get("AZURE_OPENAI_API_VERSION") || "2024-10-01-preview";

    // Clean up endpoint URL
    const baseUrl = endpoint.replace(/\/+$/, "");

    // Request an ephemeral token for WebRTC session
    const tokenUrl = `${baseUrl}/openai/realtime/sessions?api-version=${apiVersion}&deployment=${deployment}`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: deployment,
        voice: "alloy",
        instructions: `أنت مساعد ذكي ومهذب يتحدث باللهجة السعودية بطلاقة. أنت تتحدث مع أحد الوزراء في المملكة العربية السعودية. 

قواعد المحادثة:
- تحدث دائماً باللهجة السعودية الفصيحة والمهذبة
- استخدم ألقاب التشريف المناسبة مثل "معالي الوزير" و"صاحب المعالي"
- كن محترماً ولبقاً في جميع ردودك
- ساعد معالي الوزير في أي استفسار أو طلب بكل احترافية
- استخدم عبارات مثل "تفضل يا معالي الوزير" و"حاضرين" و"إن شاء الله"
- كن مختصراً ومفيداً في إجاباتك
- إذا سُئلت عن هويتك، قل أنك "عون" المساعد الذكي لمعالي الوزير
- كلمة "جَدوَلة" تُنطق بفتح الجيم وفتح الواو وليس بسكون الدال
- كلمة "المُجدوَلة" تُنطق بضم الميم وفتح الواو`,
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token request failed:", tokenResponse.status, errorText);
      
      // Fallback: return connection details for direct WebSocket connection
      return new Response(
        JSON.stringify({
          type: "websocket",
          url: `${baseUrl.replace("https://", "wss://")}/openai/realtime?api-version=${apiVersion}&deployment=${deployment}`,
          apiKey: apiKey,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        type: "webrtc",
        token: tokenData.client_secret?.value || tokenData.id,
        endpoint: baseUrl,
        deployment,
        apiVersion,
        sessionData: tokenData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
