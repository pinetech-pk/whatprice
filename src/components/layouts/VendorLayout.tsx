'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, Search } from 'lucide-react';
import { VendorSidebar, MobileSidebar } from './VendorSidebar';
import { useAuth } from '@/lib/api/hooks/useAuth';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { VerificationBadge } from '@/components/ui/Badge';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export function VendorLayout({ children }: VendorLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/vendor/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return <PageLoading text="Loading..." />;
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <VendorSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          storeName={user?.storeName}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        storeName={user?.storeName}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300
          ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>

              {/* Search (desktop) */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Verification status */}
              {user?.verificationStatus && user.verificationStatus !== 'verified' && (
                <VerificationBadge
                  status={user.verificationStatus as 'pending' | 'verified' | 'rejected'}
                />
              )}

              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User info */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.storeName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.storeName?.charAt(0).toUpperCase() || 'V'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Page header component for vendor pages
interface VendorPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function VendorPageHeader({
  title,
  description,
  actions,
}: VendorPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// Card component for vendor pages
interface VendorCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function VendorCard({
  children,
  className = '',
  padding = 'md',
}: VendorCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export default VendorLayout;
