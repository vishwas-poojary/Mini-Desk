import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { BookmarkPlus, RotateCcw, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { appDb } from '../../db/app-db';
import { sseClient } from '../../services/sse-service';
import { DataTable } from '../../components/table/DataTable';
import { CheckoutCardMobile } from '../../components/cards/CheckoutCardMobile';
import type { Checkout } from '@minidesk/types';

export const CheckoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckouts = async () => {
    try {
      const res = await apiClient.get<Checkout[]>('/checkouts');
      setCheckouts(res.data);
      await appDb.syncCheckouts(res.data);
    } catch {
      const cached = await appDb.checkouts.toArray();
      if (cached.length > 0) setCheckouts(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckouts();

    const unsub = sseClient.subscribe((payload) => {
      if (payload.type === 'CHECKOUT_CREATED' || payload.type === 'CHECKOUT_RETURNED') {
        fetchCheckouts();
      }
    });

    return () => unsub();
  }, []);

  const handleReturn = async (checkout: Checkout) => {
    try {
      await apiClient.post(`/checkouts/${checkout.id}/return`);
      await fetchCheckouts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to return book');
    }
  };

  const columns = useMemo<ColumnDef<Checkout>[]>(
    () => [
      {
        accessorKey: 'bookTitle',
        header: 'Volume Title',
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.original.bookTitle}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {row.original.bookId}</div>
          </div>
        ),
      },
      {
        accessorKey: 'memberName',
        header: 'Borrower',
        cell: ({ row }) => (
          <div style={{ fontWeight: 500 }}>{row.original.memberName}</div>
        ),
      },
      {
        accessorKey: 'borrowDate',
        header: 'Loan Date',
        cell: ({ getValue }) => (
          <span style={{ fontSize: '0.85rem' }}>{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const isOverdue = row.original.status === 'overdue';
          return (
            <span style={{ fontSize: '0.85rem', color: isOverdue ? 'var(--accent-rose)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
              {row.original.dueDate}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Loan Status',
        cell: ({ getValue }) => {
          const s = getValue() as string;
          return (
            <span
              className={`badge ${
                s === 'returned'
                  ? 'badge-member'
                  : s === 'overdue'
                  ? 'badge-admin'
                  : 'badge-librarian'
              }`}
            >
              {s}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const checkout = row.original;
          if (checkout.status === 'returned') {
            return (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} color="var(--accent-emerald)" /> Returned
              </span>
            );
          }

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleReturn(checkout)}
              >
                <RotateCcw size={13} />
                <span>Return</span>
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Loans & Checkouts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Track active circulation, manage return status, and monitor overdue volumes.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/checkouts/new')}
        >
          <BookmarkPlus size={16} />
          <span>New Checkout</span>
        </button>
      </div>

      <DataTable
        tableKey="checkouts_loans"
        data={checkouts}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search volume, member name, or status..."
        renderMobileCard={(chk) => (
          <CheckoutCardMobile key={chk.id} checkout={chk} onReturn={handleReturn} />
        )}
      />
    </div>
  );
};
