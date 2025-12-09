'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Package,
  Filter,
} from 'lucide-react';
import { VendorLayout, VendorPageHeader, VendorCard } from '@/components/layouts/VendorLayout';
import { useVendorProducts } from '@/lib/api/hooks/useProducts';
import { PageLoading, ButtonSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Product } from '@/lib/api/types';

type ProductStatus = 'all' | 'active' | 'inactive';

export default function VendorProductsPage() {
  const {
    products,
    isLoading,
    error,
    pagination,
    fetchProducts,
    deleteProduct
  } = useVendorProducts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts({
      search: searchTerm,
      page: 1,
    });
  }, [searchTerm, fetchProducts]);

  const handleStatusFilter = (status: ProductStatus) => {
    setStatusFilter(status);
    fetchProducts({
      search: searchTerm,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    fetchProducts({
      search: searchTerm,
      page,
    });
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    const success = await deleteProduct(productToDelete._id);
    setIsDeleting(false);

    if (success) {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filter products based on status
  const filteredProducts = statusFilter === 'all'
    ? products
    : products.filter(p => statusFilter === 'active' ? p.isActive : !p.isActive);

  if (isLoading && products.length === 0) {
    return (
      <VendorLayout>
        <PageLoading text="Loading products..." />
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Products"
        description="Manage your product listings"
        actions={
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        }
      />

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchProducts()}
          className="mb-6"
        />
      )}

      {/* Filters */}
      <VendorCard className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, SKU, or brand..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'active', 'inactive'] as ProductStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </VendorCard>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description={searchTerm ? "Try adjusting your search or filters" : "Start by adding your first product"}
          action={!searchTerm ? {
            label: "Add Product",
            onClick: () => window.location.href = '/vendor/products/new'
          } : undefined}
        />
      ) : (
        <VendorCard padding="none">
          {isLoading && <div className="absolute top-2 right-2"><ButtonSpinner /></div>}

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.sku && `SKU: ${product.sku}`}
                            {product.brand && ` • ${product.brand}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.viewCount || 0}</div>
                      <div className="text-xs text-gray-500">
                        {product.qualifiedViews || 0} qualified
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === product._id ? null : product._id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {activeDropdown === product._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <Link
                              href={`/products/${product.slug}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <Eye className="w-4 h-4" />
                              View Product
                            </Link>
                            <Link
                              href={`/vendor/products/${product._id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit Product
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Product
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <div key={product._id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      <StatusBadge status={product.isActive ? 'active' : 'inactive'} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{product.viewCount || 0} views</span>
                      <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        href={`/vendor/products/${product._id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </VendorCard>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </VendorLayout>
  );
}
