import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  Laptop,
  Smartphone,
  Home,
  Car,
  Shirt,
  Dumbbell,
  Baby,
  Sparkles,
  Wrench,
  BookOpen,
  Utensils,
  Gamepad2,
  Heart,
  Building2,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Categories - WhatPrice",
  description:
    "Browse all product categories on WhatPrice. Find electronics, fashion, home appliances, automotive parts, and more from verified vendors across Pakistan.",
};

// Icon mapping for categories
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  electronics: Laptop,
  "mobile-phones": Smartphone,
  "home-living": Home,
  "home-appliances": Home,
  automotive: Car,
  "fashion-clothing": Shirt,
  "sports-fitness": Dumbbell,
  "baby-kids": Baby,
  "health-beauty": Sparkles,
  "tools-hardware": Wrench,
  "books-stationery": BookOpen,
  "food-groceries": Utensils,
  "gaming-entertainment": Gamepad2,
  "health-wellness": Heart,
  "real-estate": Building2,
};

// Color mapping for categories
const categoryColors: Record<string, string> = {
  electronics: "bg-blue-500",
  "mobile-phones": "bg-indigo-500",
  "home-living": "bg-green-500",
  "home-appliances": "bg-emerald-500",
  automotive: "bg-orange-500",
  "fashion-clothing": "bg-pink-500",
  "sports-fitness": "bg-purple-500",
  "baby-kids": "bg-yellow-500",
  "health-beauty": "bg-red-500",
  "tools-hardware": "bg-gray-500",
  "books-stationery": "bg-amber-500",
  "food-groceries": "bg-lime-500",
  "gaming-entertainment": "bg-violet-500",
  "health-wellness": "bg-rose-500",
  "real-estate": "bg-cyan-500",
};

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent: string | null;
  children?: Category[];
}

async function getCategories(): Promise<Category[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/categories?format=tree`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

function CategoryCard({ category }: { category: Category }) {
  const IconComponent = categoryIcons[category.slug] || Laptop;
  const colorClass = categoryColors[category.slug] || "bg-blue-500";

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className={`w-14 h-14 ${colorClass} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <IconComponent className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {category.description}
          </p>
        )}
        {category.children && category.children.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {category.children.slice(0, 3).map((child) => (
              <span
                key={child._id}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {child.name}
              </span>
            ))}
            {category.children.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                +{category.children.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {category.children?.length || 0} subcategories
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </Link>
  );
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Browse All Categories
            </h1>
            <p className="text-blue-100 text-lg">
              Explore products across all categories. Find the best prices from verified vendors in Pakistan.
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Categories</span>
          </nav>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <CategoryCard key={category._id} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Laptop className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500">Check back later for new categories.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-gray-600 mb-6">
              Try our search to find specific products across all categories.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse All Products
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
