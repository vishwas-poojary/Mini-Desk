import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookPlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { bookFormConfig, type BookFormValues } from './bookForm.config';

export const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: BookFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/books', values);
      navigate('/books');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add volume to catalog');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/books"
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
          <span>Back to Catalog</span>
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
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
            }}
          >
            <BookPlus size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Add New Volume
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
              Catalog a new title, assign shelf coordinates, and record copy counts.
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
        <DynamicForm
          config={bookFormConfig}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/books')}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};
