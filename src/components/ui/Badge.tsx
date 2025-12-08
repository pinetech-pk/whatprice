'use client';

import React from 'react';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  dot?: boolean;
  dotColor?: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-blue-100 text-blue-700',
  secondary: 'bg-purple-100 text-purple-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-cyan-100 text-cyan-700',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  dot = false,
  dotColor,
  className = '',
}: BadgeProps) {
  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-gray-500',
    primary: 'bg-blue-500',
    secondary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-cyan-500',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor || dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

// Status badge with predefined statuses
type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'draft'
  | 'published';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'default' },
  pending: { label: 'Pending', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'primary' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} dot rounded className={className}>
      {config.label}
    </Badge>
  );
}

// Verification status badge
type VerificationStatus = 'pending' | 'verified' | 'rejected';

interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

export function VerificationBadge({ status, className = '' }: VerificationBadgeProps) {
  const config: Record<VerificationStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending Verification', variant: 'warning' },
    verified: { label: 'Verified', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant={variant} dot rounded className={className}>
      {label}
    </Badge>
  );
}

// Tier badge for vendor tiers
type TierType = 'starter' | 'growth' | 'standard';

interface TierBadgeProps {
  tier: TierType;
  className?: string;
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const config: Record<TierType, { label: string; variant: BadgeVariant }> = {
    starter: { label: 'Starter', variant: 'success' },
    growth: { label: 'Growth', variant: 'primary' },
    standard: { label: 'Standard', variant: 'secondary' },
  };

  const { label, variant } = config[tier];

  return (
    <Badge variant={variant} rounded className={`capitalize ${className}`}>
      {label}
    </Badge>
  );
}

// Placement tier badge for products
type PlacementTier = 'standard' | 'enhanced' | 'premium';

interface PlacementBadgeProps {
  tier: PlacementTier;
  className?: string;
}

export function PlacementBadge({ tier, className = '' }: PlacementBadgeProps) {
  const config: Record<PlacementTier, { label: string; variant: BadgeVariant }> = {
    standard: { label: 'Standard', variant: 'default' },
    enhanced: { label: 'Enhanced', variant: 'primary' },
    premium: { label: 'Premium', variant: 'secondary' },
  };

  const { label, variant } = config[tier];

  return (
    <Badge variant={variant} rounded className={`capitalize ${className}`}>
      {label}
    </Badge>
  );
}

// Count badge (e.g., notification count)
interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CountBadge({ count, max = 99, className = '' }: CountBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`
        inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5
        text-xs font-medium text-white bg-red-500 rounded-full
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}

export default Badge;
