import { db } from '../db/inMemoryDb.js';
import type { Member } from '@minidesk/types';
import { sseManager } from './sse.service.js';

export class MemberService {
  static getAll(): Member[] {
    return Array.from(db.members.values());
  }

  static getById(id: string): Member | undefined {
    return db.members.get(id);
  }

  static create(data: Omit<Member, 'id' | 'joinedDate'>): Member {
    const id = `mem_${Date.now()}`;
    const newMember: Member = {
      ...data,
      id,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    db.members.set(id, newMember);

    // Broadcast SSE
    sseManager.broadcast('MEMBER_ADDED', 'members', newMember);

    return newMember;
  }

  static update(id: string, updates: Partial<Member>): Member | undefined {
    const existing = db.members.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    db.members.set(id, updated);
    return updated;
  }

  static delete(id: string): boolean {
    return db.members.delete(id);
  }
}
