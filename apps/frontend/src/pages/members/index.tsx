import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { apiClient } from '../../api/client';
import { appDb } from '../../db/app-db';
import { sseClient } from '../../services/sse-service';
import { DataTable } from '../../components/table/DataTable';
import { MemberCardMobile } from '../../components/cards/MemberCardMobile';
import type { Member } from '@minidesk/types';

export const MembersPage: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get<Member[]>('/members');
      setMembers(res.data);
      await appDb.syncMembers(res.data);
    } catch {
      const cached = await appDb.members.toArray();
      if (cached.length > 0) setMembers(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();

    const unsub = sseClient.subscribe((payload) => {
      if (payload.type === 'MEMBER_ADDED') {
        fetchMembers();
      }
    });

    return () => unsub();
  }, []);


  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: 'membershipNumber',
        header: 'Card ID',
        cell: ({ getValue }) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-blue)' }}>
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Member Name',
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.original.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => (
          <span style={{ fontSize: '0.85rem' }}>{(getValue() as string) || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          return (
            <span
              className={`badge ${
                status === 'active'
                  ? 'badge-member'
                  : status === 'suspended'
                  ? 'badge-admin'
                  : 'badge-librarian'
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'joinedDate',
        header: 'Enrolled On',
        cell: ({ getValue }) => (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Member Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Library cardholders, membership status, and borrowing permissions.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/members/new')}
        >
          <UserPlus size={16} />
          <span>Enroll Member</span>
        </button>
      </div>

      <DataTable
        tableKey="members_directory"
        data={members}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search member by name, card #, or email..."
        renderMobileCard={(member) => (
          <MemberCardMobile key={member.id} member={member} />
        )}
      />
    </div>
  );
};
