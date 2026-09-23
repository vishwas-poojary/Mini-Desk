import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookmarkPlus, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { createCheckoutFormConfig, type CheckoutFormValues } from './checkoutForm.config';
import type { Member, BookItem } from '@minidesk/types';

export const NewCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [membersRes, booksRes] = await Promise.all([
          apiClient.get<Member[]>('/members'),
          apiClient.get<BookItem[]>('/books'),
        ]);
        setMembers(membersRes.data.filter((m) => m.status === 'active'));
        setBooks(booksRes.data.filter((b) => b.availableCopies > 0));
      } catch (err: any) {
        console.error('Error fetching checkout dependencies:', err);
        setError('Failed to load active members or available books');
      } finally {
        setLoadingDeps(false);
      }
    };

    fetchDependencies();
  }, []);

  const handleSubmit = async (values: CheckoutFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/checkouts', values);
      navigate('/checkouts');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create checkout loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const memberOptions = members.map((m) => ({
    label: `${m.name} (${m.membershipNumber})`,
    value: m.id,
  }));

  const bookOptions = books.map((b) => ({
    label: `${b.title} — ${b.author} [${b.availableCopies} available]`,
    value: b.id,
  }));

  const formConfig = createCheckoutFormConfig(memberOptions, bookOptions);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/checkouts"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Loans</span>
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-purple)',
            }}
          >
            <BookmarkPlus size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Issue New Loan
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
              Record a book checkout to an enrolled cardholder and compute return date.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-rose)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Form Container Card */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
        }}
      >
        {loadingDeps ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px' }}>
            <Loader2 size={20} className="animate-spin" color="var(--accent-purple)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading borrower and inventory lists...</span>
          </div>
        ) : memberOptions.length === 0 || bookOptions.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>
              {memberOptions.length === 0
                ? 'No active members available. Please enroll a member first.'
                : 'No books with available stock. Please add stock to catalog first.'}
            </p>
          </div>
        ) : (
          <DynamicForm
            config={formConfig}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/checkouts')}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};
