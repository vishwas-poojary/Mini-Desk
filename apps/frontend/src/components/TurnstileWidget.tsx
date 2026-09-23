import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  siteKey?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onExpire,
  siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let checkInterval: any = null;
    let isCancelled = false;

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return false;

      try {
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: (token: string) => {
            if (!isCancelled) {
              setStatus('verified');
              onVerify(token);
            }
          },
          'error-callback': () => {
            if (!isCancelled) {
              setStatus('error');
              setErrorMessage('Cloudflare Turnstile could not verify this session');
            }
          },
          'expired-callback': () => {
            if (!isCancelled) {
              setStatus('ready');
              if (onExpire) onExpire();
            }
          },
        });

        setStatus('ready');
        return true;
      } catch (e: any) {
        console.warn('Turnstile render warning:', e);
        return false;
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (renderWidget() || attempts > 25) {
          clearInterval(checkInterval);
          if (attempts > 25 && status === 'loading') {
            setStatus('error');
            setErrorMessage('Turnstile widget script loading timed out');
          }
        }
      }, 200);
    }

    return () => {
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [siteKey]);

  return (
    <div style={{ marginTop: '12px', marginBottom: '16px' }}>
      <div
        ref={containerRef}
        style={{
          minHeight: '65px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />

      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.825rem', padding: '8px' }}>
          <RefreshCw size={14} className="animate-spin" />
          <span>Initializing Cloudflare Turnstile...</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', marginBottom: '6px' }}>
            <AlertCircle size={15} />
            <span>{errorMessage || 'Turnstile verification unavailable'}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.775rem', padding: '6px 10px', width: '100%' }}
            onClick={() => {
              // Pass Cloudflare testing dummy token
              setStatus('verified');
              onVerify('XXXX.DUMMY.TOKEN.XXXX');
            }}
          >
            Use Development Test Token (Bypass)
          </button>
        </div>
      )}

      {status === 'verified' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.8rem', justifyContent: 'center', marginTop: '4px' }}>
          <ShieldCheck size={14} />
          <span>Security check passed (Cloudflare Turnstile)</span>
        </div>
      )}
    </div>
  );
};
