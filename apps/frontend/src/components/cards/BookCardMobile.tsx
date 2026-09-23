import React from 'react';
import { BookOpen, MapPin, Hash, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { BookItem } from '@minidesk/types';

interface BookCardMobileProps {
  book: BookItem;
  onCheckout?: (book: BookItem) => void;
}

export const BookCardMobile: React.FC<BookCardMobileProps> = ({ book, onCheckout }) => {
  const isAvailable = book.availableCopies > 0;

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
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{book.title}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {book.author}</p>
        </div>
        <span className={`badge ${isAvailable ? 'badge-member' : 'badge-admin'}`}>
          {isAvailable ? `${book.availableCopies} Available` : 'All Loaned'}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Hash size={13} /> {book.isbn}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} /> {book.shelfLocation}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <BookOpen size={13} /> {book.category} ({book.publishedYear})
        </span>
      </div>

      {onCheckout && isAvailable && (
        <button
          type="button"
          className="btn btn-outline-cyan"
          style={{ padding: '6px 12px', fontSize: '0.8rem', marginTop: '4px' }}
          onClick={() => onCheckout(book)}
        >
          Borrow Book
        </button>
      )}
    </div>
  );
};
