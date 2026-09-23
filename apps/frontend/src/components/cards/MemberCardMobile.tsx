import React from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import type { Member } from '@minidesk/types';

interface MemberCardMobileProps {
  member: Member;
}

export const MemberCardMobile: React.FC<MemberCardMobileProps> = ({ member }) => {
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
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={16} color="var(--primary)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{member.name}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.membershipNumber}</p>
          </div>
        </div>

        <span
          className={`badge ${
            member.status === 'active'
              ? 'badge-member'
              : member.status === 'suspended'
              ? 'badge-admin'
              : 'badge-librarian'
          }`}
        >
          {member.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={13} color="var(--text-muted)" /> {member.email}
        </span>
        {member.phone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} color="var(--text-muted)" /> {member.phone}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={13} color="var(--text-muted)" /> Joined {member.joinedDate}
        </span>
      </div>
    </div>
  );
};
