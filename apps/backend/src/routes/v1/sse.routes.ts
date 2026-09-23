import { Router } from 'express';
import { SseController } from '../../controllers/v1/sse.controller.js';

const router = Router();

// Stream endpoint: GET /api/v1/sse
router.get('/', SseController.subscribe);

export default router;
