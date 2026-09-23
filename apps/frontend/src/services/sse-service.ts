import type { SsePayload } from '@minidesk/types';

type SseListener = (payload: SsePayload) => void;

class SSEService {
  private eventSource: EventSource | null = null;
  private listeners: Set<SseListener> = new Set();
  private reconnectTimeout: any = null;
  private retryDelay = 2000;
  private maxRetryDelay = 30000;
  private isExplicitlyClosed = false;

  connect(): void {
    if (this.eventSource) return;

    this.isExplicitlyClosed = false;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const sseUrl = `${apiUrl}/sse`;

    console.log('[SSE-Client] Connecting to:', sseUrl);

    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log('[SSE-Client] Connected successfully');
        this.retryDelay = 2000; // Reset backoff
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as SsePayload;
          this.notifyListeners(payload);
        } catch {
          // Ignore ping or non-json message
        }
      };

      this.eventSource.onerror = (err) => {
        console.warn('[SSE-Client] Connection error or disconnected. Scheduling reconnect...', err);
        this.disconnect(false);
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[SSE-Client] Failed to instantiate EventSource:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetryDelay);
      this.connect();
    }, this.retryDelay);
  }

  disconnect(explicit = true): void {
    this.isExplicitlyClosed = explicit;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  subscribe(listener: SseListener): () => void {
    this.listeners.add(listener);
    if (!this.eventSource) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(payload: SsePayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[SSE-Client] Error in listener callback:', err);
      }
    });
  }
}

export const sseClient = new SSEService();
