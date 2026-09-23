export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'librarian' | 'member';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface TurnstileVerifyResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export interface PasskeyCredential {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt: string;
}
