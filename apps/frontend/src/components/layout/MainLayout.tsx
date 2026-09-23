import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { sseClient } from '../../services/sse-service';
import { PwaUpdatePrompt } from '../pwa/PwaUpdatePrompt';
import type { User, SsePayload } from '@minidesk/types';
import { Bell, X } from 'lucide-react';

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ user, onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);

  // Subscribe to real-time SSE events
  useEffect(() => {
    sseClient.connect();
    setSseConnected(true);

    const unsubscribe = sseClient.subscribe((payload: SsePayload) => {
      let toastMsg = '';
      if (payload.type === 'BOOK_ADDED') {
        toastMsg = `📚 Catalog Update: "${payload.data.title}" added by ${payload.data.author}`;
      } else if (payload.type === 'CHECKOUT_CREATED') {
        toastMsg = `🔖 New Checkout: ${payload.data.memberName} borrowed "${payload.data.bookTitle}"`;
      } else if (payload.type === 'CHECKOUT_RETURNED') {
        toastMsg = `✅ Book Returned: "${payload.data.bookTitle}" checked back in`;
      } else if (payload.type === 'MEMBER_ADDED') {
        toastMsg = `👤 New Member: ${payload.data.name} enrolled (${payload.data.membershipNumber})`;
      }

      if (toastMsg) {
        const id = Date.now();
        setToasts((prev) => [...prev.slice(-3), { id, message: toastMsg, type: payload.type }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 6000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Collapsible Navigation Sidebar */}
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          user={user}
          sseConnected={sseConnected}
          onLogout={onLogout}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Floating SSE Real-Time Notification Toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-card"
            style={{
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-surface-elevated)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem' }}>
              <Bell size={15} color="var(--primary)" />
              <span style={{ color: 'var(--text-primary)' }}>{toast.message}</span>
            </div>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* PWA Update Prompt */}
      <PwaUpdatePrompt />
    </div>
  );
};
