'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../client';
import type { AuthCheckResponse, LoginResponse, RegisterResponse } from '../types';

interface VendorUser {
  id: string;
  storeName: string;
  email: string;
  verificationStatus: string;
  viewCredits?: number;
  graduationTier?: string;
}

interface UseAuthReturn {
  user: VendorUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  storeName: string;
  city: string;
  address?: string;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<VendorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<AuthCheckResponse>('/vendor/check-auth');

    if (response.ok && response.data?.authenticated && response.data.vendor) {
      setUser({
        id: response.data.vendor.id,
        storeName: response.data.vendor.storeName,
        email: response.data.vendor.email,
        verificationStatus: response.data.vendor.verificationStatus,
      });
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const response = await api.post<LoginResponse>('/vendor/login', {
      email,
      password,
    });

    if (response.ok && response.data) {
      setUser({
        id: response.data.vendor.id,
        storeName: response.data.vendor.storeName,
        email: response.data.vendor.email,
        verificationStatus: response.data.vendor.verificationStatus,
        viewCredits: response.data.vendor.viewCredits,
        graduationTier: response.data.vendor.graduationTier,
      });
      setIsLoading(false);
      return true;
    }

    setError(response.error?.message || 'Login failed');
    setIsLoading(false);
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const response = await api.post<RegisterResponse>('/vendor/register', data);

    if (response.ok && response.data) {
      // After registration, automatically log the user in
      const loginSuccess = await login(data.email, data.password);
      return loginSuccess;
    }

    setError(response.error?.message || 'Registration failed');
    setIsLoading(false);
    return false;
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    await api.post('/vendor/logout');

    setUser(null);
    setIsLoading(false);
    router.push('/vendor/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    checkAuth,
  };
}

// Hook for protecting vendor routes
export function useRequireAuth(redirectTo: string = '/vendor/login') {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { user, isLoading, isAuthenticated };
}

// Hook for redirecting authenticated users (e.g., from login page)
export function useRedirectIfAuthenticated(redirectTo: string = '/vendor/dashboard') {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  return { isLoading, isAuthenticated };
}
