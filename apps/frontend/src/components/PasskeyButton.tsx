import React, { useState } from 'react';
import { Fingerprint, Loader2, KeyRound } from 'lucide-react';
import { authApi } from '../api/auth';
import type { LoginResponse } from '@minidesk/types';

interface PasskeyButtonProps {
  email?: string;
  password?: string;
  turnstileToken?: string;
  onSuccess: (data: LoginResponse) => void;
  onError: (error: string) => void;
}

export const PasskeyButton: React.FC<PasskeyButtonProps> = ({
  email,
  password,
  turnstileToken,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Verifying Passkey...');

  // 1. Sign in with Passkey (or auto-enroll if first time on this device)
  const handlePasskeySignIn = async () => {
    setLoading(true);
    setStatusText('Verifying Passkey...');
    try {
      const loginResult = await authApi.signInWithPasskey();
      onSuccess(loginResult);
    } catch (err: any) {
      console.error('Passkey sign-in error:', err);
      if (err.name === 'NotAllowedError') {
        onError('Passkey prompt was canceled or timed out.');
        setLoading(false);
        return;
      }

      // If no passkey exists on this device yet, prompt to enroll with the selected account
      if (
        err.message?.toLowerCase().includes('passkey not found') ||
        err.message?.toLowerCase().includes('not found')
      ) {
        if (email && password) {
          try {
            setStatusText('Enrolling device passkey...');
            const loginResult = await authApi.login(
              email,
              password,
              turnstileToken || 'XXXX.DUMMY.TOKEN.XXXX'
            );
            await authApi.addPasskey('MiniDesk Device Passkey');
            onSuccess(loginResult);
            return;
          } catch (enrollErr: any) {
            if (enrollErr.name === 'NotAllowedError') {
              onError('Passkey registration prompt was canceled.');
            } else {
              onError(enrollErr.message || 'Passkey enrollment failed.');
            }
            setLoading(false);
            return;
          }
        }

        onError('No passkey registered for this device yet. Please click "Enroll Device Passkey" below.');
      } else {
        onError(
          err.response?.data?.message ||
            err.message ||
            'Passkey authentication failed. Please enroll a passkey for this device.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Explicit Enroll Device Passkey
  const handleEnrollPasskey = async () => {
    if (!email || !password) {
      onError('Please select an account or enter email & password to register a passkey.');
      return;
    }

    setLoading(true);
    setStatusText('Prompting Windows Hello / WebAuthn...');
    try {
      const loginResult = await authApi.login(
        email,
        password,
        turnstileToken || 'XXXX.DUMMY.TOKEN.XXXX'
      );
      await authApi.addPasskey('MiniDesk Device Passkey');
      onSuccess(loginResult);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        onError('Passkey registration prompt was canceled.');
      } else {
        onError(err.message || 'Passkey enrollment failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handlePasskeySignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{statusText}</span>
          </>
        ) : (
          <>
            <Fingerprint size={18} color="var(--accent-cyan)" />
            <span>Sign In with Passkey / WebAuthn</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleEnrollPasskey}
        disabled={loading}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          opacity: 0.9,
        }}
      >
        <KeyRound size={13} />
        <span>Enroll / Register Passkey for this device</span>
      </button>
    </div>
  );
};
