export interface SSEClientOptions {
  url: string;
  onMessage: (data: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class SSEClient {
  private eventSource: EventSource | null = null;
  private options: SSEClientOptions;

  constructor(options: SSEClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (this.eventSource) {
      this.close();
    }

    this.eventSource = new EventSource(this.options.url);

    this.eventSource.onmessage = (event) => {
      this.options.onMessage(event.data);
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

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}











