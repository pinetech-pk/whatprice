'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VendorLayout, VendorPageHeader } from '@/components/layouts/VendorLayout';
import { ProductForm, ProductFormData } from '@/components/vendor/ProductForm';
import { useVendorProducts } from '@/lib/api/hooks/useProducts';
import { api } from '@/lib/api/client';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Product } from '@/lib/api/types';

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  const { updateProduct, error: updateError } = useVendorProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoadingProduct(true);
      setLoadError(null);

      const response = await api.get<{ product: Product }>(`/vendor/products/${productId}`);

      if (response.ok && response.data) {
        setProduct(response.data.product);
      } else {
        setLoadError(response.error?.message || 'Failed to load product');
      }

      setIsLoadingProduct(false);
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleSubmit = async (data: ProductFormData): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Cast the form data to match what the API expects
    const result = await updateProduct(productId, data as unknown as Partial<Product>);
    setIsSubmitting(false);

    if (!result) {
      setSubmitError(updateError || 'Failed to update product. Please try again.');
      return false;
    }

    return true;
  };

  if (isLoadingProduct) {
    return (
      <VendorLayout>
        <PageLoading text="Loading product..." />
      </VendorLayout>
    );
  }

  if (loadError || !product) {
    return (
      <VendorLayout>
        <VendorPageHeader title="Edit Product" />
        <ErrorMessage
          message={loadError || 'Product not found'}
          variant="error"
        />
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Edit Product"
        description={`Editing: ${product.name}`}
      />

      {submitError && (
        <ErrorMessage
          message={submitError}
          onDismiss={() => setSubmitError(null)}
          className="mb-6"
        />
      )}

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />
    </VendorLayout>
  );
}
