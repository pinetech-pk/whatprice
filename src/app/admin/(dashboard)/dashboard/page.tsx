'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Eye,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

interface PlatformStats {
  overview: {
    vendors: { total: number; verified: number; pending: number };
    products: { total: number; active: number };
    users: number;
    categories: number;
  };
  activity: {
    views: number;
    qualifiedViews: number;
    contactClicks: number;
    uniqueVisitors: number;
    qualificationRate: number;
  };
  revenue: {
    total: number;
    credits: number;
    transactions: number;
  };
  dailyTrend: Array<{
    _id: string;
    views: number;
    qualified: number;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/platform?period=${period}&report=overview`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data.platform);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchStats}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Vendors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.overview.vendors.total || 0)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {stats?.overview.vendors.verified || 0} verified
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  {stats?.overview.vendors.pending || 0} pending
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.overview.products.total || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {stats?.overview.products.active || 0} active listings
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(stats?.activity.views || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {(stats?.activity.qualificationRate || 0) > 50 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-500">
                  {stats?.activity.qualificationRate || 0}% qualified
                </span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats?.revenue.total || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {stats?.revenue.transactions || 0} transactions
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/admin/vendors?status=pending"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Pending Vendors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-yellow-600">
                  {stats?.overview.vendors.pending || 0}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600 transition-colors" />
              </div>
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Manage Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600">
                  {stats?.overview.categories || 0}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">View Products</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-600">
                  {stats?.overview.products.total || 0}
                </span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.activity.views || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Views</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(stats?.activity.qualifiedViews || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Qualified Views</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(stats?.activity.contactClicks || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Contact Clicks</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(stats?.activity.uniqueVisitors || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Unique Visitors</p>
            </div>
          </div>

          {/* Mini Trend Chart */}
          {stats?.dailyTrend && stats.dailyTrend.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Views Trend</h4>
              <div className="flex items-end gap-1 h-20">
                {stats.dailyTrend.slice(-14).map((day, i) => {
                  const maxViews = Math.max(...stats.dailyTrend.slice(-14).map((d) => d.views));
                  const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.views} views
                        <br />
                        {day._id}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <p className="text-sm font-medium text-green-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {formatCurrency(stats?.revenue.total || 0)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm font-medium text-blue-600">Credits Sold</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {formatNumber(stats?.revenue.credits || 0)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <p className="text-sm font-medium text-purple-600">Transactions</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {stats?.revenue.transactions || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
