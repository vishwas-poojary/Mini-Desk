import React, { useState, useEffect } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import {
  BookOpen,
  Users,
  BookmarkCheck,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { apiClient } from '../../api/client';
import { sseClient } from '../../services/sse-service';
import type { User, SsePayload, BookItem, Member, Checkout } from '@minidesk/types';

interface DashboardOverviewProps {
  user: User;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ user }) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableCopies: 0,
    totalMembers: 0,
    activeCheckouts: 0,
    overdueCheckouts: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{ id: number; text: string; time: string; type: string }>>([]);
  const [passkeyStatus, setPasskeyStatus] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const [bRes, mRes, cRes] = await Promise.all([
        apiClient.get<BookItem[]>('/books'),
        apiClient.get<Member[]>('/members'),
        apiClient.get<Checkout[]>('/checkouts'),
      ]);

      const books = bRes.data;
      const members = mRes.data;
      const checkouts = cRes.data;

      setStats({
        totalBooks: books.length,
        availableCopies: books.reduce((acc, b) => acc + b.availableCopies, 0),
        totalMembers: members.length,
        activeCheckouts: checkouts.filter((c) => c.status === 'borrowed').length,
        overdueCheckouts: checkouts.filter((c) => c.status === 'overdue').length,
      });
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStats();

    const unsub = sseClient.subscribe((payload: SsePayload) => {
      fetchStats();

      let text = '';
      if (payload.type === 'BOOK_ADDED') text = `Added book "${payload.data.title}"`;
      if (payload.type === 'CHECKOUT_CREATED') text = `${payload.data.memberName} borrowed "${payload.data.bookTitle}"`;
      if (payload.type === 'CHECKOUT_RETURNED') text = `Returned "${payload.data.bookTitle}"`;
      if (payload.type === 'MEMBER_ADDED') text = `Enrolled member ${payload.data.name}`;

      if (text) {
        setRecentActivities((prev) => [
          { id: Date.now(), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: payload.type },
          ...prev.slice(0, 7),
        ]);
      }
    });

    return () => unsub();
  }, []);

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyStatus(null);
    try {
      const res = await authApi.addPasskey('MiniDesk Device Passkey');
      if (res.verified) {
        setPasskeyStatus('Passkey enrolled! You can now sign in passwordless from this device.');
      } else {
        setPasskeyStatus('Passkey registration could not be verified.');
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setPasskeyStatus('Registration canceled by user.');
      } else {
        setPasskeyStatus(err.response?.data?.message || err.message || 'Passkey registration failed');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
            Circulation metrics and live operational activity for MiniDesk Library.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/checkouts" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
            <Plus size={15} />
            <span>New Checkout</span>
          </Link>
          <Link to="/books" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 14px' }}>
            <span>View Catalog</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Metric 1 */}
        <Link to="/books" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Catalog Titles
                </p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                  {stats.totalBooks}
                </h3>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                <BookOpen size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span style={{ color: 'var(--emerald)', fontWeight: 500 }}>{stats.availableCopies} in stock</span>
              <span>• ready for loan</span>
            </div>
          </div>
        </Link>

        {/* Metric 2 */}
        <Link to="/members" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cardholders
                </p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                  {stats.totalMembers}
                </h3>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--indigo-subtle)', color: 'var(--indigo)' }}>
                <Users size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Registered members</span>
            </div>
          </div>
        </Link>

        {/* Metric 3 */}
        <Link to="/checkouts" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Loans
                </p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                  {stats.activeCheckouts}
                </h3>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--emerald-subtle)', color: 'var(--emerald)' }}>
                <BookmarkCheck size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span style={{ color: 'var(--emerald)' }}>In circulation</span>
            </div>
          </div>
        </Link>

        {/* Metric 4 */}
        <Link to="/checkouts" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Overdue Items
                </p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.overdueCheckouts > 0 ? 'var(--rose)' : 'var(--text-primary)', marginTop: '6px' }}>
                  {stats.overdueCheckouts}
                </h3>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--rose-subtle)', color: 'var(--rose)' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
              <span>{stats.overdueCheckouts > 0 ? 'Pending return notice' : 'All loans on schedule'}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Grid: Activity Feed & Security/Sync */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Circulation Feed */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Real-Time Circulation Activity
            </h2>
            <span className="badge badge-librarian" style={{ fontSize: '0.7rem' }}>
              Live SSE
            </span>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Listening for real-time library operations...</p>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Try checking out or returning a book</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentActivities.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-default)',
                    fontSize: '0.825rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background:
                          item.type === 'CHECKOUT_CREATED'
                            ? 'var(--primary)'
                            : item.type === 'CHECKOUT_RETURNED'
                            ? 'var(--emerald)'
                            : 'var(--indigo)',
                      }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.text}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & System Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Passkey Setup */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Hardware Security & Passkeys
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Enable biometric authentication (Windows Hello, Touch ID, or FIDO2 hardware key) for passwordless sign-in.
                </p>
              </div>
              <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                <KeyRound size={18} />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '8px', fontSize: '0.85rem' }}
              onClick={handleRegisterPasskey}
              disabled={passkeyLoading}
            >
              {passkeyLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Configuring Biometrics...</span>
                </>
              ) : (
                <>
                  <KeyRound size={15} color="var(--primary)" />
                  <span>Register This Device Passkey</span>
                </>
              )}
            </button>

            {passkeyStatus && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: passkeyStatus.includes('enrolled') ? 'var(--emerald-subtle)' : 'var(--rose-subtle)',
                  color: passkeyStatus.includes('enrolled') ? '#6ee7b7' : '#fca5a5',
                  border: `1px solid ${passkeyStatus.includes('enrolled') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                }}
              >
                <CheckCircle2 size={14} />
                <span>{passkeyStatus}</span>
              </div>
            )}
          </div>

          {/* System & Cache Status */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Service Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Offline Cache (IndexedDB)</span>
                <span className="badge badge-member">Synchronized</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Server-Sent Events (SSE)</span>
                <span className="badge badge-librarian">Active</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Session Security</span>
                <span className="badge badge-admin">httpOnly / In-Memory</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
