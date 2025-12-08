'use client';

import React from 'react';
import {
  Package,
  Search,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  CreditCard,
  LucideIcon,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex justify-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios

export function NoProductsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="No products found"
      description="Try adjusting your search or filter criteria to find what you're looking for."
      action={onReset ? { label: 'Clear filters', onClick: onReset } : undefined}
    />
  );
}

export function NoVendorProducts({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No products yet"
      description="Start by adding your first product to showcase to potential customers."
      action={{ label: 'Add Product', onClick: onAdd }}
    />
  );
}

export function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Your cart is empty"
      description="Looks like you haven't added anything to your cart yet."
      action={{ label: 'Browse Products', onClick: onBrowse }}
    />
  );
}

export function NoTransactions() {
  return (
    <EmptyState
      icon={CreditCard}
      title="No transactions yet"
      description="Your transaction history will appear here once you start using credits."
    />
  );
}

export function NoOrders() {
  return (
    <EmptyState
      icon={FileText}
      title="No orders yet"
      description="You haven't received any orders yet. Once customers start ordering, they'll appear here."
    />
  );
}

export function NoReviews() {
  return (
    <EmptyState
      icon={Users}
      title="No reviews yet"
      description="Customer reviews will appear here once you start getting feedback."
    />
  );
}

export function NoAnalyticsData({ period = 'this period' }: { period?: string }) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data available"
      description={`There's no analytics data for ${period}. Data will appear as your products receive views.`}
    />
  );
}

// Search empty state with illustration
interface SearchEmptyStateProps {
  query: string;
  onClear?: () => void;
}

export function SearchEmptyState({ query, onClear }: SearchEmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No results for &quot;{query}&quot;
      </h3>
      <p className="text-gray-500 max-w-sm mx-auto mb-4">
        We couldn&apos;t find anything matching your search. Try different keywords or check for typos.
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="text-blue-600 font-medium hover:text-blue-700"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

// Table empty state (fits inside tables)
interface TableEmptyStateProps {
  colSpan: number;
  message?: string;
}

export function TableEmptyState({
  colSpan,
  message = 'No data available',
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <p className="text-gray-500">{message}</p>
      </td>
    </tr>
  );
}

export default EmptyState;
