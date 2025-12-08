"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import InvestorPitch from "@/components/InvestorPitch";
import InterestForm from "@/components/InterestForm";
import Link from "next/link";

export default function InvestorsPage() {
  const [accessKey, setAccessKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [error, setError] = useState("");

  // Check if user is already authenticated via server-side session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/investors/check-auth");
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        setShowKeyInput(false);
      }
    } catch {
      // Not authenticated
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/investors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsAuthenticated(true);
        setShowKeyInput(false);
        setAccessKey(""); // Clear the key from state for security
      } else {
        setError(data.error || "Invalid access key. Please try again or request access below.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/investors/logout", { method: "POST" });
    } catch {
      // Continue with client-side logout even if API fails
    }
    setIsAuthenticated(false);
    setShowKeyInput(true);
    setAccessKey("");
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show the pitch
  if (isAuthenticated) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50 flex gap-4">
          <Link
            href="/"
            className="bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <InvestorPitch />
      </div>
    );
  }

  // If not authenticated, show access key input or interest form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="mb-8 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          {showKeyInput ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Investor Access
                </h2>
                <p className="text-gray-600 mt-2">
                  Enter your access key to view the investment pitch
                </p>
              </div>

              <form onSubmit={handleKeySubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="accessKey"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Access Key
                  </label>
                  <input
                    type="password"
                    id="accessKey"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your access key"
                    required
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Access Pitch
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center text-gray-600 mb-4">
                  Don&apos;t have an access key?
                </p>
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="w-full bg-white text-blue-600 border-2 border-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300"
                >
                  Request Access
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => setShowKeyInput(true)}
                className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Access Key
              </button>
              <InterestForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
