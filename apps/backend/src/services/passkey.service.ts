import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { config } from '../config/env.js';
import { db } from '../db/inMemoryDb.js';

export class PasskeyService {
  static getAllowedOrigins(clientOrigin?: string): string[] {
    const origins = new Set<string>([
      config.webauthn.origin,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
    ]);
    if (clientOrigin && (clientOrigin.startsWith('http://localhost:') || clientOrigin.startsWith('http://127.0.0.1:'))) {
      origins.add(clientOrigin);
    }
    return Array.from(origins);
  }

  // 1. Generate Registration Options for a logged-in user
  static async getRegistrationOptions(userId: string, userEmail: string, userName: string) {
    const userPasskeys = db.getUserPasskeys(userId);

    const options = await generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: config.webauthn.rpId,
      userID: new TextEncoder().encode(userId),
      userName: userEmail,
      userDisplayName: userName,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Save challenge in DB for this user
    db.currentChallenges.set(`reg_${userId}`, options.challenge);

    return options;
  }

  // 2. Verify Registration Response from browser
  static async verifyRegistration(userId: string, body: any, clientOrigin?: string): Promise<VerifiedRegistrationResponse> {
    const expectedChallenge = db.currentChallenges.get(`reg_${userId}`);
    if (!expectedChallenge) {
      throw new Error('Registration challenge not found or expired');
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: PasskeyService.getAllowedOrigins(clientOrigin),
      expectedRPID: config.webauthn.rpId,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      // Store passkey
      db.saveUserPasskey(userId, {
        id: credential.id,
        userId,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        transports: body.response.transports,
        createdAt: new Date().toISOString(),
      });

      db.currentChallenges.delete(`reg_${userId}`);
    }

    return verification;
  }

  // 3. Generate Authentication Options (can be user-specific or discoverable)
  static async getAuthenticationOptions(userEmail?: string) {
    let allowCredentials: any[] | undefined = undefined;
    let challengeKey = 'auth_global';

    if (userEmail) {
      const user = db.findUserByEmail(userEmail);
      if (user) {
        challengeKey = `auth_${user.id}`;
        const passkeys = db.getUserPasskeys(user.id);
        allowCredentials = passkeys.map((p) => ({
          id: p.id,
          transports: p.transports as any,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: config.webauthn.rpId,
      allowCredentials,
      userVerification: 'preferred',
    });

    db.currentChallenges.set(challengeKey, options.challenge);

    return { options, challengeKey };
  }

  // 4. Verify Authentication Response
  static async verifyAuthentication(body: any, challengeKey: string, clientOrigin?: string) {
    const expectedChallenge = db.currentChallenges.get(challengeKey);
    if (!expectedChallenge) {
      throw new Error('Authentication challenge expired or invalid');
    }

    const passkeyRecord = db.findPasskeyById(body.id);
    if (!passkeyRecord) {
      throw new Error('Passkey credential not found');
    }

    const { credential, userId } = passkeyRecord;
    const user = db.findUserById(userId);
    if (!user) {
      throw new Error('Associated user not found');
    }

    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: PasskeyService.getAllowedOrigins(clientOrigin),
      expectedRPID: config.webauthn.rpId,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey, 'base64url'),
        counter: credential.counter,
        transports: credential.transports as any,
      },
    });

    if (verification.verified) {
      credential.counter = verification.authenticationInfo.newCounter;
      db.currentChallenges.delete(challengeKey);
    }

    return { verification, user };
  }
}
