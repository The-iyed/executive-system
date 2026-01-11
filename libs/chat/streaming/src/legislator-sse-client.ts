import type { StreamEvent } from '@sanad-ai/api';

export interface LegislatorSSEOptions {
  url: string;
  onEvent: (event: StreamEvent) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  headers?: Record<string, string>;
}

/**
 * SSE Client for Legislator API streaming endpoint
 * Handles Server-Sent Events from /legislator/conversations/:id/messages-stream
 */
export class LegislatorSSEClient {
  private eventSource: EventSource | null = null;
  private options: LegislatorSSEOptions;
  private abortController: AbortController | null = null;

  constructor(options: LegislatorSSEOptions) {
    this.options = options;
  }

  /**
   * Connect to the SSE stream using fetch API (for custom headers and POST support)
   */
  async connect(): Promise<void> {
    if (this.eventSource) {
      this.close();
    }

    // Use fetch API for POST requests with custom headers
    const response = await fetch(this.options.url, {
      method: 'POST',
      headers: {
        ...this.options.headers,
        Accept: 'text/event-stream',
      },
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processChunk = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (this.options.onClose) {
              this.options.onClose();
            }
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                if (this.options.onClose) {
                  this.options.onClose();
                }
                return;
              }

              try {
                const event: StreamEvent = JSON.parse(data);
                this.options.onEvent(event);
              } catch (error) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Aborted, ignore
          return;
        }
        if (this.options.onError) {
          this.options.onError(
            error instanceof Error ? error : new Error('SSE stream error')
          );
        }
      }
    };

    processChunk();
  }

  /**
   * Connect using EventSource (for GET requests)
   */
  connectWithEventSource(): void {
    if (this.eventSource) {
      this.close();
    }

    this.eventSource = new EventSource(this.options.url);

    this.eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        this.options.onEvent(data);
      } catch (error) {
        // Skip invalid JSON
      }
    };

    this.eventSource.onerror = (error) => {
      if (this.options.onError) {
        this.options.onError(new Error('SSE connection error'));
      }
    };

    this.eventSource.addEventListener('close', () => {
      if (this.options.onClose) {
        this.options.onClose();
      }
    });
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

