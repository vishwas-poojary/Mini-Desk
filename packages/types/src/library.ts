export interface Member {
  id: string;
  membershipNumber: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'expired';
  joinedDate: string;
}

export interface BookItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  publishedYear: number;
}

export interface Checkout {
  id: string;
  memberId: string;
  memberName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

export type SseEventType = 'BOOK_ADDED' | 'BOOK_UPDATED' | 'CHECKOUT_CREATED' | 'CHECKOUT_RETURNED' | 'MEMBER_ADDED';

export interface SsePayload {
  type: SseEventType;
  entity: string;
  data: any;
  timestamp: string;
}
