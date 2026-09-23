import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface SortOption {
  id: string;
  label: string;
}

interface MobileSortMenuProps {
  options: SortOption[];
  currentSortField?: string;
  currentSortDesc?: boolean;
  onSortChange: (field: string, desc: boolean) => void;
}

export const MobileSortMenu: React.FC<MobileSortMenuProps> = ({
  options,
  currentSortField,
  currentSortDesc = false,
  onSortChange,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowUpDown size={14} color="var(--text-muted)" />
      <select
        className="input-field"
        style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
        value={currentSortField ? `${currentSortField}_${currentSortDesc ? 'desc' : 'asc'}` : ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          const [field, dir] = val.split('_');
          onSortChange(field, dir === 'desc');
        }}
      >
        <option value="">Sort by...</option>
        {options.map((opt) => (
          <React.Fragment key={opt.id}>
            <option value={`${opt.id}_asc`}>{opt.label} (Ascending)</option>
            <option value={`${opt.id}_desc`}>{opt.label} (Descending)</option>
          </React.Fragment>
        ))}
      </select>
    </div>
  );
};
