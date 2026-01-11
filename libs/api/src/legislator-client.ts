import type { AxiosInstance } from 'axios';
import type {
  SendMessageStreamRequest,
  StreamEvent,
} from './legislator-types';
import type { ApiClientConfig } from './client';

export interface StreamController {
  abort: () => void;
}

/**
 * Create a streaming message request for the legislator API
 * This handles multipart/form-data with file uploads and SSE streaming
 */
export async function sendStreamingMessage(
  client: AxiosInstance,
  baseURL: string,
  conversationId: string,
  request: SendMessageStreamRequest,
  options: {
    onEvent: (event: StreamEvent) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
  },
  basicAuth?: ApiClientConfig['basicAuth']
): Promise<StreamController> {
  const formData = new FormData();
  
  formData.append('query', request.query || 'ولد خطاب');
  
  if (request.file) {
    formData.append('file', request.file);
    console.log('FormData: Added file', { name: request.file.name, size: request.file.size, type: request.file.type });
  }
  
  if (request.audio_file) {
    formData.append('audio_file', request.audio_file);
    console.log('FormData: Added audio_file', { name: request.audio_file.name, size: request.audio_file.size, type: request.audio_file.type });
  }
  
  // Add optional language
  if (request.language) {
    formData.append('language', request.language);
  }
  
  // Add letter_response only if true
  if (request.letter_response === true) {
    formData.append('letter_response', 'true');
    console.log('FormData: Added letter_response = true');
  }
  
  // Add debug flag
  if (request.debug !== undefined) {
    formData.append('debug', request.debug ? 'true' : 'false');
  }
  
  // Debug: Log all FormData entries
  console.log('FormData entries:', {
    query: request.query,
    hasFile: !!request.file,
    hasAudioFile: !!request.audio_file,
    letterResponse: request.letter_response,
  });

  // Get authorization header - prioritize passed basicAuth, then try to extract from client
  const getAuthHeader = (): string | undefined => {
    // If basicAuth config is provided, create the header directly
    if (basicAuth) {
      if (basicAuth.authString) {
        return `Basic ${basicAuth.authString}`;
      }
      if (basicAuth.username && basicAuth.password) {
        const credentials = `${basicAuth.username}:${basicAuth.password}`;
        const encoded = btoa(credentials);
        return `Basic ${encoded}`;
      }
    }

    // Fallback: Try to extract from axios client
    // Check common headers (most common location)
    const commonAuth = client.defaults.headers.common['Authorization'] || 
                       client.defaults.headers.common['authorization'];
    if (commonAuth) return commonAuth as string;

    // Check if it's in the get method
    const getAuth = (client.defaults.headers.get as any)?.['Authorization'] ||
                    (client.defaults.headers.get as any)?.['authorization'];
    if (getAuth) return getAuth as string;

    // Check post headers
    const postAuth = (client.defaults.headers.post as any)?.['Authorization'] ||
                     (client.defaults.headers.post as any)?.['authorization'];
    if (postAuth) return postAuth as string;

    return undefined;
  };

  const authHeader = getAuthHeader();

  // Build the URL
  const url = `${baseURL}/legislator/conversations/${conversationId}/messages-stream`;

  // Create abort controller for cancellation
  const abortController = new AbortController();

  // Prepare headers for fetch - ALWAYS include Authorization if available
  const headers: HeadersInit = {};
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  // Don't set Content-Type, let browser set it with boundary for multipart/form-data

  // Use fetch API for POST with FormData and streaming response
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    signal: abortController.signal,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to start stream: ${response.status} ${response.statusText} - ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // Read the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Define helper functions first
  const processLine = (line: string) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      return;
    }
    
    // Handle SSE data lines - can be "data: " or "data: data: "
    if (trimmedLine.startsWith('data: ')) {
      let data = trimmedLine.slice(6).trim();
      
      // Handle double "data:" prefix (data: data: {...})
      if (data.startsWith('data: ')) {
        data = data.slice(6).trim();
      }
      
      // Skip empty data
      if (!data) {
        return;
      }
      
      // Check for [DONE] marker
      if (data === '[DONE]') {
        if (options.onClose) {
          options.onClose();
        }
        return;
      }

      // Try to parse JSON
      try {
        const event: StreamEvent = JSON.parse(data);
        options.onEvent(event);
      } catch (error) {
        // If parsing fails, it might be a partial JSON or non-JSON data
        // Log for debugging but don't throw
        console.warn('Failed to parse SSE event data:', data, error);
      }
    }
  };

  const processBuffer = (bufferContent: string) => {
    const lines = bufferContent.split('\n');
    for (const line of lines) {
      processLine(line);
    }
  };

  const processStream = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            processBuffer(buffer);
            buffer = '';
          }
          if (options.onClose) {
            options.onClose();
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        // Process complete lines
        for (const line of lines) {
          processLine(line);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Aborted, ignore
        return;
      }
      if (options.onError) {
        options.onError(
          error instanceof Error ? error : new Error('Stream processing error')
        );
      }
    }
  };

  // Start processing the stream
  processStream();

  return {
    abort: () => {
      abortController.abort();
      reader.cancel();
    },
  };
}

