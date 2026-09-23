import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export const PwaUpdatePrompt: React.FC = () => {
  const [needRefresh, setNeedRefresh] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true);
              }
            });
          }
        });
      });
    }
  }, []);

  if (!needRefresh) return null;

  return (
    <div
      className="glass-card"
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 1000,
        border: '1px solid var(--accent-blue)',
        background: 'rgba(15, 23, 42, 0.95)',
        boxShadow: 'var(--shadow-glow)',
      }}
    >
      <RefreshCw size={18} color="var(--accent-blue)" />
      <span style={{ fontSize: '0.85rem' }}>A new version of MiniDesk is available.</span>
      <button
        type="button"
        className="btn btn-primary"
        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        onClick={() => window.location.reload()}
      >
        Reload Now
      </button>
    </div>
  );
};
