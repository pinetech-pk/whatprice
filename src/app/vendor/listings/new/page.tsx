'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Package,
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Users,
  Tag,
  X,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface MasterProduct {
  _id: string;
  name: string;
  brand: string;
  modelNumber?: string;
  slug: string;
  images: string[];
  vendorCount: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  category: Category;
  vendorHasListing: boolean;
}

type Step = 'search' | 'add-price' | 'request-new';

export default function NewListingPage() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>('search');

  // Search state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [searchResults, setSearchResults] = useState<MasterProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected product for adding price
  const [selectedProduct, setSelectedProduct] = useState<MasterProduct | null>(null);

  // Add price form
  const [priceForm, setPriceForm] = useState({
    price: '',
    originalPrice: '',
    stock: '',
    sku: '',
    description: '',
  });

  // Request new product form
  const [requestForm, setRequestForm] = useState({
    name: '',
    brand: '',
    modelNumber: '',
    categoryId: '',
    description: '',
    proposedPrice: '',
    proposedOriginalPrice: '',
    proposedStock: '',
    proposedSku: '',
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Search for products
  const searchProducts = useCallback(async () => {
    if (!searchTerm && !selectedCategory && !brandFilter) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (selectedCategory) params.set('categoryId', selectedCategory);
      if (brandFilter) params.set('brand', brandFilter);

      const res = await fetch(`/api/vendor/master-products/search?${params}`);
      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      setSearchResults(data.products || []);
    } catch (err) {
      setError('Failed to search products. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, [searchTerm, selectedCategory, brandFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || selectedCategory || brandFilter) {
        searchProducts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, brandFilter, searchProducts]);

  // Handle selecting a product to add price
  const handleSelectProduct = (product: MasterProduct) => {
    if (product.vendorHasListing) {
      setError('You already have a listing for this product. Edit your existing listing instead.');
      return;
    }
    setSelectedProduct(product);
    setCurrentStep('add-price');
    setError('');
  };

  // Handle submitting price listing
  const handleSubmitPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/vendor/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProductId: selectedProduct._id,
          price: parseFloat(priceForm.price),
          originalPrice: priceForm.originalPrice ? parseFloat(priceForm.originalPrice) : undefined,
          stock: parseInt(priceForm.stock) || 0,
          sku: priceForm.sku || undefined,
          description: priceForm.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }

      setSuccess('Listing created successfully!');
      setTimeout(() => {
        router.push('/vendor/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle requesting new product
  const handleRequestProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/vendor/product-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestForm.name,
          brand: requestForm.brand,
          modelNumber: requestForm.modelNumber || undefined,
          categoryId: requestForm.categoryId,
          description: requestForm.description || undefined,
          proposedPrice: parseFloat(requestForm.proposedPrice),
          proposedOriginalPrice: requestForm.proposedOriginalPrice
            ? parseFloat(requestForm.proposedOriginalPrice)
            : undefined,
          proposedStock: parseInt(requestForm.proposedStock) || 0,
          proposedSku: requestForm.proposedSku || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'exact_duplicate') {
          setError(`This product already exists: "${data.existingProduct?.name}". Please search and add your price to the existing product.`);
          return;
        }
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(data.warning
        ? `Request submitted! Note: ${data.warning}`
        : 'Request submitted! It will be reviewed by our team.'
      );

      setTimeout(() => {
        router.push('/vendor/products');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  // Render search step
  const renderSearchStep = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">List Your Price</h1>
        <p className="text-gray-600 mt-2">
          Search for the product you want to sell and add your price
        </p>
      </div>

      {/* Search filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <input
              type="text"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              placeholder="e.g., Samsung, Apple..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Product name or model..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Search results */}
      {searching ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Searching products...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
          </h2>
          <div className="grid gap-4">
            {searchResults.map((product) => (
              <div
                key={product._id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                  product.vendorHasListing
                    ? 'border-gray-200 opacity-60'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
                }`}
                onClick={() => !product.vendorHasListing && handleSelectProduct(product)}
              >
                {/* Product image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.brand}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      {product.vendorCount} vendor{product.vendorCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Tag className="w-4 h-4" />
                      PKR {product.minPrice?.toLocaleString()}
                      {product.maxPrice !== product.minPrice && (
                        <> - {product.maxPrice?.toLocaleString()}</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {product.vendorHasListing ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Listed
                    </span>
                  ) : (
                    <button className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Add Price
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : hasSearched ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            Can&apos;t find what you&apos;re looking for? Request a new product listing.
          </p>
          <button
            onClick={() => {
              setRequestForm({
                ...requestForm,
                name: searchTerm,
                brand: brandFilter,
                categoryId: selectedCategory,
              });
              setCurrentStep('request-new');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Request New Product
          </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for a product</h3>
          <p className="text-gray-600">
            Enter a product name, select a category, or filter by brand to find products
          </p>
        </div>
      )}

      {/* Request new product link */}
      {hasSearched && searchResults.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              setRequestForm({
                ...requestForm,
                name: searchTerm,
                brand: brandFilter,
                categoryId: selectedCategory,
              });
              setCurrentStep('request-new');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Can&apos;t find your product? Request a new listing
          </button>
        </div>
      )}
    </div>
  );

  // Render add price step
  const renderAddPriceStep = () => {
    if (!selectedProduct) return null;

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => {
            setCurrentStep('search');
            setSelectedProduct(null);
            setPriceForm({ price: '', originalPrice: '', stock: '', sku: '', description: '' });
          }}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to search
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
              {selectedProduct.images?.[0] ? (
                <img
                  src={selectedProduct.images[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h1>
              <p className="text-gray-600">{selectedProduct.brand}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>{selectedProduct.vendorCount} vendor{selectedProduct.vendorCount !== 1 ? 's' : ''} selling</span>
                <span>
                  Current range: PKR {selectedProduct.minPrice?.toLocaleString()} - {selectedProduct.maxPrice?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Price form */}
        <form onSubmit={handleSubmitPrice} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Listing Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Price (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={priceForm.price}
                onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })}
                placeholder="e.g., 48500"
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (PKR)
              </label>
              <input
                type="number"
                value={priceForm.originalPrice}
                onChange={(e) => setPriceForm({ ...priceForm, originalPrice: e.target.value })}
                placeholder="e.g., 52000 (for showing discount)"
                min="1"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={priceForm.stock}
                onChange={(e) => setPriceForm({ ...priceForm, stock: e.target.value })}
                placeholder="e.g., 25"
                min="0"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your SKU (optional)
              </label>
              <input
                type="text"
                value={priceForm.sku}
                onChange={(e) => setPriceForm({ ...priceForm, sku: e.target.value })}
                placeholder="Your internal product code"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (optional)
            </label>
            <textarea
              value={priceForm.description}
              onChange={(e) => setPriceForm({ ...priceForm, description: e.target.value })}
              placeholder="Any additional details about your listing..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setCurrentStep('search');
                setSelectedProduct(null);
              }}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !priceForm.price}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Listing
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render request new product step
  const renderRequestNewStep = () => (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          setCurrentStep('search');
          setRequestForm({
            name: '',
            brand: '',
            modelNumber: '',
            categoryId: '',
            description: '',
            proposedPrice: '',
            proposedOriginalPrice: '',
            proposedStock: '',
            proposedSku: '',
          });
        }}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to search
      </button>

      {/* Header */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-semibold text-yellow-900">Request New Product Listing</h1>
            <p className="text-yellow-800 mt-1">
              This request will be reviewed by our team before the product is added to the platform.
              If a similar product already exists, your listing will be linked to it.
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Request form */}
      <form onSubmit={handleRequestProduct} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Product Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requestForm.name}
              onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
              placeholder="e.g., Samsung Galaxy S24 Ultra 256GB"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={requestForm.brand}
              onChange={(e) => setRequestForm({ ...requestForm, brand: e.target.value })}
              placeholder="e.g., Samsung"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Number
            </label>
            <input
              type="text"
              value={requestForm.modelNumber}
              onChange={(e) => setRequestForm({ ...requestForm, modelNumber: e.target.value })}
              placeholder="e.g., SM-S928B"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={requestForm.categoryId}
              onChange={(e) => setRequestForm({ ...requestForm, categoryId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Price (PKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={requestForm.proposedPrice}
              onChange={(e) => setRequestForm({ ...requestForm, proposedPrice: e.target.value })}
              placeholder="e.g., 285000"
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (PKR)
            </label>
            <input
              type="number"
              value={requestForm.proposedOriginalPrice}
              onChange={(e) => setRequestForm({ ...requestForm, proposedOriginalPrice: e.target.value })}
              placeholder="For showing discount"
              min="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              value={requestForm.proposedStock}
              onChange={(e) => setRequestForm({ ...requestForm, proposedStock: e.target.value })}
              placeholder="e.g., 10"
              min="0"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your SKU
            </label>
            <input
              type="text"
              value={requestForm.proposedSku}
              onChange={(e) => setRequestForm({ ...requestForm, proposedSku: e.target.value })}
              placeholder="Your internal code"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Description
          </label>
          <textarea
            value={requestForm.description}
            onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
            placeholder="Describe the product features, specifications, etc."
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setCurrentStep('search')}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !requestForm.name || !requestForm.brand || !requestForm.categoryId || !requestForm.proposedPrice}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {currentStep === 'search' && renderSearchStep()}
        {currentStep === 'add-price' && renderAddPriceStep()}
        {currentStep === 'request-new' && renderRequestNewStep()}
      </div>
    </div>
  );
}
