import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { User } from '@minidesk/types';

interface SidebarProps {
  user: User;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, collapsed, onToggleCollapse }) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/books', label: 'Books Catalog', icon: BookOpen },
    { to: '/members', label: 'Members', icon: Users, roles: ['admin', 'librarian'] },
    { to: '/checkouts', label: 'Checkouts & Loans', icon: BookmarkCheck, roles: ['admin', 'librarian'] },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '230px',
        transition: 'width var(--transition-base)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 25,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 16px',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
            }}
          >
            <BookOpen size={16} />
          </div>
          {!collapsed && (
            <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              MiniDesk
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px', border: 'none', background: 'transparent' }}
            onClick={onToggleCollapse}
          >
            <ChevronLeft size={16} color="var(--text-muted)" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '8px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-xs)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all var(--transition-fast)',
              })}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} color="inherit" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid var(--border-default)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px', width: '100%', borderRadius: 'var(--radius-xs)' }}
            onClick={onToggleCollapse}
            title="Expand Sidebar"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </aside>
  );
};
