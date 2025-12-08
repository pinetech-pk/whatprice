'use client';

import { useState, useCallback } from 'react';
import { api } from '../client';
import type { VendorAnalyticsResponse } from '../types';

interface UseAnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

interface UseAnalyticsReturn {
  data: VendorAnalyticsResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: (params?: UseAnalyticsParams) => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<VendorAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (params?: UseAnalyticsParams) => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<VendorAnalyticsResponse>('/vendor/analytics', {
      startDate: params?.startDate,
      endDate: params?.endDate,
      period: params?.period,
    });

    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch analytics');
    }

    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchAnalytics,
  };
}

// Helper function to get date ranges
export function getDateRange(range: 'today' | 'yesterday' | 'week' | 'month' | 'quarter') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today':
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0],
      };
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case 'quarter':
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return {
        startDate: quarterAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    default:
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
  }
}
