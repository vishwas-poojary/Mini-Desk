import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { redisService } from '../services/redis.service.js';
import { db } from '../db/inMemoryDb.js';
import type { User } from '@minidesk/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
  session?: any;
}

export const authenticator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1. Check Better Auth session (works with cookies and Authorization: Bearer headers)
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session && session.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: ((session.user as any).role || 'member') as any,
        createdAt: session.user.createdAt ? new Date(session.user.createdAt).toISOString() : new Date().toISOString(),
      };
      req.session = session.session;
      req.token = session.session.token;
      return next();
    }
  } catch (betterAuthErr) {
    // Fallback to legacy check below
  }

  // 2. Fallback: check legacy JWT Bearer header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as { userId: string; role: string };

    // Check Redis session / token cache to ensure token is active and not revoked
    const isSessionActive = await redisService.get(`token:${token}`);
    if (!isSessionActive) {
      res.status(401).json({ message: 'Token session has expired or was revoked' });
      return;
    }

    const user = db.findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ message: 'User belonging to token no longer exists' });
      return;
    }

    // Attach user (without sensitive hash)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
    req.token = token;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ message: 'Invalid access token' });
  }
};
