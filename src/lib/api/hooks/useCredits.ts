'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../client';
import type { CreditsResponse, CreditBalance, CreditTransaction } from '../types';

interface UseCreditsReturn {
  balance: CreditBalance | null;
  transactions: CreditTransaction[];
  pricingTiers: CreditsResponse['pricingTiers'];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  fetchCredits: (params?: { page?: number; type?: string }) => Promise<void>;
  purchaseCredits: (amount: number) => Promise<boolean>;
  setPage: (page: number) => void;
}

export function useCredits(): UseCreditsReturn {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pricingTiers, setPricingTiers] = useState<CreditsResponse['pricingTiers']>([]);
  const [pagination, setPagination] = useState<UseCreditsReturn['pagination']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<{ page?: number; type?: string }>({});

  const fetchCredits = useCallback(async (params?: { page?: number; type?: string }) => {
    setIsLoading(true);
    setError(null);

    const paramsToUse = params || currentParams;
    if (params) {
      setCurrentParams(params);
    }

    const response = await api.get<CreditsResponse>('/vendor/credits', paramsToUse);

    if (response.ok && response.data) {
      setBalance(response.data.balance);
      setTransactions(response.data.transactions);
      setPricingTiers(response.data.pricingTiers);
      setPagination(response.data.pagination);
    } else {
      setError(response.error?.message || 'Failed to fetch credits');
    }

    setIsLoading(false);
  }, [currentParams]);

  const purchaseCredits = useCallback(async (amount: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const response = await api.post<{
      message: string;
      transaction: CreditTransaction;
      newBalance: number;
    }>('/vendor/credits', { amount });

    if (response.ok && response.data) {
      // Refresh credits data after purchase
      await fetchCredits();
      return true;
    }

    setError(response.error?.message || 'Failed to purchase credits');
    setIsLoading(false);
    return false;
  }, [fetchCredits]);

  const setPage = useCallback((page: number) => {
    fetchCredits({ ...currentParams, page });
  }, [currentParams, fetchCredits]);

  useEffect(() => {
    fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    balance,
    transactions,
    pricingTiers,
    pagination,
    isLoading,
    error,
    fetchCredits,
    purchaseCredits,
    setPage,
  };
}

// Hook for just credit balance (lightweight)
export function useCreditBalance() {
  const [balance, setBalance] = useState<number>(0);
  const [tier, setTier] = useState<string>('starter');
  const [cpvRate, setCpvRate] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);

    const response = await api.get<CreditsResponse>('/vendor/credits', { limit: 1 });

    if (response.ok && response.data) {
      setBalance(response.data.balance.balance);
      setTier(response.data.balance.tier);
      setCpvRate(response.data.balance.cpvRate);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    tier,
    cpvRate,
    estimatedViews: cpvRate > 0 ? Math.floor((balance / cpvRate) * 100) : 0,
    isLoading,
    refetch: fetchBalance,
  };
}
