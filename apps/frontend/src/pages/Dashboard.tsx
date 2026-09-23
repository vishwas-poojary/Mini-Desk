import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import {
  LogOut,
  Shield,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  BookOpen,
  Users,
  BookmarkCheck,
  Server,
} from 'lucide-react';
import { authApi } from '../api/auth';
import { getAccessToken } from '../api/client';
import type { User } from '@minidesk/types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [passkeyStatus, setPasskeyStatus] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [apiTestResponse, setApiTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Register Passkey for this user
  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyStatus(null);
    try {
      // 1. Fetch registration options from server
      const options = await authApi.getPasskeyRegisterOptions();

      // 2. Trigger browser WebAuthn registration ceremony
      const attResp = await startRegistration({ optionsJSON: options });

      // 3. Verify on server and save credential
      const res = await authApi.verifyPasskeyRegister(attResp);
      if (res.verified) {
        setPasskeyStatus('Passkey successfully registered for this device! You can now sign in passwordless.');
      } else {
        setPasskeyStatus('Passkey registration could not be verified.');
      }
    } catch (err: any) {
      console.error('Passkey reg error:', err);
      if (err.name === 'NotAllowedError') {
        setPasskeyStatus('Registration was canceled by user or timed out.');
      } else {
        setPasskeyStatus(err.response?.data?.message || err.message || 'Passkey registration failed');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Test Refresh Token Flow
  const handleManualRefresh = async () => {
    setRefreshLoading(true);
    try {
      const data = await authApi.refresh();
      setApiTestResponse({
        type: 'Token Refresh Success',
        tokenPreview: `${data.accessToken.substring(0, 24)}...`,
        expiresIn: `${data.expiresIn}s`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setApiTestResponse({
        type: 'Refresh Failed',
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  // Test Protected Endpoint
  const handleTestProtectedEndpoint = async () => {
    setTestLoading(true);
    try {
      const res = await authApi.fetchMe();
      setApiTestResponse({
        type: 'Protected Route /api/v1/auth/me Success',
        data: res.user,
        activeToken: `${getAccessToken()?.substring(0, 24)}...`,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setApiTestResponse({
        type: 'Protected Route Failed',
        error: err.response?.data?.message || err.message,
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Navbar */}
      <header
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            }}
          >
            <BookOpen size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>MiniDesk Admin</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Library Management System
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Card 1: Auth Architecture Verification */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Auth & Token Verification</h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Test the active JWT Bearer authentication, Redis session cache, and httpOnly refresh cookie rotation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTestProtectedEndpoint}
              disabled={testLoading}
            >
              {testLoading ? <RefreshCw size={15} className="animate-spin" /> : <Server size={16} />}
              <span>Test Protected Endpoint (/me)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleManualRefresh}
              disabled={refreshLoading}
            >
              {refreshLoading ? <RefreshCw size={15} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Force Token Refresh (/refresh)</span>
            </button>
          </div>

          {/* Test Response Output */}
          {apiTestResponse && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '6px' }}>
                {apiTestResponse.type}
              </div>
              <pre style={{ overflowX: 'auto', color: 'var(--text-secondary)' }}>
                {JSON.stringify(apiTestResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Card 2: Passkey / WebAuthn Device Registration */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <KeyRound size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>WebAuthn / Passkey Device</h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Register your device biometrics (Windows Hello, TouchID, FaceID, or FIDO2 key) for passwordless login on next visit.
          </p>

          <button
            type="button"
            className="btn btn-outline-cyan"
            style={{ width: '100%' }}
            onClick={handleRegisterPasskey}
            disabled={passkeyLoading}
          >
            {passkeyLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Registering Biometric Key...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Register This Device Passkey</span>
              </>
            )}
          </button>

          {passkeyStatus && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                background: passkeyStatus.includes('successfully')
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(244, 63, 94, 0.12)',
                border: passkeyStatus.includes('successfully')
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(244, 63, 94, 0.3)',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: passkeyStatus.includes('successfully') ? '#6ee7b7' : '#fecdd3',
              }}
            >
              {passkeyStatus.includes('successfully') ? (
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
              ) : (
                <AlertCircle size={16} color="var(--accent-rose)" />
              )}
              <span>{passkeyStatus}</span>
            </div>
          )}
        </div>

        {/* Card 3: Library Domain Entities Overview */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database size={20} color="var(--accent-purple)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Library Domain Entities</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Members</span>
              </div>
              <span className="badge badge-librarian">3 Registered</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Catalog Items</span>
              </div>
              <span className="badge badge-admin">1,420 Volumes</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookmarkCheck size={16} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Active Checkouts</span>
              </div>
              <span className="badge badge-member">18 Due Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
