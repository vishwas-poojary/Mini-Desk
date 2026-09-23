import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePaginationProps {
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  totalRows: number;
}

export const MobilePagination: React.FC<MobilePaginationProps> = ({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  pageSize,
  onPageSizeChange,
  totalRows,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>Show</span>
        <select
          className="input-field"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>
        <span>of {totalRows} records</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Page <strong>{pageIndex + 1}</strong> of <strong>{pageCount || 1}</strong>
        </span>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
