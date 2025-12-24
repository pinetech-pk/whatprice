'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Ban,
  Star,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  AlertTriangle,
  Trash2,
  RotateCcw,
  UserPlus,
} from 'lucide-react';

interface Vendor {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  storeName: string;
  slug: string;
  email: string;
  phone: string;
  address: {
    city: string;
    state: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  isFeatured: boolean;
  viewCredits: number;
  graduationTier: string;
  totalProducts: number;
  totalViews: number;
  rating: number;
  createdAt: string;
  deletedAt?: string;
  deleteScheduledFor?: string;
}

interface VendorStats {
  pending: number;
  verified: number;
  rejected: number;
  trashed: number;
}

export default function AdminVendorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats>({ pending: 0, verified: 0, rejected: 0, trashed: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [tierFilter, setTierFilter] = useState('');
  const [showTrashed, setShowTrashed] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [creditsReason, setCreditsReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter && !showTrashed) params.set('status', statusFilter);
      if (tierFilter && !showTrashed) params.set('tier', tierFilter);
      if (showTrashed) params.set('trashed', 'true');

      const res = await fetch(`/api/admin/vendors?${params}`);
      if (!res.ok) throw new Error('Failed to fetch vendors');
      const data = await res.json();
      setVendors(data.vendors);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, tierFilter, showTrashed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchVendors]);

  const handleAction = async (vendorId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      fetchVendors();
    } catch (error) {
      console.error('Action error:', error);
      alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(null);
      setShowRejectModal(false);
      setShowCreditsModal(false);
      setShowDeleteModal(false);
      setSelectedVendor(null);
      setRejectReason('');
      setCreditsToAdd('');
      setCreditsReason('');
      setDeleteReason('');
    }
  };

  const handleDelete = async (vendorId: string, reason?: string) => {
    setActionLoading(vendorId);
    try {
      const params = new URLSearchParams();
      if (reason) params.set('reason', reason);

      const res = await fetch(`/api/admin/vendors/${vendorId}?${params}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      const data = await res.json();
      if (data.warning) {
        alert(data.message + '\n\n' + data.warning);
      }
      fetchVendors();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setActionLoading(null);
      setShowDeleteModal(false);
      setSelectedVendor(null);
      setDeleteReason('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
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
    });
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500 mt-1">Manage and verify vendor accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendors/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Vendor
          </Link>
          <button
            onClick={fetchVendors}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => {
            setShowTrashed(false);
            setStatusFilter('pending');
          }}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'pending' && !showTrashed
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200 hover:border-yellow-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </button>
        <button
          onClick={() => {
            setShowTrashed(false);
            setStatusFilter('verified');
          }}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'verified' && !showTrashed
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200 hover:border-green-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          <p className="text-sm text-gray-600">Verified</p>
        </button>
        <button
          onClick={() => {
            setShowTrashed(false);
            setStatusFilter('rejected');
          }}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'rejected' && !showTrashed
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200 hover:border-red-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </button>
        <button
          onClick={() => {
            setShowTrashed(true);
            setStatusFilter('');
          }}
          className={`p-4 rounded-xl border transition-all ${
            showTrashed
              ? 'bg-gray-100 border-gray-400'
              : 'bg-white border-gray-200 hover:border-gray-400'
          }`}
        >
          <p className="text-2xl font-bold text-gray-600">{stats.trashed}</p>
          <p className="text-sm text-gray-600">Trashed</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by store name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tiers</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="standard">Standard</option>
            </select>
            {(statusFilter || tierFilter || searchTerm || showTrashed) && (
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTierFilter('');
                  setSearchTerm('');
                  setShowTrashed(false);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No vendors found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/admin/vendors/${vendor._id}`} className="flex items-center gap-3 group">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {vendor.storeName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{vendor.storeName}</p>
                              {vendor.isFeatured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{vendor.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(vendor.verificationStatus)}
                        {!vendor.isActive && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {vendor.address?.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {vendor.viewCredits.toLocaleString()}
                        </span>
                        <p className="text-xs text-gray-500 capitalize">{vendor.graduationTier}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {vendor.totalProducts || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(vendor.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Details - always visible */}
                          <Link
                            href={`/admin/vendors/${vendor._id}`}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          {showTrashed ? (
                            /* Trashed vendors actions */
                            <>
                              <button
                                onClick={() => handleAction(vendor._id, 'restore')}
                                disabled={actionLoading === vendor._id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Restore"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleAction(vendor._id, 'permanentDelete')}
                                disabled={actionLoading === vendor._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Permanent Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            /* Regular vendor actions */
                            <>
                              {vendor.verificationStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleAction(vendor._id, 'verify')}
                                    disabled={actionLoading === vendor._id}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Verify"
                                  >
                                    <CheckCircle className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedVendor(vendor);
                                      setShowRejectModal(true);
                                    }}
                                    disabled={actionLoading === vendor._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setShowCreditsModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Add Credits"
                              >
                                <CreditCard className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(vendor._id, vendor.isActive ? 'deactivate' : 'activate')
                                }
                                disabled={actionLoading === vendor._id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  vendor.isActive
                                    ? 'text-orange-600 hover:bg-orange-50'
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                title={vendor.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <Ban className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(vendor._id, 'feature')
                                }
                                disabled={actionLoading === vendor._id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  vendor.isFeatured
                                    ? 'text-yellow-600 hover:bg-yellow-50'
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                                title={vendor.isFeatured ? 'Unfeature' : 'Feature'}
                              >
                                <Star className={`w-5 h-5 ${vendor.isFeatured ? 'fill-yellow-500' : ''}`} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setShowDeleteModal(true);
                                }}
                                disabled={actionLoading === vendor._id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} vendors
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Vendor</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{selectedVendor.storeName}</strong>?
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
                  setSelectedVendor(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(selectedVendor._id, 'reject', { reason: rejectReason })
                }
                disabled={!rejectReason.trim() || actionLoading === selectedVendor._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === selectedVendor._id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Reject Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showCreditsModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Credits</h3>
              <button
                onClick={() => {
                  setShowCreditsModal(false);
                  setSelectedVendor(null);
                  setCreditsToAdd('');
                  setCreditsReason('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Add bonus credits to <strong>{selectedVendor.storeName}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current balance: <strong>{selectedVendor.viewCredits.toLocaleString()}</strong> credits
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditsModal(false);
                  setSelectedVendor(null);
                  setCreditsToAdd('');
                  setCreditsReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(selectedVendor._id, 'addCredits', {
                    credits: parseInt(creditsToAdd),
                    reason: creditsReason,
                  })
                }
                disabled={!creditsToAdd || parseInt(creditsToAdd) <= 0 || actionLoading === selectedVendor._id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === selectedVendor._id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vendor Modal */}
      {showDeleteModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Vendor</h3>
            </div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{selectedVendor.storeName}</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>30-Day Grace Period:</strong> The vendor will be moved to trash and can be restored within 30 days. After that, all data will be permanently deleted.
              </p>
            </div>
            {selectedVendor.viewCredits > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> This vendor has{' '}
                  <strong>{selectedVendor.viewCredits.toLocaleString()}</strong> unused credits that will be lost if not restored.
                </p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deleting this vendor..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedVendor(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedVendor._id, deleteReason || undefined)}
                disabled={actionLoading === selectedVendor._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === selectedVendor._id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
