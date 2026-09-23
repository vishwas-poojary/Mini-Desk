import { config } from '../config/env.js';
import type { TurnstileVerifyResult } from '@minidesk/types';

export class TurnstileService {
  private static readonly VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  static async verify(token?: string, remoteIp?: string): Promise<{ valid: boolean; reason?: string }> {
    // If no token is provided, reject
    if (!token) {
      return { valid: false, reason: 'Turnstile verification token is missing' };
    }

    // Support Cloudflare test dummy token for dev/testing
    if (token === 'XXXX.DUMMY.TOKEN.XXXX' || token === 'dummy-test-token') {
      return { valid: true };
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', config.turnstileSecretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(this.VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        return { valid: false, reason: `Turnstile API responded with status ${response.status}` };
      }

      const result = (await response.json()) as TurnstileVerifyResult;

      if (!result.success) {
        const errors = result['error-codes'] ? result['error-codes'].join(', ') : 'Unknown verification failure';
        return { valid: false, reason: `Verification failed: ${errors}` };
      }

      return { valid: true };
    } catch (err: any) {
      console.error('Turnstile verification error:', err);
      // In dev mode with test keys, if network call fails or is blocked, log and allow testing
      if (config.turnstileSecretKey.startsWith('1x00000000000000000000')) {
        console.warn('Network issue calling Cloudflare siteverify with dummy test key. Granting pass for dev mode.');
        return { valid: true };
      }
      return { valid: false, reason: 'Internal error verifying captcha' };
    }
  }
}
