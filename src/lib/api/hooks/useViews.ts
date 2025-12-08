'use client';

import { useCallback, useRef, useEffect } from 'react';
import { api } from '../client';
import type { RecordViewResponse } from '../types';

interface UseViewTrackingReturn {
  recordView: (productId: string, viewType?: string) => Promise<string | null>;
  qualifyView: (viewId: string, duration: number, scrollDepth?: number) => Promise<boolean>;
  recordClick: (viewId: string) => Promise<boolean>;
}

// Session ID management
const SESSION_KEY = 'wp_session_id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function useViewTracking(): UseViewTrackingReturn {
  const recordView = useCallback(async (
    productId: string,
    viewType: string = 'direct'
  ): Promise<string | null> => {
    const sessionId = getOrCreateSessionId();

    const response = await api.post<RecordViewResponse>('/views', {
      productId,
      sessionId,
      viewType,
    });

    if (response.ok && response.data) {
      return response.data.viewId;
    }

    return null;
  }, []);

  const qualifyView = useCallback(async (
    viewId: string,
    duration: number,
    scrollDepth?: number
  ): Promise<boolean> => {
    const response = await api.post('/views/qualify', {
      viewId,
      duration,
      scrollDepth,
    });

    return response.ok;
  }, []);

  const recordClick = useCallback(async (viewId: string): Promise<boolean> => {
    const response = await api.post('/views/click', {
      viewId,
    });

    return response.ok;
  }, []);

  return {
    recordView,
    qualifyView,
    recordClick,
  };
}

// Hook that automatically tracks product views and qualifies them
export function useProductViewTracking(productId: string | null) {
  const { recordView, qualifyView } = useViewTracking();
  const viewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const qualifiedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!productId) return;

    // Record view on mount
    const recordProductView = async () => {
      startTimeRef.current = Date.now();
      qualifiedRef.current = false;
      viewIdRef.current = await recordView(productId);
    };

    recordProductView();

    // Set up qualification check
    const qualificationTimer = setTimeout(async () => {
      if (viewIdRef.current && !qualifiedRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (duration >= 3) {
          const scrollDepth = typeof window !== 'undefined'
            ? Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
            : 0;

          const success = await qualifyView(viewIdRef.current, duration, scrollDepth);
          if (success) {
            qualifiedRef.current = true;
          }
        }
      }
    }, 3500); // Check after 3.5 seconds

    return () => {
      clearTimeout(qualificationTimer);
    };
  }, [productId, recordView, qualifyView]);

  return {
    viewId: viewIdRef.current,
    getViewId: () => viewIdRef.current,
  };
}
