import type { Request, Response } from 'express';
import { sseManager } from '../../services/sse.service.js';

export class SseController {
  static subscribe(req: Request, res: Response): void {
    sseManager.addClient(res);
  }
}
