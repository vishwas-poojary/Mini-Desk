import React from 'react';
import { Wifi, WifiOff, LogOut, Menu } from 'lucide-react';
import type { User } from '@minidesk/types';

interface HeaderProps {
  user: User;
  sseConnected: boolean;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  sseConnected,
  onLogout,
  onToggleSidebar,
}) => {
  return (
    <header
      style={{
        height: '56px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebar && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 8px' }}
            onClick={onToggleSidebar}
          >
            <Menu size={16} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>MiniDesk</span>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Library Operations</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* SSE Live Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            background: sseConnected ? 'var(--emerald-subtle)' : 'var(--rose-subtle)',
            border: `1px solid ${sseConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            fontSize: '0.725rem',
            color: sseConnected ? '#6ee7b7' : '#fca5a5',
          }}
          title={sseConnected ? 'Real-time SSE event stream active' : 'SSE stream disconnected'}
        >
          {sseConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span style={{ fontWeight: 500 }}>{sseConnected ? 'Live' : 'Offline'}</span>
        </div>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.775rem',
            }}
          >
            {user.name.charAt(0)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{user.name}</span>
            <span className={`badge badge-${user.role}`} style={{ fontSize: '0.65rem' }}>
              {user.role}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.775rem', borderRadius: 'var(--radius-xs)' }}
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
