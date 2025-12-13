import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ProductCard } from "@/components/public/ProductCard";
import { SortSelect } from "@/components/public/SortSelect";
import { getCategoryBySlug, getProducts } from "@/lib/queries/products";
import {
  ChevronRight,
  Filter,
  Grid3X3,
  SlidersHorizontal,
} from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent: string | null;
  children?: Category[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found - WhatPrice" };
  }

  return {
    title: `${category.name} - Best Prices in Pakistan | WhatPrice`,
    description: category.description || `Compare prices for ${category.name} products from verified vendors across Pakistan. Find the best deals on WhatPrice.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const category = await getCategoryBySlug(slug) as Category | null;

  if (!category) {
    notFound();
  }

  const { products, filters, pagination } = await getProducts({
    categoryId: category._id,
    sort: resolvedSearchParams.sort as string | undefined,
    minPrice: resolvedSearchParams.minPrice as string | undefined,
    maxPrice: resolvedSearchParams.maxPrice as string | undefined,
    brand: resolvedSearchParams.brand as string | undefined,
    page: resolvedSearchParams.page ? parseInt(resolvedSearchParams.page as string) : 1,
  });

  const currentSort = (resolvedSearchParams.sort as string) || 'recommended';
  const currentPage = parseInt((resolvedSearchParams.page as string) || '1');

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-blue-100 max-w-2xl">
              {category.description}
            </p>
          )}
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
            <Link href="/categories" className="text-gray-500 hover:text-blue-600">
              Categories
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              {/* Subcategories */}
              {category.children && category.children.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Subcategories</h3>
                  <div className="space-y-2">
                    {category.children.map((child) => (
                      <Link
                        key={child._id}
                        href={`/categories/${child.slug}`}
                        className="block text-sm text-gray-600 hover:text-blue-600 transition-colors py-1"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Brands
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filters.brands.slice(0, 15).map((brand: string) => (
                      <Link
                        key={brand}
                        href={`/categories/${slug}?brand=${encodeURIComponent(brand)}`}
                        className={`block text-sm py-1 transition-colors ${
                          resolvedSearchParams.brand === brand
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
              {/* Sort & View Options */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{products.length}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> products
                  </div>
                  <div className="flex items-center gap-4">
                    <SortSelect currentSort={currentSort} />
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
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
                    There are no products in this category yet.
                  </p>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse All Products <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    {currentPage > 1 && (
                      <Link
                        href={`/categories/${slug}?page=${currentPage - 1}${currentSort !== 'recommended' ? `&sort=${currentSort}` : ''}`}
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
                        href={`/categories/${slug}?page=${currentPage + 1}${currentSort !== 'recommended' ? `&sort=${currentSort}` : ''}`}
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
