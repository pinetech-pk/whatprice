'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Tag,
  Package,
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Layers,
} from 'lucide-react';
import { VendorLayout, VendorPageHeader } from '@/components/layouts/VendorLayout';
import { api } from '@/lib/api/client';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Product } from '@/lib/api/types';

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      const response = await api.get<{ product: Product }>(`/vendor/products/${productId}`);

      if (response.ok && response.data) {
        setProduct(response.data.product);
      } else {
        setError(response.error?.message || 'Failed to load product');
      }

      setIsLoading(false);
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const copyProductLink = () => {
    if (product?.slug) {
      navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <VendorLayout>
        <PageLoading text="Loading product..." />
      </VendorLayout>
    );
  }

  if (error || !product) {
    return (
      <VendorLayout>
        <VendorPageHeader title="View Product" />
        <ErrorMessage
          message={error || 'Product not found'}
          variant="error"
        />
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-sm text-gray-500">Product Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={copyProductLink}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">Copy Link</span>
              </>
            )}
          </button>
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600">Preview</span>
          </Link>
          <Link
            href={`/vendor/products/${productId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h3>
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={url}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                <p className="text-gray-400">No images uploaded</p>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Product Name</label>
                <p className="font-medium text-gray-900">{product.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Brand</label>
                <p className="font-medium text-gray-900">{product.brand || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Model</label>
                <p className="font-medium text-gray-900">{product.productModel || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">SKU</label>
                <p className="font-medium text-gray-900">{product.sku || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Barcode</label>
                <p className="font-medium text-gray-900">{product.barcode || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Category</label>
                <p className="font-medium text-gray-900">
                  {typeof product.category === 'object' ? product.category.name : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Product Type</label>
                <p className="font-medium text-gray-900 capitalize">{product.productType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Slug</label>
                <p className="font-medium text-gray-900 text-sm">{product.slug}</p>
              </div>
            </div>

            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="text-sm text-gray-500">Description</label>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>

          {/* Features & Tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features & Tags</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 mb-2 block">Features</label>
                {product.features && product.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {feature}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No features added</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Tags</label>
                {product.tags && product.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No tags added</p>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">{key}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active</span>
                {product.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <XCircle className="w-3.5 h-3.5" />
                    No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">In Stock</span>
                {product.isInStock ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    <Package className="w-3.5 h-3.5" />
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                    <Package className="w-3.5 h-3.5" />
                    No
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Placement Tier</span>
                <span className={`px-2 py-1 rounded-full text-sm capitalize ${
                  product.placementTier === 'premium'
                    ? 'bg-purple-100 text-purple-700'
                    : product.placementTier === 'enhanced'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <Layers className="w-3.5 h-3.5 inline mr-1" />
                  {product.placementTier}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Original Price</span>
                  <span className="text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stock</span>
                <span className="font-medium text-gray-900">{product.stock} units</span>
              </div>
            </div>
          </div>

          {/* CPV Settings Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CPV Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Bid</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.currentBid || 10)}</span>
              </div>
              {product.dailyBudget && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Daily Budget</span>
                  <span className="font-medium text-gray-900">{formatCurrency(product.dailyBudget)}</span>
                </div>
              )}
              {product.totalBudget && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-medium text-gray-900">{formatCurrency(product.totalBudget)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{product.viewCount || 0}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <MousePointer className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{product.clickCount || 0}</p>
                <p className="text-xs text-gray-500">Clicks</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.totalSpent || 0)}</span>
              </div>
            </div>
          </div>

          {/* Dates Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4" />
                  Created
                </div>
                <p className="font-medium text-gray-900 text-sm mt-1">
                  {formatDate(product.createdAt)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4" />
                  Last Updated
                </div>
                <p className="font-medium text-gray-900 text-sm mt-1">
                  {formatDate(product.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
