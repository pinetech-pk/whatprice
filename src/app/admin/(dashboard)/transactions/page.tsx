'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface RevenueStats {
  dailyRevenue: Array<{
    _id: string;
    revenue: number;
    credits: number;
    transactions: number;
  }>;
  revenueByMethod: Record<string, { revenue: number; count: number }>;
  topSpenders: Array<{
    storeName: string;
    totalSpent: number;
    purchases: number;
  }>;
}

export default function AdminTransactionsPage() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [totals, setTotals] = useState({
    revenue: 0,
    credits: 0,
    transactions: 0,
  });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/platform?period=${period}&report=revenue`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStats(data.revenue);

      // Calculate totals
      const dailyRevenue = data.revenue?.dailyRevenue || [];
      const totals = dailyRevenue.reduce(
        (acc: { revenue: number; credits: number; transactions: number }, day: { revenue: number; credits: number; transactions: number }) => ({
          revenue: acc.revenue + day.revenue,
          credits: acc.credits + day.credits,
          transactions: acc.transactions + day.transactions,
        }),
        { revenue: 0, credits: 0, transactions: 0 }
      );
      setTotals(totals);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions & Revenue</h1>
          <p className="text-gray-500 mt-1">Track platform revenue and credit purchases</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={fetchStats}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.revenue)}</p>
          <p className="text-green-100 mt-1">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totals.credits.toLocaleString()}</p>
          <p className="text-blue-100 mt-1">Credits Sold</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totals.transactions}</p>
          <p className="text-purple-100 mt-1">Transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
          {stats?.dailyRevenue && stats.dailyRevenue.length > 0 ? (
            <div className="space-y-4">
              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-40">
                {stats.dailyRevenue.slice(-14).map((day, i) => {
                  const maxRevenue = Math.max(...stats.dailyRevenue.slice(-14).map((d) => d.revenue));
                  const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group cursor-pointer"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatCurrency(day.revenue)}
                          <br />
                          {day.transactions} transactions
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                        {formatDate(day._id)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Revenue Table */}
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right">Revenue</th>
                      <th className="pb-2 text-right">Credits</th>
                      <th className="pb-2 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.dailyRevenue
                      .slice()
                      .reverse()
                      .slice(0, 7)
                      .map((day) => (
                        <tr key={day._id}>
                          <td className="py-2 text-gray-900">{formatDate(day._id)}</td>
                          <td className="py-2 text-right font-medium text-green-600">
                            {formatCurrency(day.revenue)}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {day.credits.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-gray-600">{day.transactions}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            {stats?.revenueByMethod && Object.keys(stats.revenueByMethod).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.revenueByMethod).map(([method, data]) => (
                  <div
                    key={method}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {method.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{data.count} transactions</p>
                    </div>
                    <p className="font-semibold text-green-600">{formatCurrency(data.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No payment data</p>
            )}
          </div>

          {/* Top Spenders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spenders</h3>
            {stats?.topSpenders && stats.topSpenders.length > 0 ? (
              <div className="space-y-3">
                {stats.topSpenders.slice(0, 5).map((vendor, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{vendor.storeName}</p>
                      <p className="text-xs text-gray-500">{vendor.purchases} purchases</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(vendor.totalSpent)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No spending data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
