import React from 'react';
import { BookOpen, User, Calendar, RotateCcw } from 'lucide-react';
import type { Checkout } from '@minidesk/types';

interface CheckoutCardMobileProps {
  checkout: Checkout;
  onReturn?: (checkout: Checkout) => void;
}

export const CheckoutCardMobile: React.FC<CheckoutCardMobileProps> = ({ checkout, onReturn }) => {
  const isReturned = checkout.status === 'returned';
  const isOverdue = checkout.status === 'overdue';

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{checkout.bookTitle}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Borrowed by {checkout.memberName}</p>
        </div>
        <span
          className={`badge ${
            isReturned
              ? 'badge-member'
              : isOverdue
              ? 'badge-admin'
              : 'badge-librarian'
          }`}
        >
          {checkout.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} /> Borrowed: {checkout.borrowDate}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} color={isOverdue ? 'var(--accent-rose)' : 'inherit'} /> Due: {checkout.dueDate}
        </span>
        {checkout.returnDate && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)' }}>
            Returned: {checkout.returnDate}
          </span>
        )}
      </div>

      {!isReturned && onReturn && (
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', alignSelf: 'flex-start', marginTop: '4px' }}
          onClick={() => onReturn(checkout)}
        >
          <RotateCcw size={14} />
          <span>Mark as Returned</span>
        </button>
      )}
    </div>
  );
};
