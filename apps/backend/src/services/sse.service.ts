import type { Response } from 'express';
import { EventEmitter } from 'events';
import type { SsePayload, SseEventType } from '@minidesk/types';

class SSEManager {
  private clients: Set<Response> = new Set();
  private emitter = new EventEmitter();

  constructor() {
    // Send periodic keep-alive comments every 25 seconds
    setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
  }

  addClient(res: Response): void {
    // Standard SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Prevents buffering in NGINX
    });

    res.write('retry: 5000\n\n');
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE stream connected', timestamp: new Date().toISOString() })}\n\n`);

    this.clients.add(res);
    console.log(`[SSE] Client connected. Total active streams: ${this.clients.size}`);

    res.on('close', () => {
      this.clients.delete(res);
      console.log(`[SSE] Client disconnected. Total active streams: ${this.clients.size}`);
    });
  }

  broadcast(type: SseEventType, entity: string, data: any): void {
    const payload: SsePayload = {
      type,
      entity,
      data,
      timestamp: new Date().toISOString(),
    };

    const message = `data: ${JSON.stringify(payload)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(message);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  private sendHeartbeat(): void {
    for (const client of this.clients) {
      try {
        client.write(': ping\n\n');
      } catch {
        this.clients.delete(client);
      }
    }
  }
}

export const sseManager = new SSEManager();
