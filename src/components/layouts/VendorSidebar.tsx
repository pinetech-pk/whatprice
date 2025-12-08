'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  CreditCard,
  BarChart3,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Store,
} from 'lucide-react';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

const mainLinks: SidebarLink[] = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/credits', label: 'Credits', icon: CreditCard },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
];

const accountLinks: SidebarLink[] = [
  { href: '/vendor/profile', label: 'Profile', icon: User },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

interface VendorSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  storeName?: string;
  onLogout?: () => void;
}

export function VendorSidebar({
  isCollapsed = false,
  onToggleCollapse,
  storeName = 'Your Store',
  onLogout,
}: VendorSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/vendor/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) => `
    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
    ${isActive(href)
      ? 'bg-blue-50 text-blue-600 font-medium'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }
  `;

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-white border-r border-gray-200
        flex flex-col transition-all duration-300 z-40
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!isCollapsed && (
          <Link href="/vendor/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 truncate max-w-[140px]">
              {storeName}
            </span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Store className="w-5 h-5 text-white" />
          </div>
        )}
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Main Links */}
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{link.label}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200" />

        {/* Account Links */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Account
            </p>
          )}
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              title={isCollapsed ? link.label : undefined}
            >
              <link.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title={isCollapsed ? 'Help' : undefined}
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Help & Support</span>}
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        )}
      </div>
    </aside>
  );
}

// Mobile sidebar overlay
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeName?: string;
  onLogout?: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  storeName,
  onLogout,
}: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
        <VendorSidebar
          storeName={storeName}
          onLogout={onLogout}
        />
      </div>
    </>
  );
}

export default VendorSidebar;
