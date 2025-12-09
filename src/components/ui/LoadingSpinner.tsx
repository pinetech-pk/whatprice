'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

export function LoadingSpinner({
  size = 'md',
  className = '',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Page loading component
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

// Inline loading for buttons
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

// Skeleton loader for content
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Card skeleton for product cards
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="text" className="w-16" />
        </div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" className="w-full" />
        </td>
      ))}
    </tr>
  );
}

export default LoadingSpinner;
