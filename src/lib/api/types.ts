/**
 * API Types - TypeScript interfaces for API responses
 */

// Vendor Types
export interface Vendor {
  _id: string;
  userId: string;
  storeName: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  website?: string;
  phone: string;
  email: string;
  address: {
    street?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  viewCredits: number;
  totalCreditsPurchased: number;
  totalCreditsUsed: number;
  totalSpent: number;
  graduationTier: 'starter' | 'growth' | 'standard';
  graduationDate: string;
  totalViews: number;
  totalClicks: number;
  totalSales: number;
  conversionRate: number;
  rating: number;
  reviewCount: number;
  productCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfile {
  vendor: Vendor;
  user: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

// Product Types
export interface Product {
  _id: string;
  vendorId: string;
  vendor?: {
    _id: string;
    storeName: string;
    slug: string;
    logo?: string;
    rating: number;
    city: string;
  };
  masterProductId?: string;
  categoryId?: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  currency: string;
  stock: number;
  isInStock: boolean;
  productType: 'unique' | 'comparative';
  currentBid: number;
  placementTier: 'standard' | 'enhanced' | 'premium';
  dailyBudget?: number;
  totalBudget?: number;
  budgetSpent: number;
  rating: number;
  reviewCount: number;
  viewCount: number;
  todayViews: number;
  weeklyViews: number;
  monthlyViews: number;
  qualifiedViews: number;
  compareCount: number;
  contactClicks: number;
  conversionRate: number;
  avgPosition: number;
  impressions: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    brands: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'recommended' | 'price_low' | 'price_high' | 'newest' | 'rating';
}

// Master Product & Comparison Types
export interface MasterProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  categoryId: string;
  modelNumber?: string;
  specifications?: Record<string, string>;
  images: string[];
  vendorCount: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  totalViews: number;
  avgRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
}

export interface CompareResponse {
  masterProduct: MasterProduct;
  products: Product[];
  priceStats: {
    min: number;
    max: number;
    avg: number;
    count: number;
  };
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  level: number;
  baseViewRate: number;
  minBidAmount: number;
  maxBidAmount: number;
  totalProducts: number;
  totalViews: number;
  isActive: boolean;
  children?: Category[];
}

// Dashboard Types
export interface VendorDashboardResponse {
  todayStats: {
    views: number;
    qualifiedViews: number;
    contactClicks: number;
    cpvCharged: number;
  };
  yesterdayComparison: {
    views: number;
    viewsChange: number;
    qualifiedViews: number;
    qualifiedViewsChange: number;
  };
  weeklyTrend: Array<{
    date: string;
    views: number;
    qualifiedViews: number;
    cpvCharged: number;
  }>;
  topProducts: Array<{
    _id: string;
    name: string;
    views: number;
    clicks: number;
    conversionRate: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    creditChange: number;
    createdAt: string;
  }>;
  creditBalance: number;
  cpvRate: number;
  estimatedViewsRemaining: number;
  monthlySpending: {
    total: number;
    viewsCharged: number;
  };
}

// Credits Types
export interface CreditBalance {
  balance: number;
  tier: 'starter' | 'growth' | 'standard';
  cpvRate: number;
  estimatedViews: number;
}

export interface CreditTransaction {
  _id: string;
  vendorId: string;
  type: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'adjustment';
  amount?: number;
  currency?: string;
  creditsAdded?: number;
  creditsDeducted?: number;
  creditChange: number;
  creditBalanceBefore: number;
  creditBalanceAfter: number;
  reason?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  createdAt: string;
}

export interface CreditsResponse {
  balance: CreditBalance;
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  pricingTiers: Array<{
    credits: number;
    price: number;
    pricePerCredit: number;
    popular?: boolean;
  }>;
}

// Analytics Types
export interface VendorAnalyticsResponse {
  summary: {
    totalViews: number;
    qualifiedViews: number;
    contactClicks: number;
    conversionRate: number;
    totalSpent: number;
    avgCpv: number;
  };
  chartData: Array<{
    date: string;
    views: number;
    qualifiedViews: number;
    clicks: number;
    spent: number;
  }>;
  productPerformance: Array<{
    _id: string;
    name: string;
    views: number;
    qualifiedViews: number;
    clicks: number;
    conversionRate: number;
    spent: number;
  }>;
  trafficSources: {
    comparison: number;
    direct: number;
    search: number;
    category: number;
  };
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

// View Tracking Types
export interface RecordViewResponse {
  viewId: string;
  sessionId: string;
  isDuplicate: boolean;
}

// Auth Types
export interface LoginResponse {
  message: string;
  vendor: {
    id: string;
    storeName: string;
    email: string;
    verificationStatus: string;
    viewCredits: number;
    graduationTier: string;
  };
}

export interface RegisterResponse {
  message: string;
  vendor: {
    id: string;
    storeName: string;
    verificationStatus: string;
  };
}

export interface AuthCheckResponse {
  authenticated: boolean;
  vendor?: {
    id: string;
    storeName: string;
    email: string;
    verificationStatus: string;
  };
}

// Admin Types
export interface PlatformStatsResponse {
  vendors: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  products: {
    total: number;
    active: number;
  };
  views: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface AdminVendorListResponse {
  vendors: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
