import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { ProductCard } from "@/components/public/ProductCard";
import { getProductBySlug } from "@/lib/queries/products";
import {
  ChevronRight,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  BadgeCheck,
  Share2,
  Heart,
  Truck,
  Shield,
  Clock,
  CheckCircle,
  Store,
} from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  if (!data?.product) {
    return { title: "Product Not Found - WhatPrice" };
  }

  const product = data.product;

  return {
    title: `${product.name} - Best Price in Pakistan | WhatPrice`,
    description: product.description || `Buy ${product.name} at the best price. Compare prices from verified vendors on WhatPrice Pakistan.`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} at the best price in Pakistan`,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  if (!data?.product) {
    notFound();
  }

  const { product, relatedProducts, vendorProducts } = data;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${product.name} listed at PKR ${product.price.toLocaleString()} on WhatPrice.`
  );

  return (
    <PublicLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm flex-wrap">
            <Link href="/" className="text-gray-500 hover:text-blue-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/products" className="text-gray-500 hover:text-blue-600">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link href={`/categories/${product.category.slug}`} className="text-gray-500 hover:text-blue-600">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Product Main Section */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-8">
            <div className="grid md:grid-cols-2 gap-8 p-6">
              {/* Images */}
              <div>
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {product.images.slice(0, 4).map((image: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                      >
                        <img
                          src={image}
                          alt={`${product.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {/* Category & Brand */}
                <div className="flex items-center gap-3 mb-2">
                  {product.category && (
                    <Link
                      href={`/categories/${product.category.slug}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {product.category.name}
                    </Link>
                  )}
                  {product.brand && (
                    <span className="text-sm text-gray-500">• {product.brand}</span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-gray-500">({product.reviewCount || 0} reviews)</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">{product.viewCount || 0} views</span>
                </div>

                {/* Price */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      PKR {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          PKR {product.originalPrice.toLocaleString()}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                          -{discount}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 mb-6">
                  {product.isInStock ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">In Stock</span>
                      {product.stock > 0 && product.stock < 10 && (
                        <span className="text-orange-500 text-sm">
                          (Only {product.stock} left)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    </>
                  )}
                </div>

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Key Features</h3>
                    <ul className="space-y-1">
                      {product.features.slice(0, 5).map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="space-y-3">
                  {product.vendor?.whatsapp && (
                    <a
                      href={`https://wa.me/${product.vendor.whatsapp}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Contact on WhatsApp
                    </a>
                  )}
                  {product.vendor?.phone && (
                    <a
                      href={`tel:${product.vendor.phone}`}
                      className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Call Vendor
                    </a>
                  )}
                </div>

                {/* Share */}
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Description & Specs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {product.description && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">{key}</span>
                        <span className="font-medium text-gray-900">{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag: string, index: number) => (
                      <Link
                        key={index}
                        href={`/products?search=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Vendor Info */}
            <div className="space-y-6">
              {/* Vendor Card */}
              {product.vendor && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sold By</h2>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {product.vendor.logo ? (
                        <img
                          src={product.vendor.logo}
                          alt={product.vendor.storeName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {product.vendor.storeName}
                        </h3>
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">
                          {product.vendor.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({product.vendor.reviewCount || 0})
                        </span>
                      </div>
                      {product.vendor.address?.city && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          {product.vendor.address.city}
                        </div>
                      )}
                    </div>
                  </div>

                  {product.vendor.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {product.vendor.description}
                    </p>
                  )}

                  <Link
                    href={`/vendors/${product.vendor.slug}`}
                    className="block text-center py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Store
                  </Link>
                </div>
              )}

              {/* Trust Badges */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Verified Vendor</h4>
                      <p className="text-sm text-gray-500">
                        This vendor has been verified by WhatPrice
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Delivery Available</h4>
                      <p className="text-sm text-gray-500">
                        Contact vendor for delivery options
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Related Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((related) => (
                  <ProductCard
                    key={related._id}
                    product={{
                      ...related,
                      _id: related._id,
                      vendorId: related.vendorId,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* More from Vendor */}
          {vendorProducts && vendorProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                More from {product.vendor?.storeName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {vendorProducts.slice(0, 4).map((vp) => (
                  <ProductCard
                    key={vp._id}
                    product={{
                      ...vp,
                      _id: vp._id,
                      vendorId: vp.vendorId,
                    }}
                    showVendor={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
