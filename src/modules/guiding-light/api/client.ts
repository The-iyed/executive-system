import type { StreamingEvent, StreamingEventType } from "./types";

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "https://aoun-api.momrahai.com/api/v1/";

const API_KEY =
  (import.meta.env.VITE_MINISTER_SCHEDULE_API_KEY as string) || "";

export type ApiPath = "legislator" | "";

/**
 * Client for VITE_BASE_URL (aoun-api: legislator chat, conversations, etc.).
 * Uses x-api-key (VITE_MINISTER_SCHEDULE_API_KEY), not Bearer token.
 */
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  }

  private getHeaders(includeAuth = true, omitContentType = false): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
      ...(omitContentType ? {} : { "Content-Type": "application/json" }),
    };
    if (includeAuth && API_KEY) {
      (headers as Record<string, string>)["x-api-key"] = API_KEY;
    }
    return headers;
  }

  buildUrl(
    path: ApiPath,
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): string {
    const urlPath = path
      ? `${this.baseUrl}/${path}/${endpoint}`
      : `${this.baseUrl}/${endpoint}`;
    const url = new URL(urlPath);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  async get<T>(
    path: ApiPath,
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, endpoint, params);
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async post<T>(
    path: ApiPath,
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | undefined>,
    skipAuth = false
  ): Promise<T> {
    const url = this.buildUrl(path, endpoint, params);
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(!skipAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async patch<T>(
    path: ApiPath,
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, endpoint, params);
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async delete<T>(
    path: ApiPath,
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = this.buildUrl(path, endpoint, params);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    if (response.status === 204 || response.statusText === "No Content") {
      return undefined as T;
    }
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text);
  }

  async getBlob(
    path: ApiPath,
    endpoint: string,
    options?: { accept?: string }
  ): Promise<Blob> {
    const url = this.buildUrl(path, endpoint);
    const headers = this.getHeaders();
    if (options?.accept) {
      (headers as Record<string, string>)["Accept"] = options.accept;
    }
    const response = await fetch(url, { method: "GET", headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.blob();
  }

  async postMultipart<T>(
    path: ApiPath,
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = this.buildUrl(path, endpoint);
    const headers = this.getHeaders(true, true);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  private normalizeEvent(
    event: StreamingEvent,
    parsed: Record<string, unknown>
  ): StreamingEvent {
    if (event.event === "thinking_chunk") {
      event.event = "thinking";
      if (parsed.iteration !== undefined)
        event.iteration = parsed.iteration as number;
      if (parsed.source !== undefined) event.source = parsed.source as string;
      else if (parsed.agent !== undefined) event.source = parsed.agent as string;
    }
    if (event.event === "iteration_start") {
      event.event = "thinking";
      event.chunk = "";
      event.content = "";
      if (parsed.iteration !== undefined)
        event.iteration = parsed.iteration as number;
    }
    if (event.event === "thinking") {
      const text =
        (parsed.thinking as string) ||
        (parsed.chunk as string) ||
        (parsed.message as string) ||
        event.data ||
        event.chunk ||
        event.content ||
        "";
      if (text) {
        event.data = text;
        event.chunk = text;
        event.content = text;
      }
      if (parsed.iteration !== undefined)
        event.iteration = parsed.iteration as number;
      if (parsed.source !== undefined) event.source = parsed.source as string;
      else if (parsed.agent !== undefined) event.source = parsed.agent as string;
    }
    if ((event as { event: string }).event === "chunk") {
      (event as StreamingEvent).event = "content_chunk";
      const content =
        (parsed.content as string) ||
        (parsed.chunk as string) ||
        event.data ||
        "";
      event.chunk = content;
      event.content = content;
      event.data = content;
    }
    return event;
  }

  async streamMultipart(
    path: ApiPath,
    endpoint: string,
    formData: FormData,
    onEvent: (event: StreamingEvent) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const url = this.buildUrl(path, endpoint);
    const headers: HeadersInit = {
      ...(this.getHeaders(true, true) as Record<string, string>),
      Accept: "text/event-stream",
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      if (!response.body) throw new Error("Response body is null");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentData = "";

      const parseAndEmit = (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
          let event: StreamingEvent;
          if (parsed.event_type_name) {
            const { event_type_name, ...rest } = parsed;
            event = { ...rest, event: event_type_name as StreamingEventType };
          } else if (parsed.event_type) {
            const { event_type, ...rest } = parsed;
            event = { ...rest, event: event_type as StreamingEventType };
          } else if (
            parsed._result_type === "query_result" &&
            !parsed.event
          ) {
            event = { ...parsed, event: "query_result" };
          } else if (parsed.chunk && !parsed.event) {
            event = { ...parsed, event: "summary_chunk" };
          } else if (parsed.status === "completed" && !parsed.event) {
            event = { ...parsed, event: "done" };
          } else {
            event = parsed as unknown as StreamingEvent;
          }
          if (event.event) {
            onEvent(this.normalizeEvent(event, parsed));
          }
        } catch {
          // skip invalid JSON
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim().startsWith("data: ")) {
            let jsonStr = buffer.trim().slice(6).trim();
            while (jsonStr.startsWith("data: ")) jsonStr = jsonStr.slice(6).trimStart();
            if (jsonStr) parseAndEmit(jsonStr);
          }
          if (currentData) parseAndEmit(currentData);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line?.trim();
          if (!trimmed || trimmed.startsWith(": ping")) {
            if (!trimmed && currentData) {
              parseAndEmit(currentData);
              currentData = "";
            }
            continue;
          }
          if (trimmed.startsWith("event: ")) {
            if (currentData) {
              parseAndEmit(currentData);
              currentData = "";
            }
            continue;
          }
          if (trimmed.startsWith("data: ")) {
            let dataStr = trimmed.slice(6).trim();
            while (dataStr.startsWith("data: ")) dataStr = dataStr.slice(6).trimStart();
            if (!dataStr) {
              if (currentData) {
                parseAndEmit(currentData);
                currentData = "";
              }
              continue;
            }
            try {
              parseAndEmit(dataStr);
              currentData = "";
            } catch {
              currentData = currentData ? currentData + dataStr : dataStr;
            }
          }
        }
      }
    } catch (error) {
      if (onError) onError(error as Error);
      else throw error;
    }
  }

  async streamJson(
    path: ApiPath,
    endpoint: string,
    data?: unknown,
    onEvent?: (event: StreamingEvent) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    const url = this.buildUrl(path, endpoint);
    const headers: HeadersInit = {
      ...(this.getHeaders() as Record<string, string>),
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    };
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      if (!response.body || !onEvent) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentData = "";
      let currentEventType: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (currentData && currentEventType) {
            try {
              onEvent(JSON.parse(currentData) as StreamingEvent);
            } catch {
              onEvent({
                event: currentEventType as StreamingEventType,
                content: currentData,
                chunk: currentData,
              });
            }
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line?.trim();
          if (!trimmed || trimmed.startsWith(": ping")) {
            if (!trimmed && currentData && currentEventType) {
              try {
                onEvent(JSON.parse(currentData) as StreamingEvent);
              } catch {
                onEvent({
                  event: currentEventType as StreamingEventType,
                  content: currentData,
                  chunk: currentData,
                });
              }
              currentData = "";
              currentEventType = null;
            }
            continue;
          }
          if (trimmed.startsWith("event: ")) {
            if (currentData && currentEventType) {
              try {
                onEvent(JSON.parse(currentData) as StreamingEvent);
              } catch {
                onEvent({
                  event: currentEventType as StreamingEventType,
                  content: currentData,
                  chunk: currentData,
                });
              }
            }
            currentEventType = trimmed.slice(7);
            currentData = "";
            continue;
          }
          if (trimmed.startsWith("data: ")) {
            let dataStr = trimmed.slice(6).trim();
            while (dataStr.startsWith("data: ")) dataStr = dataStr.slice(6).trimStart();
            if (!dataStr) continue;
            const combined = currentData + dataStr;
            try {
              const parsed = JSON.parse(combined) as Record<string, unknown>;
              const eventType =
                (parsed.event_type_name as string) ||
                (parsed.event_type as string) ||
                (parsed.event as string) ||
                currentEventType;
              if (currentEventType === "synthesis_chunk" && parsed.data != null) {
                onEvent({
                  event: "content_chunk",
                  chunk: String(parsed.data),
                  content: String(parsed.data),
                });
              } else if (
                (eventType === "chunk" || currentEventType === "chunk") &&
                parsed.content != null
              ) {
                onEvent({
                  event: "content_chunk",
                  chunk: String(parsed.content),
                  content: String(parsed.content),
                });
              } else {
                const event: StreamingEvent = {
                  ...parsed,
                  event: (eventType as StreamingEventType) || "content_chunk",
                } as StreamingEvent;
                onEvent(event);
              }
              currentData = "";
              currentEventType = null;
            } catch {
              try {
                const parsed = JSON.parse(dataStr) as Record<string, unknown>;
                const eventType =
                  (parsed.event_type_name as string) ||
                  (parsed.event_type as string) ||
                  (parsed.event as string) ||
                  currentEventType;
                if (currentEventType === "synthesis_chunk" && parsed.data != null) {
                  onEvent({
                    event: "content_chunk",
                    chunk: String(parsed.data),
                    content: String(parsed.data),
                  });
                } else if (
                  (eventType === "chunk" || currentEventType === "chunk") &&
                  parsed.content != null
                ) {
                  onEvent({
                    event: "content_chunk",
                    chunk: String(parsed.content),
                    content: String(parsed.content),
                  });
                } else {
                  const event: StreamingEvent = {
                    ...parsed,
                    event: (eventType as StreamingEventType) || "content_chunk",
                  } as StreamingEvent;
                  onEvent(event);
                }
                currentData = "";
                currentEventType = null;
              } catch {
                currentData = combined;
              }
            }
          }
        }
      }
    } catch (error) {
      if (onError) onError(error as Error);
      else throw error;
    }
  }
}

export const apiClient = new ApiClient();
