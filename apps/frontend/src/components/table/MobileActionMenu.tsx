import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionItem<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  danger?: boolean;
}

interface MobileActionMenuProps<T> {
  row: T;
  actions: ActionItem<T>[];
}

export function MobileActionMenu<T>({ row, actions }: MobileActionMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ padding: '6px', borderRadius: '6px' }}
        onClick={() => setOpen(!open)}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-elevated)',
            zIndex: 50,
            minWidth: '150px',
            overflow: 'hidden',
          }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: action.danger ? 'var(--accent-rose)' : 'var(--text-primary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onClick={() => {
                setOpen(false);
                action.onClick(row);
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
