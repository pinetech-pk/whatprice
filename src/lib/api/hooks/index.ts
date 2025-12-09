// Authentication hooks
export { useAuth, useRequireAuth, useRedirectIfAuthenticated } from './useAuth';

// Product hooks
export {
  useProducts,
  useProduct,
  useCompare,
  useVendorProducts
} from './useProducts';

// Dashboard hooks
export {
  useVendorDashboard,
  useTodayStats,
  useWeeklyTrend,
  useTopProducts,
  useCreditSummary
} from './useVendorDashboard';

// Credits hooks
export { useCredits, useCreditBalance } from './useCredits';

// Analytics hooks
export { useAnalytics, getDateRange } from './useAnalytics';

// View tracking hooks
export {
  useViewTracking,
  useProductViewTracking
} from './useViews';
