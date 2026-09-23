import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, BookOpen, MapPin, Hash, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { appDb } from '../../db/app-db';
import { sseClient } from '../../services/sse-service';
import { DataTable } from '../../components/table/DataTable';
import { BookCardMobile } from '../../components/cards/BookCardMobile';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { bookFormConfig, type BookFormValues } from './bookForm.config';
import type { BookItem } from '@minidesk/types';

export const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await apiClient.get<BookItem[]>('/books');
      setBooks(res.data);
      // Cache in Dexie IndexedDB for offline access
      await appDb.syncBooks(res.data);
    } catch {
      // Fallback to IndexedDB cache if offline
      const cached = await appDb.books.toArray();
      if (cached.length > 0) setBooks(cached);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    // Listen for real-time catalog changes
    const unsub = sseClient.subscribe((payload) => {
      if (payload.type === 'BOOK_ADDED' || payload.type === 'BOOK_UPDATED') {
        fetchBooks();
      }
    });

    return () => unsub();
  }, []);

  const handleAddBook = async (values: BookFormValues) => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/books', values);
      setShowAddModal(false);
      await fetchBooks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add book');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable Column Configuration for TanStack Table
  const columns = useMemo<ColumnDef<BookItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title & Author',
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.original.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>by {row.original.author}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ getValue }) => (
          <span className="badge badge-librarian">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'isbn',
        header: 'ISBN',
        cell: ({ getValue }) => (
          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'shelfLocation',
        header: 'Shelf Code',
        cell: ({ getValue }) => (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <MapPin size={13} color="var(--accent-blue)" />
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'availableCopies',
        header: 'Availability',
        cell: ({ row }) => {
          const available = row.original.availableCopies;
          const total = row.original.totalCopies;
          const isFull = available > 0;
          return (
            <div>
              <span className={`badge ${isFull ? 'badge-member' : 'badge-admin'}`}>
                {available} / {total} available
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'publishedYear',
        header: 'Year',
      },
    ],
    []
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Book Catalog</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Explore, filter, and manage library volumes and shelf coordinates.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          <span>Add Volume</span>
        </button>
      </div>

      {/* TanStack Reusable DataTable with Mobile Card fallback */}
      <DataTable
        tableKey="books_catalog"
        data={books}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search title, author, category, ISBN..."
        renderMobileCard={(book) => (
          <BookCardMobile key={book.id} book={book} />
        )}
      />

      {/* Modal Dialog for Dynamic Form */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'var(--glass-blur)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '30px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <DynamicForm
              config={bookFormConfig}
              onSubmit={handleAddBook}
              onCancel={() => setShowAddModal(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};
