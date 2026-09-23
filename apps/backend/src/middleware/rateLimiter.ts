import type { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service.js';

interface RateLimitOptions {
  windowSeconds?: number;
  maxRequests?: number;
  message?: string;
}

/**
 * Redis-backed Sliding / Fixed Window Rate Limiter
 */
export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 120;
  const message = options.message || 'Too many requests. Please try again later.';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `ratelimit:${clientIp}:${req.baseUrl || req.path}`;

    try {
      const currentCount = await redisService.incr(key, windowSeconds);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount));

      if (currentCount > maxRequests) {
        res.status(429).json({
          message,
          retryAfterSeconds: windowSeconds,
        });
        return;
      }

      next();
    } catch (err) {
      console.warn('[RateLimiter] Error updating counter, bypassing', err);
      next();
    }
  };
};

export const apiRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 180,
  message: 'API rate limit exceeded. Please throttle your requests.',
});
