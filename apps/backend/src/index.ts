import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import authRoutes from './routes/v1/auth.routes.js';
import memberRoutes from './routes/v1/member.routes.js';
import bookRoutes from './routes/v1/book.routes.js';
import checkoutRoutes from './routes/v1/checkout.routes.js';
import sseRoutes from './routes/v1/sse.routes.js';

import { toNodeHandler } from 'better-auth/node';
import { auth, initAuth } from './lib/auth.js';

const app = express();

// CORS setup supporting credentials (for httpOnly cookies)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or matching client url
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-captcha-response', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

// Mount Better Auth endpoints before json parser (Better Auth handles its own streaming body)
app.all('/api/auth/{*splat}', toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'minidesk-backend',
    timestamp: new Date().toISOString(),
  });
});

import { apiRateLimiter } from './middleware/rateLimiter.js';

// Apply Redis-backed rate limiter on /api endpoints
app.use('/api', apiRateLimiter);

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/checkouts', checkoutRoutes);
app.use('/api/v1/sse', sseRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.status && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ message: err.message || 'Invalid request format' });
    return;
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

async function startServer() {
  await initAuth();
  app.listen(config.port, () => {
    console.log(`🚀 MiniDesk Backend running on http://localhost:${config.port}`);
    console.log(`   Client URL: ${config.clientUrl}`);
    console.log(`   Better Auth mounted at: /api/auth`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MiniDesk Backend:', err);
  process.exit(1);
});

