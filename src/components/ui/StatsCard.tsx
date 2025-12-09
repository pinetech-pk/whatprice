'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100',
  prefix,
  suffix,
  loading = false,
  className = '',
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgColor}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Mini stats for compact displays
interface MiniStatsProps {
  label: string;
  value: string | number;
  change?: number;
  className?: string;
}

export function MiniStats({ label, value, change, className = '' }: MiniStatsProps) {
  return (
    <div className={`${className}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {change !== undefined && (
          <span
            className={`text-xs font-medium ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Stats grid container
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className = '' }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {children}
    </div>
  );
}

// Credit balance card (specific for vendor portal)
interface CreditBalanceCardProps {
  balance: number;
  cpvRate: number;
  tier: string;
  estimatedViews: number;
  onTopUp?: () => void;
  className?: string;
}

export function CreditBalanceCard({
  balance,
  cpvRate,
  tier,
  estimatedViews,
  onTopUp,
  className = '',
}: CreditBalanceCardProps) {
  const tierColors = {
    starter: 'bg-green-100 text-green-700',
    growth: 'bg-blue-100 text-blue-700',
    standard: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-blue-100 text-sm mb-1">Credit Balance</p>
          <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tierColors[tier as keyof typeof tierColors] || tierColors.starter}`}>
          {tier}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div>
          <p className="text-blue-100 text-xs mb-1">CPV Rate</p>
          <p className="text-lg font-semibold">Rs {cpvRate}/100</p>
        </div>
        <div>
          <p className="text-blue-100 text-xs mb-1">Est. Views</p>
          <p className="text-lg font-semibold">{estimatedViews.toLocaleString()}</p>
        </div>
      </div>
      {onTopUp && (
        <button
          onClick={onTopUp}
          className="w-full mt-4 bg-white text-blue-600 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          Top Up Credits
        </button>
      )}
    </div>
  );
}

export default StatsCard;
