import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { memberFormConfig, type MemberFormValues } from './memberForm.config';

export const EnrollMemberPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: MemberFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/members', values);
      navigate('/members');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Back button & Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/members"
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
          <span>Back to Members</span>
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
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <UserPlus size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Enroll Member
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
              Issue a library card, set permissions, and register contact information.
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
          config={memberFormConfig}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/members')}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};
