import React from 'react';

interface DatatableSkeletonProps {
  rows?: number;
  cols?: number;
}

export const DatatableSkeleton: React.FC<DatatableSkeletonProps> = ({ rows = 5, cols = 5 }) => {
  return (
    <div style={{ width: '100%', padding: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div
          className="animate-pulse-subtle"
          style={{ height: '38px', flex: 1, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}
        />
        <div
          className="animate-pulse-subtle"
          style={{ height: '38px', width: '100px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="animate-pulse-subtle"
                style={{
                  height: '20px',
                  flex: c === 0 ? 2 : 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '4px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
