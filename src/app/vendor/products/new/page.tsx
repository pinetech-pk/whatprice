'use client';

import React, { useState } from 'react';
import { VendorLayout, VendorPageHeader } from '@/components/layouts/VendorLayout';
import { ProductForm, ProductFormData } from '@/components/vendor/ProductForm';
import { useVendorProducts } from '@/lib/api/hooks/useProducts';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Product } from '@/lib/api/types';

export default function NewProductPage() {
  const { createProduct, error } = useVendorProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: ProductFormData): Promise<boolean> => {
    setIsLoading(true);
    setSubmitError(null);

    // Cast the form data to match what the API expects
    const result = await createProduct(data as unknown as Partial<Product>);
    setIsLoading(false);

    if (!result) {
      setSubmitError(error || 'Failed to create product. Please try again.');
      return false;
    }

    return true;
  };

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Add New Product"
        description="Create a new product listing for your store"
      />

      {submitError && (
        <ErrorMessage
          message={submitError}
          onDismiss={() => setSubmitError(null)}
          className="mb-6"
        />
      )}

      <ProductForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </VendorLayout>
  );
}
