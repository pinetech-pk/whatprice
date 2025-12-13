import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ProductCard } from "@/components/public/ProductCard";
import {
  ChevronRight,
  Filter,
  Grid3X3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

export const metadata: Metadata = {
  title: "All Products - WhatPrice",
  description:
    "Browse all products on WhatPrice. Compare prices from verified vendors across Pakistan and find the best deals.",
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  vendorId: {
    storeName: string;
    slug: string;
    rating: number;
    address?: { city?: string };
  };
  category: {
    name: string;
    slug: string;
  };
  placementTier: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getProducts(searchParams: Record<string, string | undefined>) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const params = new URLSearchParams();

    if (searchParams.search) params.set('search', searchParams.search);
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
    if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
    if (searchParams.brand) params.set('brand', searchParams.brand);
    if (searchParams.city) params.set('city', searchParams.city);
    if (searchParams.page) params.set('page', searchParams.page);

    const res = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { products: [], filters: { brands: [], priceRange: { minPrice: 0, maxPrice: 0 } }, pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], filters: { brands: [], priceRange: { minPrice: 0, maxPrice: 0 } }, pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const [{ products, filters, pagination }, categories] = await Promise.all([
    getProducts({
      search: resolvedSearchParams.search as string | undefined,
      category: resolvedSearchParams.category as string | undefined,
      sort: resolvedSearchParams.sort as string | undefined,
      minPrice: resolvedSearchParams.minPrice as string | undefined,
      maxPrice: resolvedSearchParams.maxPrice as string | undefined,
      brand: resolvedSearchParams.brand as string | undefined,
      city: resolvedSearchParams.city as string | undefined,
      page: resolvedSearchParams.page as string | undefined,
    }),
    getCategories(),
  ]);

  const currentSort = (resolvedSearchParams.sort as string) || 'recommended';
  const currentPage = parseInt((resolvedSearchParams.page as string) || '1');
  const searchQuery = resolvedSearchParams.search as string | undefined;
  const selectedCategory = resolvedSearchParams.category as string | undefined;
  const selectedBrand = resolvedSearchParams.brand as string | undefined;

  // Get parent categories only (for filter sidebar)
  const parentCategories = categories.filter(cat => !cat.parent);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-blue-100">
            {pagination.total > 0
              ? `Found ${pagination.total} products from verified vendors`
              : 'Browse products from verified vendors across Pakistan'}
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">
              {searchQuery ? 'Search Results' : 'Products'}
            </span>
          </nav>
        </div>
      </div>

      {/* Active Filters */}
      {(searchQuery || selectedCategory || selectedBrand) && (
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Active filters:</span>
              {searchQuery && (
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  Search: {searchQuery}
                  <X className="w-3 h-3" />
                </Link>
              )}
              {selectedBrand && (
                <Link
                  href={`/products${searchQuery ? `?search=${searchQuery}` : ''}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                >
                  Brand: {selectedBrand}
                  <X className="w-3 h-3" />
                </Link>
              )}
              <Link
                href="/products"
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Clear all
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              {/* Search Box */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <form action="/products" method="get">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      defaultValue={searchQuery}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <Link
                    href={`/products${searchQuery ? `?search=${searchQuery}` : ''}`}
                    className={`block text-sm py-1 transition-colors ${
                      !selectedCategory
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    All Categories
                  </Link>
                  {parentCategories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/products?category=${category._id}${searchQuery ? `&search=${searchQuery}` : ''}`}
                      className={`block text-sm py-1 transition-colors ${
                        selectedCategory === category._id
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Price Range
                </h3>
                <div className="text-sm text-gray-500">
                  PKR {filters.priceRange?.minPrice?.toLocaleString() || 0} - PKR {filters.priceRange?.maxPrice?.toLocaleString() || 0}
                </div>
              </div>

              {/* Brand Filter */}
              {filters.brands && filters.brands.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Brands</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filters.brands.slice(0, 20).map((brand: string) => (
                      <Link
                        key={brand}
                        href={`/products?brand=${encodeURIComponent(brand)}${searchQuery ? `&search=${searchQuery}` : ''}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                        className={`block text-sm py-1 transition-colors ${
                          selectedBrand === brand
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        {brand}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Sort Options */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{products.length}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> products
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      defaultValue={currentSort}
                      onChange={(e) => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('sort', e.target.value);
                        window.location.href = url.toString();
                      }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                      <option value="newest">Newest First</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product: Product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? `No products match "${searchQuery}". Try a different search term.`
                      : 'There are no products available at the moment.'}
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse Categories <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={`/products?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ''}${currentSort !== 'recommended' ? `&sort=${currentSort}` : ''}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Previous
                      </Link>
                    )}
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    {currentPage < pagination.pages && (
                      <Link
                        href={`/products?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ''}${currentSort !== 'recommended' ? `&sort=${currentSort}` : ''}${selectedCategory ? `&category=${selectedCategory}` : ''}`}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
