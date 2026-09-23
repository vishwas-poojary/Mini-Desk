import { db } from '../db/inMemoryDb.js';
import type { Checkout } from '@minidesk/types';
import { sseManager } from './sse.service.js';

export class CheckoutService {
  static getAll(): Checkout[] {
    return Array.from(db.checkouts.values()).reverse();
  }

  static getById(id: string): Checkout | undefined {
    return db.checkouts.get(id);
  }

  static createCheckout(memberId: string, bookId: string, loanDays = 14): Checkout {
    const member = db.members.get(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    if (member.status !== 'active') {
      throw new Error(`Cannot checkout book for member with status: ${member.status}`);
    }

    const book = db.books.get(bookId);
    if (!book) {
      throw new Error('Book not found');
    }
    if (book.availableCopies <= 0) {
      throw new Error('No available copies left for this book');
    }

    // Decrement available copies
    book.availableCopies -= 1;

    const today = new Date();
    const dueDate = new Date(today.getTime() + loanDays * 24 * 60 * 60 * 1000);

    const checkout: Checkout = {
      id: `chk_${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      bookId: book.id,
      bookTitle: book.title,
      borrowDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'borrowed',
    };

    db.checkouts.set(checkout.id, checkout);

    // Broadcast SSE events
    sseManager.broadcast('CHECKOUT_CREATED', 'checkouts', checkout);
    sseManager.broadcast('BOOK_UPDATED', 'books', book);

    return checkout;
  }

  static returnBook(checkoutId: string): Checkout {
    const checkout = db.checkouts.get(checkoutId);
    if (!checkout) {
      throw new Error('Checkout record not found');
    }
    if (checkout.status === 'returned') {
      throw new Error('Book has already been returned');
    }

    const book = db.books.get(checkout.bookId);
    if (book) {
      book.availableCopies += 1;
      sseManager.broadcast('BOOK_UPDATED', 'books', book);
    }

    checkout.status = 'returned';
    checkout.returnDate = new Date().toISOString().split('T')[0];

    sseManager.broadcast('CHECKOUT_RETURNED', 'checkouts', checkout);

    return checkout;
  }
}
