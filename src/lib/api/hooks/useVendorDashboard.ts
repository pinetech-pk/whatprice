'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../client';
import type { VendorDashboardResponse } from '../types';

interface UseVendorDashboardReturn {
  data: VendorDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVendorDashboard(): UseVendorDashboardReturn {
  const [data, setData] = useState<VendorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<VendorDashboardResponse>('/vendor/dashboard');

    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch dashboard data');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}

// Derived hooks for specific dashboard data
export function useTodayStats() {
  const { data, isLoading, error } = useVendorDashboard();

  return {
    stats: data?.todayStats || null,
    comparison: data?.yesterdayComparison || null,
    isLoading,
    error,
  };
}

export function useWeeklyTrend() {
  const { data, isLoading, error } = useVendorDashboard();

  return {
    trend: data?.weeklyTrend || [],
    isLoading,
    error,
  };
}

export function useTopProducts() {
  const { data, isLoading, error } = useVendorDashboard();

  return {
    products: data?.topProducts || [],
    isLoading,
    error,
  };
}

export function useCreditSummary() {
  const { data, isLoading, error } = useVendorDashboard();

  return {
    balance: data?.creditBalance || 0,
    cpvRate: data?.cpvRate || 0,
    estimatedViews: data?.estimatedViewsRemaining || 0,
    monthlySpending: data?.monthlySpending || { total: 0, viewsCharged: 0 },
    isLoading,
    error,
  };
}
