import bcrypt from 'bcryptjs';
import type { User, PasskeyCredential, Member, BookItem, Checkout } from '@minidesk/types';

export interface DbUser extends User {
  passwordHash: string;
}

export interface DbRefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
  revoked: boolean;
}

class InMemoryDatabase {
  public users: Map<string, DbUser> = new Map();
  public refreshTokens: Map<string, DbRefreshToken> = new Map();
  public passkeyCredentials: Map<string, PasskeyCredential[]> = new Map();
  public currentChallenges: Map<string, string> = new Map();
  public members: Map<string, Member> = new Map();
  public books: Map<string, BookItem> = new Map();
  public checkouts: Map<string, Checkout> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const salt = bcrypt.genSaltSync(10);

    // Seed Users
    const adminId = 'usr_admin_001';
    this.users.set('admin@minidesk.local', {
      id: adminId,
      email: 'admin@minidesk.local',
      name: 'Eleanor Vance (Head Librarian)',
      role: 'admin',
      passwordHash: bcrypt.hashSync('Admin123!', salt),
      createdAt: new Date().toISOString(),
    });

    const libId = 'usr_lib_002';
    this.users.set('librarian@minidesk.local', {
      id: libId,
      email: 'librarian@minidesk.local',
      name: 'Thomas Finch (Archivist)',
      role: 'librarian',
      passwordHash: bcrypt.hashSync('Lib123!', salt),
      createdAt: new Date().toISOString(),
    });

    const memberId = 'usr_mem_003';
    this.users.set('member@minidesk.local', {
      id: memberId,
      email: 'member@minidesk.local',
      name: 'Clara Oswald (Student)',
      role: 'member',
      passwordHash: bcrypt.hashSync('Member123!', salt),
      createdAt: new Date().toISOString(),
    });

    // Seed Members
    const mem1: Member = {
      id: 'mem_101',
      membershipNumber: 'LIB-2026-001',
      name: 'Clara Oswald',
      email: 'clara.oswald@tardis.edu',
      phone: '+1 (555) 234-5678',
      status: 'active',
      joinedDate: '2026-01-15',
    };
    const mem2: Member = {
      id: 'mem_102',
      membershipNumber: 'LIB-2026-002',
      name: 'Arthur Dent',
      email: 'arthur.dent@galaxy.org',
      phone: '+1 (555) 876-5432',
      status: 'active',
      joinedDate: '2026-02-01',
    };
    const mem3: Member = {
      id: 'mem_103',
      membershipNumber: 'LIB-2026-003',
      name: 'Ada Lovelace',
      email: 'ada@analytical-engine.org',
      phone: '+1 (555) 432-1098',
      status: 'active',
      joinedDate: '2025-11-20',
    };
    const mem4: Member = {
      id: 'mem_104',
      membershipNumber: 'LIB-2026-004',
      name: 'Gregor Samsa',
      email: 'gregor@metamorphosis.net',
      phone: '+1 (555) 987-6543',
      status: 'suspended',
      joinedDate: '2025-08-10',
    };
    [mem1, mem2, mem3, mem4].forEach((m) => this.members.set(m.id, m));

    // Seed Books (Items)
    const book1: BookItem = {
      id: 'book_201',
      isbn: '978-0141439518',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      category: 'Classic Literature',
      totalCopies: 4,
      availableCopies: 3,
      shelfLocation: 'A-12-04',
      publishedYear: 1813,
    };
    const book2: BookItem = {
      id: 'book_202',
      isbn: '978-0262033848',
      title: 'Introduction to Algorithms (CLRS)',
      author: 'Thomas H. Cormen et al.',
      category: 'Computer Science',
      totalCopies: 5,
      availableCopies: 4,
      shelfLocation: 'CS-03-01',
      publishedYear: 2009,
    };
    const book3: BookItem = {
      id: 'book_203',
      isbn: '978-0345391803',
      title: "The Hitchhiker's Guide to the Galaxy",
      author: 'Douglas Adams',
      category: 'Sci-Fi / Humor',
      totalCopies: 3,
      availableCopies: 1,
      shelfLocation: 'SF-07-02',
      publishedYear: 1979,
    };
    const book4: BookItem = {
      id: 'book_204',
      isbn: '978-0132350884',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      category: 'Software Engineering',
      totalCopies: 6,
      availableCopies: 5,
      shelfLocation: 'SE-01-09',
      publishedYear: 2008,
    };
    const book5: BookItem = {
      id: 'book_205',
      isbn: '978-0061122415',
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      category: 'Philosophy / Fiction',
      totalCopies: 2,
      availableCopies: 2,
      shelfLocation: 'PH-04-11',
      publishedYear: 1988,
    };
    [book1, book2, book3, book4, book5].forEach((b) => this.books.set(b.id, b));

    // Seed Checkouts
    const chk1: Checkout = {
      id: 'chk_301',
      memberId: mem1.id,
      memberName: mem1.name,
      bookId: book1.id,
      bookTitle: book1.title,
      borrowDate: '2026-09-10',
      dueDate: '2026-09-24',
      status: 'borrowed',
    };
    const chk2: Checkout = {
      id: 'chk_302',
      memberId: mem2.id,
      memberName: mem2.name,
      bookId: book3.id,
      bookTitle: book3.title,
      borrowDate: '2026-09-01',
      dueDate: '2026-09-15',
      status: 'overdue',
    };
    const chk3: Checkout = {
      id: 'chk_303',
      memberId: mem3.id,
      memberName: mem3.name,
      bookId: book2.id,
      bookTitle: book2.title,
      borrowDate: '2026-09-15',
      dueDate: '2026-09-29',
      status: 'borrowed',
    };
    [chk1, chk2, chk3].forEach((c) => this.checkouts.set(c.id, c));

    console.log('🌱 Seeded Demo Users & Library Master Data');
  }

  findUserByEmail(email: string): DbUser | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  findUserById(id: string): DbUser | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return undefined;
  }

  saveRefreshToken(token: string, userId: string, ttlSeconds: number) {
    this.refreshTokens.set(token, {
      token,
      userId,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      revoked: false,
    });
  }

  findRefreshToken(token: string): DbRefreshToken | undefined {
    const record = this.refreshTokens.get(token);
    if (!record || record.revoked) return undefined;
    if (new Date() > record.expiresAt) {
      this.refreshTokens.delete(token);
      return undefined;
    }
    return record;
  }

  revokeRefreshToken(token: string) {
    const record = this.refreshTokens.get(token);
    if (record) {
      record.revoked = true;
    }
  }

  getUserPasskeys(userId: string): PasskeyCredential[] {
    return this.passkeyCredentials.get(userId) || [];
  }

  saveUserPasskey(userId: string, credential: PasskeyCredential) {
    const list = this.passkeyCredentials.get(userId) || [];
    list.push(credential);
    this.passkeyCredentials.set(userId, list);
  }

  findPasskeyById(credentialId: string): { credential: PasskeyCredential; userId: string } | undefined {
    for (const [userId, list] of this.passkeyCredentials.entries()) {
      const found = list.find((c) => c.id === credentialId);
      if (found) return { credential: found, userId };
    }
    return undefined;
  }
}

export const db = new InMemoryDatabase();
