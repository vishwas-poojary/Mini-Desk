import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'minidesk_super_secret_access_jwt_key_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'minidesk_super_secret_refresh_jwt_key_2026',
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ? parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN, 10) : 900, // 15 mins
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) : 604800, // 7 days
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA',
  webauthn: {
    rpName: process.env.WEBAUTHN_RP_NAME || 'MiniDesk Library Admin',
    rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
    origin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173',
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || 'minidesk_super_secret_better_auth_key_2026_entropy_secure',
  betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:5000',
};
