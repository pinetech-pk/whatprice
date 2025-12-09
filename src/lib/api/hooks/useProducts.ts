'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../client';
import type {
  Product,
  ProductsListResponse,
  ProductFilters,
  CompareResponse
} from '../types';

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;
  filters: {
    brands: string[];
    priceRange: { min: number; max: number };
  } | null;
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  setPage: (page: number) => void;
}

export function useProducts(initialFilters?: ProductFilters): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseProductsReturn['pagination']>(null);
  const [filters, setFilters] = useState<UseProductsReturn['filters']>(null);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>(initialFilters || {});

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setIsLoading(true);
    setError(null);

    const filtersToUse = newFilters || currentFilters;
    if (newFilters) {
      setCurrentFilters(newFilters);
    }

    const response = await api.get<ProductsListResponse>('/products', {
      page: filtersToUse.page,
      limit: filtersToUse.limit,
      search: filtersToUse.search,
      category: filtersToUse.category,
      brand: filtersToUse.brand,
      city: filtersToUse.city,
      minPrice: filtersToUse.minPrice,
      maxPrice: filtersToUse.maxPrice,
      sort: filtersToUse.sort,
    });

    if (response.ok && response.data) {
      setProducts(response.data.products);
      setPagination(response.data.pagination);
      setFilters(response.data.filters);
    } else {
      setError(response.error?.message || 'Failed to fetch products');
    }

    setIsLoading(false);
  }, [currentFilters]);

  const setPage = useCallback((page: number) => {
    fetchProducts({ ...currentFilters, page });
  }, [currentFilters, fetchProducts]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    isLoading,
    error,
    pagination,
    filters,
    fetchProducts,
    setPage,
  };
}

// Hook for single product
interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProduct(slug: string): UseProductReturn {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    const response = await api.get<{ product: Product }>(`/products/${slug}`);

    if (response.ok && response.data) {
      setProduct(response.data.product);
    } else {
      setError(response.error?.message || 'Failed to fetch product');
    }

    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

// Hook for price comparison
interface UseCompareReturn {
  data: CompareResponse | null;
  isLoading: boolean;
  error: string | null;
  compare: (masterProductId?: string, search?: string) => Promise<void>;
}

export function useCompare(): UseCompareReturn {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compare = useCallback(async (masterProductId?: string, search?: string) => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<CompareResponse>('/compare', {
      masterProductId,
      search,
    });

    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch comparison');
    }

    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    compare,
  };
}

// Hook for vendor's own products
interface UseVendorProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  fetchProducts: (params?: { page?: number; search?: string; category?: string }) => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product | null>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export function useVendorProducts(): UseVendorProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseVendorProductsReturn['pagination']>(null);

  const fetchProducts = useCallback(async (params?: { page?: number; search?: string; category?: string }) => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<{
      products: Product[];
      pagination: UseVendorProductsReturn['pagination'];
    }>('/vendor/products', params);

    if (response.ok && response.data) {
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } else {
      setError(response.error?.message || 'Failed to fetch products');
    }

    setIsLoading(false);
  }, []);

  const createProduct = useCallback(async (data: Partial<Product>): Promise<Product | null> => {
    const response = await api.post<{ product: Product }>('/vendor/products', data);

    if (response.ok && response.data) {
      await fetchProducts(); // Refresh list
      return response.data.product;
    }

    setError(response.error?.message || 'Failed to create product');
    return null;
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>): Promise<Product | null> => {
    const response = await api.put<{ product: Product }>(`/vendor/products/${id}`, data);

    if (response.ok && response.data) {
      await fetchProducts(); // Refresh list
      return response.data.product;
    }

    setError(response.error?.message || 'Failed to update product');
    return null;
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    const response = await api.delete(`/vendor/products/${id}`);

    if (response.ok) {
      await fetchProducts(); // Refresh list
      return true;
    }

    setError(response.error?.message || 'Failed to delete product');
    return false;
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    isLoading,
    error,
    pagination,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
