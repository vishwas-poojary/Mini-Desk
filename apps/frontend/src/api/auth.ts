import { apiClient, setAccessToken } from './client';
import { authClient } from '../lib/auth-client';
import type { LoginResponse, RefreshResponse, User } from '@minidesk/types';

export const authApi = {
  // Login with Email, Password & Turnstile token using Better Auth
  async login(email: string, password: string, turnstileToken?: string): Promise<LoginResponse> {
    const res = await authClient.signIn.email({
      email,
      password,
      fetchOptions: turnstileToken
        ? {
            headers: {
              'x-captcha-response': turnstileToken,
            },
          }
        : undefined,
    });

    if (res.error) {
      throw new Error(res.error.message || 'Login failed');
    }

    const sessionRes = await authClient.getSession();
    const user = sessionRes.data?.user as any;
    const token = sessionRes.data?.session?.token || '';
    if (token) {
      setAccessToken(token);
    }

    return {
      accessToken: token,
      expiresIn: 900,
      user: {
        id: user?.id || '',
        email: user?.email || email,
        name: user?.name || '',
        role: user?.role || 'member',
        createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      },
    };
  },

  // Refresh access token using Better Auth session
  async refresh(): Promise<RefreshResponse> {
    const sessionRes = await authClient.getSession();
    if (!sessionRes.data?.session) {
      throw new Error('No active session');
    }
    const token = sessionRes.data.session.token;
    setAccessToken(token);
    return {
      accessToken: token,
      expiresIn: 900,
    };
  },

  // Logout (revokes session and clears cookie)
  async logout(): Promise<void> {
    try {
      await authClient.signOut();
    } finally {
      setAccessToken(null);
    }
  },

  // Fetch currently authenticated user
  async fetchMe(): Promise<{ user: User }> {
    const sessionRes = await authClient.getSession();
    if (!sessionRes.data?.user) {
      throw new Error('Unauthorized');
    }
    const user = sessionRes.data.user as any;
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'member',
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      },
    };
  },

  // Passkey: Authenticate using Better Auth passkey plugin
  async signInWithPasskey(): Promise<LoginResponse> {
    const res = await authClient.signIn.passkey();
    if (res?.error) {
      throw new Error(res.error.message || 'Passkey login failed');
    }
    const sessionRes = await authClient.getSession();
    const user = sessionRes.data?.user as any;
    const token = sessionRes.data?.session?.token || '';
    if (token) {
      setAccessToken(token);
    }
    return {
      accessToken: token,
      expiresIn: 900,
      user: {
        id: user?.id || '',
        email: user?.email || '',
        name: user?.name || '',
        role: user?.role || 'member',
        createdAt: user?.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      },
    };
  },

  // Passkey: Register a new passkey using Better Auth
  async addPasskey(name?: string): Promise<{ verified: boolean }> {
    const res = await authClient.passkey.addPasskey({
      name: name || 'Default Passkey',
    });
    if (res?.error) {
      throw new Error(res.error.message || 'Passkey registration failed');
    }
    return { verified: true };
  },

  // Legacy WebAuthn fallback methods for existing components
  async getPasskeyAuthOptions(email?: string) {
    const response = await apiClient.get('/auth/passkey/auth-options', {
      params: email ? { email } : {},
    });
    return response.data;
  },

  async verifyPasskeyAuth(body: any, challengeKey: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/passkey/verify-auth', {
      body,
      challengeKey,
    });
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  async getPasskeyRegisterOptions() {
    const response = await apiClient.get('/auth/passkey/register-options');
    return response.data;
  },

  async verifyPasskeyRegister(body: any): Promise<{ verified: boolean }> {
    const response = await apiClient.post<{ verified: boolean }>('/auth/passkey/verify-register', body);
    return response.data;
  },
};
