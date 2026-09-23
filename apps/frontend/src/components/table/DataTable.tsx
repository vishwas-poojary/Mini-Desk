import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
} from '@tanstack/react-table';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { tableStateStorage } from '../../utils/tableStateStorage';
import { DatatableSkeleton } from './DatatableSkeleton';
import { MobilePagination } from './MobilePagination';
import { MobileSortMenu } from './MobileSortMenu';

interface DataTableProps<T extends object> {
  tableKey: string;
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  searchPlaceholder?: string;
  renderMobileCard?: (row: T) => React.ReactNode;
  headerAction?: React.ReactNode;
}

export function DataTable<T extends object>({
  tableKey,
  data,
  columns,
  loading = false,
  searchPlaceholder = 'Search records...',
  renderMobileCard,
  headerAction,
}: DataTableProps<T>) {
  // Restore persisted state from localStorage
  const initialState = useMemo(() => tableStateStorage.load(tableKey), [tableKey]);

  const [sorting, setSorting] = useState<SortingState>(initialState.sorting || []);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState.columnVisibility || {}
  );
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(initialState.pageSize || 10);
  const [showColOptions, setShowColOptions] = useState(false);

  // Responsive breakpoint check (< 640px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    tableStateStorage.save(tableKey, {
      sorting,
      columnVisibility,
      pageSize,
    });
  }, [tableKey, sorting, columnVisibility, pageSize]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Sortable column options for mobile dropdown
  const sortOptions = useMemo(() => {
    return columns
      .filter((c) => c.header && typeof c.header === 'string')
      .map((c) => ({
        id: (c as any).accessorKey || c.id || '',
        label: String(c.header),
      }))
      .filter((opt) => opt.id !== '');
  }, [columns]);

  if (loading) {
    return <DatatableSkeleton rows={5} cols={columns.length} />;
  }

  return (
    <div className="glass-card" style={{ width: '100%', overflow: 'hidden' }}>
      {/* Table Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <input
              type="text"
              className="input-field"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* Mobile Sort Menu */}
          {isMobile && sortOptions.length > 0 && (
            <MobileSortMenu
              options={sortOptions}
              currentSortField={sorting[0]?.id}
              currentSortDesc={sorting[0]?.desc}
              onSortChange={(field, desc) => setSorting([{ id: field, desc }])}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Column Visibility Selector Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              onClick={() => setShowColOptions(!showColOptions)}
            >
              <SlidersHorizontal size={14} />
              <span>Columns</span>
            </button>

            {showColOptions && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '6px',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-elevated)',
                  zIndex: 30,
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Toggle Columns
                </div>
                {table.getAllLeafColumns().map((column) => {
                  if (!column.id || column.id === 'actions') return null;
                  return (
                    <label
                      key={column.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      <span>{String(column.columnDef.header || column.id)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {headerAction}
        </div>
      </div>

      {/* Main Content: Mobile Card View (< 640px) vs Desktop HTML Table (>= 640px) */}
      {isMobile && renderMobileCard ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {table.getRowModel().rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No records match your search.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                {renderMobileCard(row.original)}
              </React.Fragment>
            ))
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const isSorted = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        style={{
                          padding: '10px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          cursor: canSort ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span>
                              {isSorted === 'asc' ? (
                                <ArrowUp size={13} color="var(--primary)" />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown size={13} color="var(--primary)" />
                              ) : (
                                <ArrowUpDown size={12} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <MobilePagination
        pageIndex={table.getState().pagination.pageIndex}
        pageCount={table.getPageCount()}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          table.setPageSize(newSize);
        }}
        totalRows={table.getFilteredRowModel().rows.length}
      />
    </div>
  );
}
