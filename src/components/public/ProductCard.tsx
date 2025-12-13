'use client';

import React from 'react';
import Link from 'next/link';
import { Star, MapPin, BadgeCheck, Zap } from 'lucide-react';

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
    rating?: number;
    address?: { city?: string };
  };
  category?: {
    name: string;
    slug: string;
  };
  placementTier?: string;
}

interface ProductCardProps {
  product: Product;
  showVendor?: boolean;
}

export function ProductCard({ product, showVendor = true }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isPremium = product.placementTier === 'premium';
  const isEnhanced = product.placementTier === 'enhanced';

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all ${
        isPremium
          ? 'border-yellow-300 ring-1 ring-yellow-200'
          : isEnhanced
          ? 'border-blue-200'
          : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isPremium && (
            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Featured
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <span className="text-xs text-blue-600 font-medium">
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[40px]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-gray-900">
            {product.rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-gray-500">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              PKR {product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                PKR {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Vendor Info */}
        {showVendor && product.vendorId && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate max-w-[120px]">{product.vendorId.storeName}</span>
              </div>
              {product.vendorId.address?.city && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{product.vendorId.address.city}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;
