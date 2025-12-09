'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MousePointerClick,
  CreditCard,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { VendorLayout, VendorPageHeader, VendorCard } from '@/components/layouts/VendorLayout';
import { StatsCard, StatsGrid, CreditBalanceCard } from '@/components/ui/StatsCard';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { api } from '@/lib/api/client';
import type { VendorDashboardResponse } from '@/lib/api/types';

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);

    const response = await api.get<VendorDashboardResponse>('/vendor/dashboard');

    if (response.ok && response.data) {
      setData(response.data);
    } else {
      setError(response.error?.message || 'Failed to load dashboard');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <VendorLayout>
        <PageLoading text="Loading dashboard..." />
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <ErrorMessage
          title="Failed to load dashboard"
          message={error}
          onRetry={fetchDashboard}
          fullPage
        />
      </VendorLayout>
    );
  }

  const todayStats = data?.todayStats || {
    views: 0,
    qualifiedViews: 0,
    contactClicks: 0,
    cpvCharged: 0,
  };

  const comparison = data?.yesterdayComparison || {
    views: 0,
    viewsChange: 0,
    qualifiedViews: 0,
    qualifiedViewsChange: 0,
  };

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Dashboard"
        description="Overview of your store performance"
        actions={
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {/* Stats Grid */}
      <StatsGrid columns={4} className="mb-6">
        <StatsCard
          title="Today's Views"
          value={todayStats.views}
          change={comparison.viewsChange}
          changeLabel="vs yesterday"
          icon={Eye}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Qualified Views"
          value={todayStats.qualifiedViews}
          change={comparison.qualifiedViewsChange}
          changeLabel="vs yesterday"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Contact Clicks"
          value={todayStats.contactClicks}
          icon={MousePointerClick}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatsCard
          title="CPV Spent Today"
          value={`Rs ${todayStats.cpvCharged}`}
          icon={CreditCard}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </StatsGrid>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Trend Chart */}
          <VendorCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Views Trend</h3>
            <div className="h-64">
              {data?.weeklyTrend && data.weeklyTrend.length > 0 ? (
                <WeeklyChart data={data.weeklyTrend} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No data available for this week
                </div>
              )}
            </div>
          </VendorCard>

          {/* Top Products */}
          <VendorCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <Link
                href="/vendor/products"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 text-right">Views</th>
                      <th className="pb-3 text-right">Clicks</th>
                      <th className="pb-3 text-right">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topProducts.map((product, index) => (
                      <tr key={product._id || index}>
                        <td className="py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {product.name}
                          </p>
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {product.views.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {product.clicks}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-medium ${
                              product.conversionRate > 5
                                ? 'text-green-600'
                                : product.conversionRate > 2
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {product.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No products yet</p>
                <Link
                  href="/vendor/products/new"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first product
                </Link>
              </div>
            )}
          </VendorCard>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Credit Balance */}
          <CreditBalanceCard
            balance={data?.creditBalance || 0}
            cpvRate={data?.cpvRate || 10}
            tier="starter"
            estimatedViews={data?.estimatedViewsRemaining || 0}
            onTopUp={() => window.location.href = '/vendor/credits'}
          />

          {/* Recent Transactions */}
          <VendorCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Link
                href="/vendor/credits"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            </div>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.map((tx, index) => (
                  <div
                    key={tx._id || index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.creditChange > 0
                            ? 'bg-green-100'
                            : 'bg-red-100'
                        }`}
                      >
                        {tx.creditChange > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {tx.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        tx.creditChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.creditChange > 0 ? '+' : ''}
                      {tx.creditChange}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-gray-400">
                <p>No transactions yet</p>
              </div>
            )}
          </VendorCard>

          {/* Monthly Spending Summary */}
          <VendorCard>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-semibold text-gray-900">
                  Rs {data?.monthlySpending?.total || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Views Charged</span>
                <span className="font-semibold text-gray-900">
                  {data?.monthlySpending?.viewsCharged || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. CPV</span>
                <span className="font-semibold text-gray-900">
                  Rs {data?.cpvRate || 10}/100 views
                </span>
              </div>
            </div>
          </VendorCard>
        </div>
      </div>
    </VendorLayout>
  );
}

// Simple bar chart component for weekly trend
interface WeeklyChartProps {
  data: Array<{
    date: string;
    views: number;
    qualifiedViews: number;
    cpvCharged: number;
  }>;
}

function WeeklyChart({ data }: WeeklyChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);

  return (
    <div className="h-full flex items-end gap-2">
      {data.map((day, index) => {
        const height = (day.views / maxViews) * 100;
        const qualifiedHeight = (day.qualifiedViews / maxViews) * 100;
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full h-48 flex items-end justify-center gap-1">
              {/* Total views bar */}
              <div
                className="w-5 bg-blue-200 rounded-t transition-all hover:bg-blue-300"
                style={{ height: `${height}%` }}
                title={`Total: ${day.views}`}
              />
              {/* Qualified views bar */}
              <div
                className="w-5 bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                style={{ height: `${qualifiedHeight}%` }}
                title={`Qualified: ${day.qualifiedViews}`}
              />
            </div>
            <span className="mt-2 text-xs text-gray-500">{dayName}</span>
            <span className="text-xs font-medium text-gray-700">{day.views}</span>
          </div>
        );
      })}
    </div>
  );
}
