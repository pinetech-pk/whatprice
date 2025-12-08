'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { CompactPagination } from './Pagination';
import { TableRowSkeleton } from './LoadingSpinner';
import { TableEmptyState } from './EmptyState';

// Column definition
export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
}

// Sort state
export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortState?: SortState;
  onSort?: (column: string) => void;
  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  // Row actions
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  // Selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectChange?: (ids: Set<string>) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  sortState,
  onSort,
  pagination,
  onRowClick,
  rowClassName,
  selectable = false,
  selectedIds,
  onSelectChange,
  className = '',
}: DataTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());

  const selected = selectedIds || internalSelected;
  const setSelected = onSelectChange || setInternalSelected;

  const handleSelectAll = () => {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(keyExtractor)));
    }
  };

  const handleSelectRow = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortState?.column !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-300" />;
    }

    return sortState.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Get cell value with type safety
  const getCellValue = (item: T, column: Column<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    const value = (item as Record<string, unknown>)[column.key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${getAlignClass(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.sortable && onSort ? (
                    <button
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      {column.header}
                      {renderSortIcon(column)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRowSkeleton
                  key={index}
                  columns={columns.length + (selectable ? 1 : 0)}
                />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <TableEmptyState
                colSpan={columns.length + (selectable ? 1 : 0)}
                message={emptyMessage}
              />
            ) : (
              // Data rows
              data.map((item) => {
                const id = keyExtractor(item);
                const isSelected = selected.has(id);

                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    className={`
                      ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                      ${isSelected ? 'bg-blue-50' : ''}
                      ${rowClassName ? rowClassName(item) : ''}
                      transition-colors
                    `}
                  >
                    {selectable && (
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => handleSelectRow(id, e)}
                          onChange={() => {}} // Controlled by onClick
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-sm text-gray-900 ${getAlignClass(column.align)}`}
                      >
                        {getCellValue(item, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <CompactPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}

// Simple table for basic use cases
interface SimpleTableProps {
  headers: string[];
  rows: React.ReactNode[][];
  className?: string;
}

export function SimpleTable({ headers, rows, className = '' }: SimpleTableProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
