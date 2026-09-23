import Dexie, { type Table } from 'dexie';
import type { BookItem, Member, Checkout } from '@minidesk/types';

export interface OfflineQueuedAction {
  id?: number;
  action: 'CREATE_CHECKOUT' | 'RETURN_BOOK' | 'ADD_BOOK' | 'ADD_MEMBER';
  endpoint: string;
  payload: any;
  createdAt: string;
}

export class MiniDeskOfflineDb extends Dexie {
  books!: Table<BookItem, string>;
  members!: Table<Member, string>;
  checkouts!: Table<Checkout, string>;
  offlineQueue!: Table<OfflineQueuedAction, number>;

  constructor() {
    super('MiniDeskOfflineDb');
    this.version(1).stores({
      books: 'id, isbn, title, author, category',
      members: 'id, membershipNumber, name, email, status',
      checkouts: 'id, memberId, bookId, status, dueDate',
      offlineQueue: '++id, action, createdAt',
    });
  }

  // Helper to sync remote books into Dexie
  async syncBooks(books: BookItem[]): Promise<void> {
    await this.transaction('rw', this.books, async () => {
      await this.books.clear();
      await this.books.bulkPut(books);
    });
  }

  // Helper to sync remote members into Dexie
  async syncMembers(members: Member[]): Promise<void> {
    await this.transaction('rw', this.members, async () => {
      await this.members.clear();
      await this.members.bulkPut(members);
    });
  }

  // Helper to sync remote checkouts into Dexie
  async syncCheckouts(checkouts: Checkout[]): Promise<void> {
    await this.transaction('rw', this.checkouts, async () => {
      await this.checkouts.clear();
      await this.checkouts.bulkPut(checkouts);
    });
  }

  // Enqueue action when network is offline
  async enqueueAction(action: OfflineQueuedAction['action'], endpoint: string, payload: any): Promise<number> {
    return await this.offlineQueue.add({
      action,
      endpoint,
      payload,
      createdAt: new Date().toISOString(),
    });
  }
}

export const appDb = new MiniDeskOfflineDb();
