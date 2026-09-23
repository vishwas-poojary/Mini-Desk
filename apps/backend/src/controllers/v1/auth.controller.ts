import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/env.js';
import { db } from '../../db/inMemoryDb.js';
import { redisService } from '../../services/redis.service.js';
import { TurnstileService } from '../../services/turnstile.service.js';
import { PasskeyService } from '../../services/passkey.service.js';
import type { AuthenticatedRequest } from '../../middleware/authenticator.js';

export class AuthController {
  // Helper to generate access JWT token
  private static generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      config.jwtAccessSecret,
      { expiresIn: config.accessTokenExpiresIn }
    );
  }

  // Helper to generate refresh token
  private static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  // 1. POST /api/v1/auth/login
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password, turnstileToken } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Step 1: Verify Turnstile Token (unless bypass flag or test mode)
    const turnstileResult = await TurnstileService.verify(turnstileToken, req.ip);
    if (!turnstileResult.valid) {
      res.status(403).json({
        message: 'Cloudflare Turnstile verification failed. Please refresh and try again.',
        detail: turnstileResult.reason,
      });
      return;
    }

    // Step 2: Validate User Credentials
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    // Step 3: Mint Access and Refresh Tokens
    const accessToken = AuthController.generateAccessToken(user.id, user.role);
    const refreshToken = AuthController.generateRefreshToken();

    // Step 4: Save Refresh Token in Database
    db.saveRefreshToken(refreshToken, user.id, config.refreshTokenExpiresIn);

    // Step 5: Cache Access Token in Redis
    await redisService.set(`token:${accessToken}`, user.id, config.accessTokenExpiresIn);

    // Step 6: Set Refresh Token as an httpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: config.refreshTokenExpiresIn * 1000,
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      expiresIn: config.accessTokenExpiresIn,
    });
  }

  // 2. POST /api/v1/auth/refresh
  static async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token provided in httpOnly cookie' });
      return;
    }

    const record = db.findRefreshToken(refreshToken);
    if (!record) {
      res.status(401).json({ message: 'Invalid, expired, or revoked refresh token' });
      return;
    }

    const user = db.findUserById(record.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Mint fresh access token
    const newAccessToken = AuthController.generateAccessToken(user.id, user.role);
    await redisService.set(`token:${newAccessToken}`, user.id, config.accessTokenExpiresIn);

    res.status(200).json({
      accessToken: newAccessToken,
      expiresIn: config.accessTokenExpiresIn,
    });
  }

  // 3. POST /api/v1/auth/logout
  static async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      db.revokeRefreshToken(refreshToken);
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await redisService.del(`token:${token}`);
    }

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  // 4. GET /api/v1/auth/me
  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({ user: req.user });
  }

  // 5. GET /api/v1/auth/passkey/auth-options
  static async getPasskeyAuthOptions(req: Request, res: Response): Promise<void> {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email : undefined;
      const { options, challengeKey } = await PasskeyService.getAuthenticationOptions(email);

      res.status(200).json({ options, challengeKey });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to generate passkey authentication options', error: err.message });
    }
  }

  // 6. POST /api/v1/auth/passkey/verify-auth
  static async verifyPasskeyAuth(req: Request, res: Response): Promise<void> {
    const { body, challengeKey } = req.body;
    if (!body || !challengeKey) {
      res.status(400).json({ message: 'Missing passkey credential response or challengeKey' });
      return;
    }

    try {
      const clientOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
      const { verification, user } = await PasskeyService.verifyAuthentication(body, challengeKey, clientOrigin);

      if (!verification.verified) {
        res.status(401).json({ message: 'Passkey verification failed' });
        return;
      }

      // Successful passkey auth - generate tokens
      const accessToken = AuthController.generateAccessToken(user.id, user.role);
      const refreshToken = AuthController.generateRefreshToken();

      db.saveRefreshToken(refreshToken, user.id, config.refreshTokenExpiresIn);
      await redisService.set(`token:${accessToken}`, user.id, config.accessTokenExpiresIn);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: config.refreshTokenExpiresIn * 1000,
      });

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
        accessToken,
        expiresIn: config.accessTokenExpiresIn,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Failed to authenticate with passkey' });
    }
  }

  // 7. GET /api/v1/auth/passkey/register-options (Protected)
  static async getPasskeyRegisterOptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const options = await PasskeyService.getRegistrationOptions(req.user.id, req.user.email, req.user.name);
      res.status(200).json(options);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to generate registration options', error: err.message });
    }
  }

  // 8. POST /api/v1/auth/passkey/verify-register (Protected)
  static async verifyPasskeyRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const clientOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
      const result = await PasskeyService.verifyRegistration(req.user.id, req.body, clientOrigin);
      res.status(200).json({ verified: result.verified });
    } catch (err: any) {
      res.status(400).json({ message: err.message || 'Passkey registration failed' });
    }
  }
}
