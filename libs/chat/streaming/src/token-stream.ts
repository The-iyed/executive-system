export interface TokenStreamHandler {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class TokenStream {
  private handler: TokenStreamHandler;
  private buffer: string = '';

  constructor(handler: TokenStreamHandler) {
    this.handler = handler;
  }

  processChunk(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          this.handler.onComplete();
        } else {
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
              const token = parsed.choices[0].delta.content;
              if (token) {
                this.handler.onToken(token);
              }
            }
          } catch {
            this.handler.onError(new Error('Failed to parse token stream data'));
          }
        }
      }
    }
  }

  reset(): void {
    this.buffer = '';
  }
}







