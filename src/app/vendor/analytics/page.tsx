'use client';

import React, { useEffect, useState } from 'react';
import {
  Eye,
  MousePointer,
  TrendingUp,
  DollarSign,
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  Search,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { VendorLayout, VendorPageHeader, VendorCard } from '@/components/layouts/VendorLayout';
import { useAnalytics, getDateRange } from '@/lib/api/hooks/useAnalytics';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';

type DateRangeOption = 'today' | 'yesterday' | 'week' | 'month' | 'quarter';

export default function VendorAnalyticsPage() {
  const { data, isLoading, error, fetchAnalytics } = useAnalytics();
  const [dateRange, setDateRange] = useState<DateRangeOption>('week');

  useEffect(() => {
    const range = getDateRange(dateRange);
    fetchAnalytics({
      startDate: range.startDate,
      endDate: range.endDate,
      period: dateRange === 'today' || dateRange === 'yesterday' ? 'day' : dateRange === 'week' ? 'week' : 'month',
    });
  }, [dateRange, fetchAnalytics]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
  ];

  if (isLoading && !data) {
    return (
      <VendorLayout>
        <PageLoading text="Loading analytics..." />
      </VendorLayout>
    );
  }

  if (error) {
    return (
      <VendorLayout>
        <VendorPageHeader title="Analytics" />
        <ErrorMessage
          message={error}
          onRetry={() => fetchAnalytics(getDateRange(dateRange))}
        />
      </VendorLayout>
    );
  }

  if (!data) {
    return (
      <VendorLayout>
        <VendorPageHeader title="Analytics" />
        <EmptyState
          icon={BarChart3}
          title="No analytics data"
          description="Start listing products to see your analytics"
        />
      </VendorLayout>
    );
  }

  // Calculate max values for chart scaling
  const maxChartValue = Math.max(...(data.chartData?.map(d => d.views) || [1]));

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Analytics"
        description="Track your performance and optimize your listings"
        actions={
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <VendorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(data.summary?.totalViews || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">
              {formatNumber(data.summary?.qualifiedViews || 0)} qualified
            </span>
          </div>
        </VendorCard>

        <VendorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Contact Clicks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(data.summary?.contactClicks || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">
              {formatPercent(data.summary?.conversionRate || 0)} conversion
            </span>
          </div>
        </VendorCard>

        <VendorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPrice(data.summary?.totalSpent || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">
              {formatPrice(data.summary?.avgCpv || 0)} avg CPV
            </span>
          </div>
        </VendorCard>

        <VendorCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatPercent(data.summary?.conversionRate || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            From views to clicks
          </div>
        </VendorCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart */}
        <VendorCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Views Over Time</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-gray-500">Total Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-gray-500">Qualified</span>
              </div>
            </div>
          </div>

          {data.chartData && data.chartData.length > 0 ? (
            <div className="h-64">
              {/* Simple bar chart */}
              <div className="flex items-end justify-between h-full gap-1">
                {data.chartData.map((item, index) => {
                  const heightPercent = (item.views / maxChartValue) * 100;
                  const qualifiedHeightPercent = (item.qualifiedViews / maxChartValue) * 100;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: '200px' }}>
                        <div
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ height: `${heightPercent}%`, minHeight: item.views > 0 ? '4px' : '0' }}
                          title={`${item.views} total views`}
                        />
                        <div
                          className="flex-1 bg-green-500 rounded-t"
                          style={{ height: `${qualifiedHeightPercent}%`, minHeight: item.qualifiedViews > 0 ? '4px' : '0' }}
                          title={`${item.qualifiedViews} qualified views`}
                        />
                      </div>
                      <span className="text-xs text-gray-500 truncate w-full text-center">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data for selected period
            </div>
          )}
        </VendorCard>

        {/* Traffic Sources */}
        <VendorCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h3>

          {data.trafficSources ? (
            <div className="space-y-4">
              {[
                { label: 'Comparison Page', value: data.trafficSources.comparison || 0, icon: Layers, color: 'blue' },
                { label: 'Direct Link', value: data.trafficSources.direct || 0, icon: ArrowUpRight, color: 'green' },
                { label: 'Search', value: data.trafficSources.search || 0, icon: Search, color: 'purple' },
                { label: 'Category Browse', value: data.trafficSources.category || 0, icon: BarChart3, color: 'orange' },
              ].map((source) => {
                const total = Object.values(data.trafficSources || {}).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (source.value / total) * 100 : 0;

                return (
                  <div key={source.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <source.icon className={`w-4 h-4 text-${source.color}-500`} />
                        <span className="text-sm text-gray-700">{source.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercent(percent)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${source.color}-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No traffic data available
            </div>
          )}
        </VendorCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Device Breakdown */}
        <VendorCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Breakdown</h3>

          {data.deviceBreakdown ? (
            <div className="space-y-4">
              {[
                { label: 'Desktop', value: data.deviceBreakdown.desktop || 0, icon: Monitor },
                { label: 'Mobile', value: data.deviceBreakdown.mobile || 0, icon: Smartphone },
                { label: 'Tablet', value: data.deviceBreakdown.tablet || 0, icon: Tablet },
              ].map((device) => {
                const total = Object.values(data.deviceBreakdown || {}).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (device.value / total) * 100 : 0;

                return (
                  <div key={device.label} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <device.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{device.label}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatPercent(percent)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No device data available
            </div>
          )}
        </VendorCard>

        {/* Product Performance */}
        <VendorCard className="lg:col-span-2" padding="none">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
          </div>

          {data.productPerformance && data.productPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Conv.
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Spent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.productPerformance.slice(0, 5).map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {product.name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatNumber(product.views)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatNumber(product.clicks)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          product.conversionRate >= 5 ? 'text-green-600' :
                          product.conversionRate >= 2 ? 'text-yellow-600' : 'text-gray-500'
                        }`}>
                          {formatPercent(product.conversionRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">
                        {formatPrice(product.spent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No product performance data available
            </div>
          )}
        </VendorCard>
      </div>
    </VendorLayout>
  );
}
