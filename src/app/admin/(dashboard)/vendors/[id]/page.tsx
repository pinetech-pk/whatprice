'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  CreditCard,
  Package,
  FileText,
  TrendingUp,
  Eye,
  Ban,
  Trash2,
  RotateCcw,
  Loader2,
  ExternalLink,
  AlertTriangle,
  X,
  DollarSign,
  Users,
  Activity,
  ShoppingBag,
} from 'lucide-react';

interface VendorUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Listing {
  _id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  stock: number;
  isActive: boolean;
  productType: string;
  viewCount: number;
  createdAt: string;
  masterProductId?: {
    _id: string;
    name: string;
    slug: string;
    vendorCount: number;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface ProductRequest {
  _id: string;
  name: string;
  brand: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  createdAt: string;
  highestDuplicateScore: number;
}

interface Transaction {
  _id: string;
  transactionType: string;
  creditChange: number;
  creditBalanceBefore: number;
  creditBalanceAfter: number;
  status: string;
  description: string;
  createdAt: string;
}

interface VendorDetails {
  _id: string;
  userId: VendorUser;
  storeName: string;
  slug: string;
  email: string;
  phone: string;
  description?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    postalCode?: string;
    country?: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  isActive: boolean;
  isFeatured: boolean;
  viewCredits: number;
  graduationTier: string;
  totalProducts: number;
  totalViews: number;
  rating: number;
  totalReviews: number;
  createdAt: string;
  verifiedAt?: string;
  deletedAt?: string;
  deleteScheduledFor?: string;
  deletionReason?: string;
  stats: {
    listings: {
      total: number;
      active: number;
      inactive: number;
      comparative: number;
    };
    productRequests: {
      pending: number;
      approved: number;
      rejected: number;
      merged: number;
      total: number;
    };
    linkedMasterProducts: number;
    recentActivity: {
      totalViews: number;
      qualifiedViews: number;
      totalSpent: number;
    };
    transactionSummary: Record<string, { total: number; count: number }>;
  };
  recentTransactions: Transaction[];
  topProducts: Listing[];
  recentRequests: ProductRequest[];
  allListings: Listing[];
}

export default function AdminVendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const fetchVendor = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch vendor');
      }
      const data = await res.json();
      setVendor(data.vendor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }
      alert(data.message || 'Action completed successfully');
      fetchVendor();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
      setShowCreditsModal(false);
      setRejectReason('');
      setCreditsToAdd('');
      setCreditsReason('');
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const params = new URLSearchParams();
      if (deleteReason) params.set('reason', deleteReason);

