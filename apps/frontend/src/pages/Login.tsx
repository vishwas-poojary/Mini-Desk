import React, { useState } from 'react';
import { BookOpen, Lock, Mail, ShieldAlert, ArrowRight, Fingerprint, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth';
import { TurnstileWidget } from '../components/TurnstileWidget';
import { PasskeyButton } from '../components/PasskeyButton';
import type { LoginResponse } from '@minidesk/types';

interface LoginProps {
  onLoginSuccess: (data: LoginResponse) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@minidesk.local');
  const [password, setPassword] = useState('Admin123!');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'admin' | 'librarian' | 'member'>('admin');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let activeToken = turnstileToken;
    if (!activeToken && typeof window !== 'undefined' && (window as any).turnstile) {
      try {
        activeToken = (window as any).turnstile.getResponse();
      } catch {
        // ignore
      }
    }

    // If using Cloudflare test key and token state missed callback, use standard test token
    if (!activeToken && (import.meta.env.VITE_TURNSTILE_SITE_KEY?.startsWith('1x00000000000000000000') || !import.meta.env.VITE_TURNSTILE_SITE_KEY)) {
      activeToken = 'XXXX.DUMMY.TOKEN.XXXX';
    }

    if (!activeToken) {
      setErrorMessage('Please complete the Cloudflare Turnstile security check.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login(email, password, activeToken);
      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Login failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (role: 'admin' | 'librarian' | 'member', demoEmail: string, demoPass: string) => {
    setActiveRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'var(--bg-app)',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 30px',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              marginBottom: '12px',
            }}
          >
            <BookOpen size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            MiniDesk Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Library & Member Operations
          </p>
        </div>

        {/* Quick Demo Segmented Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '3px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            gap: '3px',
          }}
        >
          {(['admin', 'librarian', 'member'] as const).map((role) => {
            const isActive = activeRole === role;
            const emails = {
              admin: { email: 'admin@minidesk.local', pass: 'Admin123!', label: 'Admin' },
              librarian: { email: 'librarian@minidesk.local', pass: 'Lib123!', label: 'Librarian' },
              member: { email: 'member@minidesk.local', pass: 'Member123!', label: 'Member' },
            };
            return (
              <button
                key={role}
                type="button"
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: '0.775rem',
                  fontWeight: isActive ? 600 : 500,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.06)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => handleDemoSelect(role, emails[role].email, emails[role].pass)}
              >
                {emails[role].label}
              </button>
            );
          })}
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            style={{
              background: 'var(--rose-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <ShieldAlert size={16} color="var(--rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handlePasswordSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email-input">
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                className="input-field"
                placeholder="name@minidesk.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '36px' }}
              />
              <Mail
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password-input">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '36px' }}
              />
              <Lock
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Passkey Authentication */}
        <PasskeyButton
          email={email}
          password={password}
          turnstileToken={turnstileToken || undefined}
          onSuccess={onLoginSuccess}
          onError={(err) => setErrorMessage(err)}
        />
      </div>
    </div>
  );
};
