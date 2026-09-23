import { db } from '../db/inMemoryDb.js';
import type { BookItem } from '@minidesk/types';
import { sseManager } from './sse.service.js';

export class BookService {
  static getAll(): BookItem[] {
    return Array.from(db.books.values());
  }

  static getById(id: string): BookItem | undefined {
    return db.books.get(id);
  }

  static create(data: Omit<BookItem, 'id' | 'availableCopies'>): BookItem {
    const id = `book_${Date.now()}`;
    const newBook: BookItem = {
      ...data,
      id,
      availableCopies: data.totalCopies,
    };
    db.books.set(id, newBook);

    sseManager.broadcast('BOOK_ADDED', 'books', newBook);

    return newBook;
  }

  static update(id: string, updates: Partial<BookItem>): BookItem | undefined {
    const existing = db.books.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    db.books.set(id, updated);

    sseManager.broadcast('BOOK_UPDATED', 'books', updated);

    return updated;
  }

  static delete(id: string): boolean {
    return db.books.delete(id);
  }
}