      const res = await fetch(`/api/admin/vendors/${vendorId}?${params}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      alert(data.message);
      router.push('/admin/vendors');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setDeleteReason('');
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm('Are you absolutely sure? This action cannot be undone. All vendor data will be permanently deleted.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'permanentDelete' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }
      alert(data.message);
      router.push('/admin/vendors');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending Verification
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return `PKR ${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Vendor not found'}</p>
          <Link
            href="/admin/vendors"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  const isDeleted = !!vendor.deletedAt;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vendors
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {vendor.storeName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.storeName}</h1>
                {vendor.isFeatured && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                )}
                {getStatusBadge(vendor.verificationStatus)}
                {!vendor.isActive && !isDeleted && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Inactive
                  </span>
                )}
                {isDeleted && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    In Trash
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">@{vendor.slug}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isDeleted ? (
              <>
                <button
                  onClick={() => handleAction('restore')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </>
            ) : (
              <>
                {vendor.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction('verify')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowCreditsModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4" />
                  Add Credits
                </button>
                <button
                  onClick={() => handleAction(vendor.isActive ? 'deactivate' : 'activate')}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
                    vendor.isActive
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  {vendor.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleAction('feature')}
                  disabled={actionLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
                    vendor.isFeatured
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`w-4 h-4 ${vendor.isFeatured ? 'fill-yellow-500' : ''}`} />
                  {vendor.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deleted Warning */}
      {isDeleted && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">This vendor is in the trash</p>
              <p className="text-sm text-red-600 mt-1">
                Scheduled for permanent deletion on{' '}
                {vendor.deleteScheduledFor
                  ? formatDate(vendor.deleteScheduledFor)
                  : 'N/A'}
              </p>
              {vendor.deletionReason && (
                <p className="text-sm text-red-600 mt-1">
                  Reason: {vendor.deletionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason */}
      {vendor.verificationStatus === 'rejected' && vendor.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="font-medium text-red-800">Rejection Reason</p>
          <p className="text-sm text-red-600 mt-1">{vendor.rejectionReason}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-sm">Total Listings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vendor.stats.listings.total}</p>
          <p className="text-xs text-gray-500 mt-1">
            {vendor.stats.listings.active} active, {vendor.stats.listings.inactive} inactive
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Product Requests</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vendor.stats.productRequests.total}</p>
          <p className="text-xs text-gray-500 mt-1">
            {vendor.stats.productRequests.pending} pending
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm">Linked Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{vendor.stats.linkedMasterProducts}</p>
          <p className="text-xs text-gray-500 mt-1">
            {vendor.stats.listings.comparative} comparative
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">View Credits</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{vendor.viewCredits.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize">{vendor.graduationTier} tier</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Views (30d)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {vendor.stats.recentActivity.totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {vendor.stats.recentActivity.qualifiedViews} qualified
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-sm">Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{vendor.totalReviews} reviews</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Vendor Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{vendor.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{vendor.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-900">
                    {[vendor.address?.city, vendor.address?.state].filter(Boolean).join(', ') ||
                      'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="text-gray-900">{formatDate(vendor.createdAt)}</p>
                </div>
              </div>
              {vendor.verifiedAt && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Verified</p>
                    <p className="text-gray-900">{formatDate(vendor.verifiedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Account Info */}
          {vendor.userId && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">User Account</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900">
                    {vendor.userId.firstName} {vendor.userId.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Email</p>
                  <p className="text-gray-900">{vendor.userId.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className={vendor.userId.isActive ? 'text-green-600' : 'text-red-600'}>
                    {vendor.userId.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                {vendor.userId.lastLogin && (
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="text-gray-900">{formatDate(vendor.userId.lastLogin)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Request Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Product Requests Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {vendor.stats.productRequests.pending}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved</span>
                <span className="font-medium text-green-600">
                  {vendor.stats.productRequests.approved}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Merged</span>
                <span className="font-medium text-blue-600">
                  {vendor.stats.productRequests.merged}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rejected</span>
                <span className="font-medium text-red-600">
                  {vendor.stats.productRequests.rejected}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle & Right Columns - Listings & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* All Listings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Listings ({vendor.stats.listings.total})</h3>
            </div>
            {vendor.allListings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No listings yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Views
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendor.allListings.map((listing) => (
                      <tr key={listing._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-xs">
                              {listing.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {listing.category?.name || 'No category'}
                              {listing.masterProductId && (
                                <span className="ml-2 text-blue-600">
                                  (Linked to {listing.masterProductId.vendorCount} vendors)
                                </span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{formatPrice(listing.price)}</p>
                          {listing.originalPrice && listing.originalPrice > listing.price && (
                            <p className="text-xs text-gray-500 line-through">
                              {formatPrice(listing.originalPrice)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              listing.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {listing.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{listing.viewCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Product Requests */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Product Requests</h3>
            </div>
            {vendor.recentRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No product requests</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {vendor.recentRequests.map((request) => (
                  <div key={request._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.name}</p>
                        <p className="text-sm text-gray-500">
                          {request.brand} • {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.highestDuplicateScore >= 70 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            {request.highestDuplicateScore}% match
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'merged'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            {vendor.recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No transactions yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {vendor.recentTransactions.map((tx) => (
                  <div key={tx._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{tx.transactionType}</p>
                        <p className="text-sm text-gray-500">{tx.description}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            tx.creditChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {tx.creditChange > 0 ? '+' : ''}
                          {tx.creditChange.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Vendor</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{vendor.storeName}</strong>?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason (required)..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject', { reason: rejectReason })}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Credits</h3>
              <button
                onClick={() => {
                  setShowCreditsModal(false);
                  setCreditsToAdd('');
                  setCreditsReason('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-2">
              Add bonus credits to <strong>{vendor.storeName}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current balance: <strong>{vendor.viewCredits.toLocaleString()}</strong> credits
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credits to Add
                </label>
                <input
                  type="number"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={creditsReason}
                  onChange={(e) => setCreditsReason(e.target.value)}
                  placeholder="e.g., Welcome bonus, compensation..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditsModal(false);
                  setCreditsToAdd('');
                  setCreditsReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction('addCredits', {
                    credits: parseInt(creditsToAdd),
                    reason: creditsReason,
                  })
                }
                disabled={!creditsToAdd || parseInt(creditsToAdd) <= 0 || actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Vendor</h3>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{vendor.storeName}</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>30-Day Grace Period:</strong> The vendor will be moved to trash and can be
                restored within 30 days. After that, all data will be permanently deleted.
              </p>
            </div>
            {vendor.viewCredits > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> This vendor has{' '}
                  <strong>{vendor.viewCredits.toLocaleString()}</strong> unused credits.
                </p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Impact:</strong> {vendor.stats.listings.total} listings,{' '}
                {vendor.stats.productRequests.total} product requests will be affected.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
