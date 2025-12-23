'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Users,
  Tag,
  GitMerge,
  X,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface Vendor {
  _id: string;
  storeName: string;
  slug: string;
  email: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface PossibleDuplicate {
  masterProductId: {
    _id: string;
    name: string;
    brand: string;
    slug: string;
    vendorCount: number;
    minPrice: number;
    maxPrice: number;
  };
  matchScore: number;
  matchReasons: string[];
}

interface ProductRequest {
  _id: string;
  vendorId: Vendor;
  name: string;
  brand: string;
  modelNumber?: string;
  categoryId: Category;
  description?: string;
  proposedPrice: number;
  proposedStock: number;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  possibleDuplicates: PossibleDuplicate[];
  highestDuplicateScore: number;
  rejectionReason?: string;
  adminNotes?: string;
  createdMasterProductId?: { name: string; slug: string };
  mergedToMasterProductId?: { name: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  merged: number;
  highRisk: number;
}

export default function AdminProductRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    merged: 0,
    highRisk: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [sortBy, setSortBy] = useState<'date' | 'duplicateScore'>('duplicateScore');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<ProductRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedMergeTarget, setSelectedMergeTarget] = useState<string>('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      });

      const res = await fetch(`/api/admin/product-requests?${params}`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();

      setRequests(data.requests);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    requestId: string,
    action: 'approve' | 'reject' | 'merge',
    extra?: Record<string, unknown>
  ) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/admin/product-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }

      // Close modals and refresh
      setShowDetailModal(false);
      setShowRejectModal(false);
      setShowMergeModal(false);
      setSelectedRequest(null);
      setRejectReason('');
      setAdminNotes('');
      setSelectedMergeTarget('');

      fetchRequests();

      // Show success message
      alert(data.message || 'Action completed successfully');
    } catch (error) {
      console.error('Action error:', error);
      alert(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3" />
          High Risk ({score}%)
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3" />
          Medium Risk ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        Low Risk
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'merged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <GitMerge className="w-3 h-3" />
            Merged
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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>
          <p className="text-gray-500 mt-1">Review and moderate new product listing requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'pending'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200 hover:border-yellow-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border transition-all bg-white border-gray-200 hover:border-red-200`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
          <p className="text-sm text-gray-600">High Risk</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'approved'
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-gray-200 hover:border-green-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-600">Approved</p>
        </button>
        <button
          onClick={() => setStatusFilter('merged')}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'merged'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200 hover:border-blue-200'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.merged}</p>
          <p className="text-sm text-gray-600">Merged</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border transition-all ${
            statusFilter === 'rejected'
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200 hover:border-red-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-gray-600">Rejected</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="merged">Merged</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Status</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'duplicateScore')}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="duplicateScore">Duplicate Risk</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No product requests found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div
                  key={request._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {request.brand.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {request.name}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {request.brand}
                            {request.modelNumber && ` • ${request.modelNumber}`}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {request.vendorId?.storeName || 'Unknown Vendor'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {formatPrice(request.proposedPrice)}
                            </span>
                            <span>{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Duplicate Warning */}
                      {request.possibleDuplicates?.length > 0 && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Possible duplicate detected
                              </p>
                              <p className="text-sm text-yellow-700 mt-1">
                                Similar to:{' '}
                                <strong>
                                  {request.possibleDuplicates[0]?.masterProductId?.name}
                                </strong>{' '}
                                ({request.possibleDuplicates[0]?.matchScore}% match)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason (if rejected) */}
                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection reason:</strong> {request.rejectionReason}
                          </p>
                        </div>
                      )}

                      {/* Merged To (if merged) */}
                      {request.status === 'merged' && request.mergedToMasterProductId && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Merged to:</strong>{' '}
                            {request.mergedToMasterProductId.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Risk Badge & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      {request.status === 'pending' && (
                        <>
                          {getRiskBadge(request.highestDuplicateScore)}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailModal(true);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {request.possibleDuplicates?.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setSelectedMergeTarget(
                                    request.possibleDuplicates[0]?.masterProductId?._id || ''
                                  );
                                  setShowMergeModal(true);
                                }}
                                disabled={actionLoading === request._id}
                                className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                Merge
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(request._id, 'approve')}
                              disabled={actionLoading === request._id}
                              className="px-3 py-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {actionLoading === request._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading === request._id}
                              className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} requests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
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

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Request Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedRequest(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Product Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Product Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <strong>Name:</strong> {selectedRequest.name}
                  </p>
                  <p>
                    <strong>Brand:</strong> {selectedRequest.brand}
                  </p>
                  {selectedRequest.modelNumber && (
                    <p>
                      <strong>Model:</strong> {selectedRequest.modelNumber}
                    </p>
                  )}
                  <p>
                    <strong>Category:</strong> {selectedRequest.categoryId?.name}
                  </p>
                  {selectedRequest.description && (
                    <p>
                      <strong>Description:</strong> {selectedRequest.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Vendor Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <strong>Store:</strong> {selectedRequest.vendorId?.storeName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedRequest.vendorId?.email}
                  </p>
                  <p>
                    <strong>Proposed Price:</strong> {formatPrice(selectedRequest.proposedPrice)}
                  </p>
                  <p>
                    <strong>Stock:</strong> {selectedRequest.proposedStock}
                  </p>
                </div>
              </div>

              {/* Possible Duplicates */}
              {selectedRequest.possibleDuplicates?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Possible Duplicates ({selectedRequest.possibleDuplicates.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedRequest.possibleDuplicates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {dup.masterProductId?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {dup.masterProductId?.brand} •{' '}
                              {dup.masterProductId?.vendorCount} vendors
                            </p>
                            <p className="text-sm text-gray-600">
                              Price range: {formatPrice(dup.masterProductId?.minPrice || 0)} -{' '}
                              {formatPrice(dup.masterProductId?.maxPrice || 0)}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dup.matchReasons.map((reason, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-lg font-bold text-yellow-600">
                            {dup.matchScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedRequest.possibleDuplicates?.length > 0 && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedMergeTarget(
                        selectedRequest.possibleDuplicates[0]?.masterProductId?._id || ''
                      );
                      setShowMergeModal(true);
                    }}
                    className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Merge to Existing
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedRequest._id, 'approve')}
                  disabled={actionLoading === selectedRequest._id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === selectedRequest._id && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Request</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Reject the product request for{' '}
              <strong>{selectedRequest.name}</strong> from{' '}
              <strong>{selectedRequest.vendorId?.storeName}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(selectedRequest._id, 'reject', { reason: rejectReason })
                }
                disabled={!rejectReason.trim() || actionLoading === selectedRequest._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === selectedRequest._id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <GitMerge className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Merge to Existing Product</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Link vendor&apos;s price to an existing master product instead of creating a new one.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target Product
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedRequest.possibleDuplicates?.map((dup) => (
                  <label
                    key={dup.masterProductId?._id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedMergeTarget === dup.masterProductId?._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mergeTarget"
                      value={dup.masterProductId?._id}
                      checked={selectedMergeTarget === dup.masterProductId?._id}
                      onChange={(e) => setSelectedMergeTarget(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {dup.masterProductId?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {dup.masterProductId?.vendorCount} vendors •{' '}
                        {formatPrice(dup.masterProductId?.minPrice || 0)} -{' '}
                        {formatPrice(dup.masterProductId?.maxPrice || 0)}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">
                      {dup.matchScore}% match
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Any notes about this merge..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMergeModal(false);
                  setSelectedRequest(null);
                  setSelectedMergeTarget('');
                  setAdminNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleAction(selectedRequest._id, 'merge', {
                    mergeToMasterProductId: selectedMergeTarget,
                    notes: adminNotes,
                  })
                }
                disabled={!selectedMergeTarget || actionLoading === selectedRequest._id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === selectedRequest._id && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Merge & Create Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
