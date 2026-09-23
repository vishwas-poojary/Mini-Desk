import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import type { User } from '@minidesk/types';

interface AuthGuardProps {
  user: User | null;
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};

interface RoleGuardProps {
  user: User;
  allowedRoles: Array<'admin' | 'librarian' | 'member'>;
  children?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ user, allowedRoles, children }) => {
  if (!allowedRoles.includes(user.role)) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '60px auto',
        }}
      >
        <ShieldAlert size={48} color="var(--accent-rose)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Your current profile role (<strong>{user.role}</strong>) does not have administrative permissions to view this resource.
        </p>
        <span className="badge badge-admin">Requires {allowedRoles.join(' or ')}</span>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
