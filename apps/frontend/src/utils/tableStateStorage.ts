import type { SortingState, VisibilityState } from '@tanstack/react-table';

export interface TablePersistedState {
  sorting?: SortingState;
  columnVisibility?: VisibilityState;
  pageSize?: number;
}

const STORAGE_PREFIX = 'minidesk_table_';

export const tableStateStorage = {
  load(tableKey: string): TablePersistedState {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${tableKey}`);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  save(tableKey: string, state: TablePersistedState): void {
    try {
      const existing = this.load(tableKey);
      const merged = { ...existing, ...state };
      localStorage.setItem(`${STORAGE_PREFIX}${tableKey}`, JSON.stringify(merged));
    } catch (e) {
      console.warn(`Failed to save table state for ${tableKey}`, e);
    }
  },

  clear(tableKey: string): void {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${tableKey}`);
    } catch {
      // Ignore
    }
  },
};
