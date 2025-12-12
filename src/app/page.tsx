import type { Metadata } from "next";
import Link from "next/link";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  Search,
  TrendingUp,
  Shield,
  Store,
  ArrowRight,
  Tag,
  Users,
  BarChart3,
  Smartphone,
  Home,
  Car,
  Shirt,
  Laptop,
  Dumbbell,
  Baby,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "WhatPrice - Pakistan's Premier Price Discovery Platform",
  description:
    "Compare prices across verified vendors in Pakistan. Find the best deals on electronics, fashion, home appliances, and more. Join thousands of smart shoppers.",
  keywords: [
    "WhatPrice",
    "Pakistan price comparison",
    "price discovery",
    "best prices Pakistan",
    "compare prices",
    "online shopping Pakistan",
  ],
  openGraph: {
    title: "WhatPrice - Pakistan's Premier Price Discovery Platform",
    description:
      "Compare prices across verified vendors. Find the best deals in Pakistan.",
    url: "https://www.whatprice.com.pk",
    siteName: "WhatPrice",
    locale: "en_US",
    type: "website",
  },
};

const featuredCategories = [
  { name: "Electronics", icon: Laptop, href: "/categories/electronics", color: "bg-blue-500" },
  { name: "Fashion", icon: Shirt, href: "/categories/fashion-clothing", color: "bg-pink-500" },
  { name: "Home & Living", icon: Home, href: "/categories/home-living", color: "bg-green-500" },
  { name: "Automotive", icon: Car, href: "/categories/automotive", color: "bg-orange-500" },
  { name: "Sports", icon: Dumbbell, href: "/categories/sports-fitness", color: "bg-purple-500" },
  { name: "Mobile Phones", icon: Smartphone, href: "/categories/mobile-phones", color: "bg-indigo-500" },
  { name: "Baby & Kids", icon: Baby, href: "/categories/baby-kids", color: "bg-yellow-500" },
  { name: "Beauty", icon: Sparkles, href: "/categories/health-beauty", color: "bg-red-500" },
];

const features = [
  {
    icon: Search,
    title: "Compare Prices",
    description: "Find the best prices across multiple verified vendors in seconds.",
  },
  {
    icon: Shield,
    title: "Verified Vendors",
    description: "All vendors are verified to ensure a safe shopping experience.",
  },
  {
    icon: TrendingUp,
    title: "Price Tracking",
    description: "Track price changes and get notified when prices drop.",
  },
  {
    icon: Tag,
    title: "Best Deals",
    description: "Discover exclusive deals and discounts from top vendors.",
  },
];

const stats = [
  { value: "1000+", label: "Products" },
  { value: "50+", label: "Verified Vendors" },
  { value: "10+", label: "Categories" },
  { value: "9 Years", label: "Trusted Platform" },
];

export default function HomePage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Find the Best Prices in{" "}
              <span className="text-yellow-400">Pakistan</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Compare prices from verified vendors across the country. Save money and
              shop smart with Pakistan&apos;s trusted price discovery platform.
            </p>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto mb-8">
              <form action="/products" method="get" className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search for products, brands, or categories..."
                  className="w-full px-6 py-4 pr-14 rounded-full text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="text-blue-200">Popular:</span>
              <Link href="/products?search=iphone" className="text-white hover:text-yellow-400 transition-colors">
                iPhone
              </Link>
              <Link href="/products?search=samsung" className="text-white hover:text-yellow-400 transition-colors">
                Samsung
              </Link>
              <Link href="/products?search=laptop" className="text-white hover:text-yellow-400 transition-colors">
                Laptops
              </Link>
              <Link href="/products?search=ac" className="text-white hover:text-yellow-400 transition-colors">
                Air Conditioners
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Browse Categories
              </h2>
              <p className="text-gray-600 mt-1">
                Explore products across popular categories
              </p>
            </div>
            <Link
              href="/categories"
              className="hidden md:inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group flex flex-col items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className={`w-14 h-14 ${category.color} rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Why Choose WhatPrice?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make it easy to find the best prices and deals across Pakistan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Finding the best prices is simple with WhatPrice
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Search Products
                </h3>
                <p className="text-gray-600 text-sm">
                  Search for any product you want to buy across all categories
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Compare Prices
                </h3>
                <p className="text-gray-600 text-sm">
                  See prices from multiple verified vendors side by side
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Contact Vendor
                </h3>
                <p className="text-gray-600 text-sm">
                  Connect directly with the vendor offering the best deal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Are You a Vendor?
              </h2>
              <p className="text-blue-100 max-w-lg">
                Join WhatPrice and reach thousands of potential customers across Pakistan.
                List your products and grow your business with our CPV model.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Store className="w-5 h-5" />
                Start Selling
              </Link>
              <Link
                href="/vendor/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Trusted by Thousands
            </h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <Users className="w-10 h-10 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">10K+</div>
                <div className="text-gray-600 text-sm">Happy Customers</div>
              </div>
              <div className="flex flex-col items-center">
                <Store className="w-10 h-10 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">50+</div>
                <div className="text-gray-600 text-sm">Verified Vendors</div>
              </div>
              <div className="flex flex-col items-center">
                <BarChart3 className="w-10 h-10 text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">9 Years</div>
                <div className="text-gray-600 text-sm">In Business</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
