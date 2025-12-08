"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogIn, LogOut, Store, LayoutDashboard } from "lucide-react";
import Logo from "./Logo";

interface NavigationLink {
  href: string;
  label: string;
}

const navigationLinks: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/compare", label: "Compare" },
  { href: "/investors", label: "Investors" },
];

type AuthType = "admin" | "investor" | "vendor" | null;

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authType, setAuthType] = useState<AuthType>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vendorName, setVendorName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication status on mount and pathname change
  useEffect(() => {
    const checkAuth = async () => {
      // Check vendor authentication first
      try {
        const vendorResponse = await fetch("/api/vendor/check-auth");
        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json();
          if (vendorData.authenticated && vendorData.vendor) {
            setIsAuthenticated(true);
            setAuthType("vendor");
            setVendorName(vendorData.vendor.storeName);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking vendor auth:", error);
      }

      // Check admin authentication
      try {
        const response = await fetch("/api/admin/check-auth");
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setAuthType("admin");
            setVendorName(null);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
      }

      // Check investor authentication (localStorage)
      if (typeof window !== "undefined") {
        const investorKey = localStorage.getItem("investor_access_key");
        if (investorKey === process.env.NEXT_PUBLIC_INVESTOR_KEY) {
          setIsAuthenticated(true);
          setAuthType("investor");
          setVendorName(null);
          return;
        }
      }

      setIsAuthenticated(false);
      setAuthType(null);
      setVendorName(null);
    };

    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    if (authType === "vendor") {
      // Vendor logout
      try {
        await fetch("/api/vendor/logout", { method: "POST" });
        setIsAuthenticated(false);
        setAuthType(null);
        setVendorName(null);
        router.push("/vendor/login");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else if (authType === "admin") {
      // Admin logout
      try {
        await fetch("/api/admin/logout", { method: "POST" });
        setIsAuthenticated(false);
        setAuthType(null);
        router.push("/admin");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else if (authType === "investor") {
      // Investor logout
      localStorage.removeItem("investor_access_key");
      setIsAuthenticated(false);
      setAuthType(null);
      router.push("/investors");
    }
  };

  const handleLogin = () => {
    // Redirect to vendor login by default
    router.push("/vendor/login");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <Logo size="standard" />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-8">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  pathname === link.href
                    ? "text-blue-600"
                    : "text-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons - Right */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {authType === "vendor" && (
                  <Link
                    href="/vendor/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {authType === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/vendor/login"
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Vendor Login
                </Link>
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col gap-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    pathname === link.href
                      ? "text-blue-600"
                      : "text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                {isAuthenticated ? (
                  <>
                    {authType === "vendor" && (
                      <Link
                        href="/vendor/dashboard"
                        onClick={closeMobileMenu}
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    {authType === "admin" && (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/vendor/login"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      Vendor Login
                    </Link>
                    <Link
                      href="/vendor/register"
                      onClick={closeMobileMenu}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
