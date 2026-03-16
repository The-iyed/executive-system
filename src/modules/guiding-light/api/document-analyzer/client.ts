import type { StreamingCallback, StreamingEvent } from "../types";

const DOC_ANALYZER_BASE =
  import.meta.env.VITE_DOC_ANALYZER_URL ||
  "https://doc-analyzer-dev.momrahai.com";

export interface DocumentUploadResponse {
  document_id: string;
  filename: string;
  status: string;
  status_url: string;
  message: string;
}

export interface DocumentStatusResponse {
  id: string;
  filename: string;
  status: string;
  page_count: number | null;
  chunk_count: number;
  error_message: string;
  uploaded_at: string;
  processed_at: string | null;
  progress: {
    current_stage: string;
    pages_extracted: number;
    pages_ocr_fallback: number;
    total_chunks: number;
    chunks_embedded: number;
    chunks_uploaded: number;
  };
}

/**
 * Upload a PDF document to the document analyzer API.
 */
export async function uploadDocument(
  file: File
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${DOC_ANALYZER_BASE}/api/documents/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Document upload failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Check document processing status.
 */
export async function getDocumentStatus(
  documentId: string
): Promise<DocumentStatusResponse> {
  const res = await fetch(
    `${DOC_ANALYZER_BASE}/api/documents/${documentId}/status/`
  );

  if (!res.ok) {
    throw new Error(`Status check failed (${res.status})`);
  }

  return res.json();
}

/**
 * Poll document status until it's ready or failed.
 * Calls onProgress with each status update.
 */
export async function waitForDocumentReady(
  documentId: string,
  onProgress?: (status: DocumentStatusResponse) => void,
  maxWaitMs = 300_000,
  intervalMs = 2_000
): Promise<DocumentStatusResponse> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await getDocumentStatus(documentId);
    onProgress?.(status);

    if (status.status === "ready") return status;
    if (status.status === "failed") {
      throw new Error(
        status.error_message || "Document processing failed"
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Document processing timed out");
}

/**
 * Query a processed document with streaming response.
 */
export async function queryDocumentStream(
  documentId: string,
  question: string,
  onEvent: StreamingCallback,
  onError?: (error: Error) => void,
  topK = 5
): Promise<void> {
  try {
    const res = await fetch(
      `${DOC_ANALYZER_BASE}/api/documents/${documentId}/query/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, top_k: topK, stream: true }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Query failed (${res.status}): ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Try parsing SSE or raw text chunks
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // SSE format: "data: ..."
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6);
          if (data === "[DONE]") {
            // Stream complete — fire done event
            onEvent({
              event: "done",
              content: "",
            } as StreamingEvent);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            // Handle different possible response shapes
            if (parsed.content || parsed.text || parsed.chunk) {
              onEvent({
                event: "content_chunk",
                content: parsed.content || parsed.text || parsed.chunk || "",
              } as StreamingEvent);
            } else if (parsed.event) {
              onEvent(parsed as StreamingEvent);
            }
          } catch {
            // Plain text chunk
            onEvent({
              event: "content_chunk",
              content: data,
            } as StreamingEvent);
          }
        } else {
          // Raw text line (non-SSE)
          onEvent({
            event: "content_chunk",
            content: trimmed,
          } as StreamingEvent);
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      onEvent({
        event: "content_chunk",
        content: buffer.trim(),
      } as StreamingEvent);
    }

    // Fire done event
    onEvent({
      event: "done",
      content: "",
    } as StreamingEvent);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError?.(error);
  }
}
