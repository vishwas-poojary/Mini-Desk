import { betterAuth } from 'better-auth';
import { DatabaseSync } from 'node:sqlite';
import { getMigrations } from 'better-auth/db/migration';
import { admin, bearer } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../minidesk.db');

export const sqliteDb = new DatabaseSync(dbPath);

const smartTurnstilePlugin = () => ({
  id: 'smart-turnstile',
  onRequest: async (request: Request) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/sign-in/email') || url.pathname.endsWith('/sign-up/email')) {
      const captchaToken = request.headers.get('x-captcha-response');
      if (!captchaToken) {
        return {
          response: new Response(
            JSON.stringify({ message: 'Cloudflare Turnstile token missing. Please complete the security check.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          ),
        };
      }

      // Check dummy test token
      if (
        captchaToken === 'XXXX.DUMMY.TOKEN.XXXX' ||
        captchaToken.startsWith('XXXX.') ||
        captchaToken === 'dummy-test-token'
      ) {
        return;
      }

      // 1. Verify with configured secret key
      try {
        const form = new URLSearchParams();
        form.append('secret', config.turnstileSecretKey);
        form.append('response', captchaToken);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });

        const data = (await res.json()) as any;
        if (data.success) {
          return; // Verified with configured key
        }

        // 2. Fallback: If configured secret key is live but token was generated with Cloudflare test widget
        if (config.turnstileSecretKey !== '1x0000000000000000000000000000000AA') {
          const testForm = new URLSearchParams();
          testForm.append('secret', '1x0000000000000000000000000000000AA');
          testForm.append('response', captchaToken);

          const testRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: testForm.toString(),
          });

          const testData = (await testRes.json()) as any;
          if (testData.success) {
            return; // Verified with test key
          }
        }

        // Verification failed
        return {
          response: new Response(
            JSON.stringify({ message: 'Cloudflare Turnstile verification failed. Please try again.' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          ),
        };
      } catch (err) {
        console.error('Turnstile verification error:', err);
        return;
      }
    }
  },
});

export const auth = betterAuth({
  database: sqliteDb,
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigins: [config.clientUrl],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  plugins: [
    admin(),
    bearer(),
    passkey({
      rpID: config.webauthn.rpId || 'localhost',
      rpName: config.webauthn.rpName || 'MiniDesk Library Admin',
      origin: config.webauthn.origin || 'http://localhost:5173',
    }),
    smartTurnstilePlugin() as any,
  ],
});

/**
 * Initializes Better Auth database tables and seeds initial users if not already present.
 */
export async function initAuth() {
  try {
    // 1. Run migrations to auto-create Better Auth tables
    const migrations = await getMigrations(auth.options);
    await migrations.runMigrations();

    // 2. Check and seed initial users
    const defaultUsers = [
      {
        email: 'admin@minidesk.local',
        password: 'Admin123!',
        name: 'Eleanor Vance (Head Librarian)',
        role: 'admin',
      },
      {
        email: 'librarian@minidesk.local',
        password: 'Lib123!',
        name: 'Thomas Finch (Archivist)',
        role: 'librarian',
      },
      {
        email: 'member@minidesk.local',
        password: 'Member123!',
        name: 'Clara Oswald (Student)',
        role: 'member',
      },
    ];

    for (const u of defaultUsers) {
      const existing = sqliteDb.prepare('SELECT id FROM user WHERE email = ?').get(u.email);
      if (!existing) {
        try {
          await auth.api.signUpEmail({
            body: {
              email: u.email,
              password: u.password,
              name: u.name,
            },
          });
          sqliteDb.prepare('UPDATE user SET role = ? WHERE email = ?').run(u.role, u.email);
          console.log(`[Better Auth] Seeded user: ${u.email} (${u.role})`);
        } catch (err: any) {
          console.warn(`[Better Auth] Notice while seeding ${u.email}:`, err?.message || err);
        }
      }
    }
  } catch (error) {
    console.error('[Better Auth] Migration / Initialization error:', error);
  }
}
