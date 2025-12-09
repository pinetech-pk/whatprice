'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  Clock,
  Check,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Eye,
  Sparkles,
} from 'lucide-react';
import { VendorLayout, VendorPageHeader, VendorCard } from '@/components/layouts/VendorLayout';
import { useCredits } from '@/lib/api/hooks/useCredits';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Pagination } from '@/components/ui/Pagination';
import { TierBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { CreditTransaction } from '@/lib/api/types';

export default function VendorCreditsPage() {
  const {
    balance,
    transactions,
    pricingTiers,
    pagination,
    isLoading,
    error,
    fetchCredits,
    purchaseCredits,
    setPage,
  } = useCredits();

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'deduction':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case 'refund':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      case 'bonus':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Coins className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'refund':
      case 'bonus':
        return 'text-green-600';
      case 'deduction':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handlePurchaseClick = (tierCredits: number) => {
    setSelectedTier(tierCredits);
    setPurchaseModalOpen(true);
    setPurchaseError(null);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedTier) return;

    setIsPurchasing(true);
    setPurchaseError(null);

    const success = await purchaseCredits(selectedTier);

    if (success) {
      setPurchaseModalOpen(false);
      setSelectedTier(null);
    } else {
      setPurchaseError('Failed to purchase credits. Please try again.');
    }

    setIsPurchasing(false);
  };

  if (isLoading && !balance) {
    return (
      <VendorLayout>
        <PageLoading text="Loading credits..." />
      </VendorLayout>
    );
  }

  const selectedPricingTier = pricingTiers.find(t => t.credits === selectedTier);

  return (
    <VendorLayout>
      <VendorPageHeader
        title="Credits"
        description="Manage your view credits and purchase history"
      />

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchCredits()}
          className="mb-6"
        />
      )}

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Credit Balance */}
        <VendorCard className="md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Credit Balance</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-gray-900">
                  {balance?.balance?.toLocaleString() || 0}
                </p>
                <span className="text-gray-500">credits</span>
              </div>
            </div>
            {balance?.tier && <TierBadge tier={balance.tier} />}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Current CPV Rate</p>
              <p className="text-xl font-semibold text-gray-900 mt-1">
                {formatPrice(balance?.cpvRate || 10)}
                <span className="text-sm font-normal text-gray-500"> / 100 views</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Views</p>
              <p className="text-xl font-semibold text-gray-900 mt-1 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                {balance?.estimatedViews?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </VendorCard>

        {/* Quick Stats */}
        <VendorCard>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tier Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {balance?.tier || 'Starter'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {balance?.tier === 'starter' && 'Spend Rs. 5,000 to graduate to Growth tier'}
            {balance?.tier === 'growth' && 'Spend Rs. 20,000 to graduate to Standard tier'}
            {balance?.tier === 'standard' && 'You are enjoying the best CPV rates!'}
          </p>
        </VendorCard>
      </div>

      {/* Pricing Tiers */}
      <VendorCard className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Credits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.credits}
              className={`relative p-4 border rounded-xl transition-all ${
                tier.popular
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {tier.credits.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mb-2">credits</p>
                <p className="text-xl font-semibold text-blue-600 mb-1">
                  {formatPrice(tier.price)}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {formatPrice(tier.pricePerCredit)}/credit
                </p>
                <button
                  onClick={() => handlePurchaseClick(tier.credits)}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    tier.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))}
        </div>
      </VendorCard>

      {/* Transaction History */}
      <VendorCard padding="none">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Purchase credits to start listing your products
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction: CreditTransaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {transaction.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.amount ? formatPrice(transaction.amount) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                          {transaction.creditChange > 0 ? '+' : ''}
                          {transaction.creditChange.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.creditBalanceAfter.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.status === 'completed' && <Check className="w-3 h-3" />}
                          {transaction.status === 'pending' && <Clock className="w-3 h-3" />}
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {transactions.map((transaction: CreditTransaction) => (
                <div key={transaction._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {transaction.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.creditChange > 0 ? '+' : ''}
                        {transaction.creditChange.toLocaleString()} credits
                      </p>
                      {transaction.amount && (
                        <p className="text-sm text-gray-500">
                          {formatPrice(transaction.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </VendorCard>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        title="Confirm Purchase"
        size="sm"
      >
        <div className="space-y-4">
          {purchaseError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {purchaseError}
            </div>
          )}

          {selectedPricingTier && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">
                {selectedPricingTier.credits.toLocaleString()}
              </p>
              <p className="text-gray-500 mb-2">credits</p>
              <p className="text-2xl font-semibold text-blue-600">
                {formatPrice(selectedPricingTier.price)}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center">
            Credits will be added to your account immediately after purchase.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setPurchaseModalOpen(false)}
              disabled={isPurchasing}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchaseConfirm}
              disabled={isPurchasing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPurchasing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Confirm Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </VendorLayout>
  );
}
