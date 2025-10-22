import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WhatPrice - Pakistan's Premier Price Discovery Platform",
  description:
    "Pakistan's trusted price platform with 9 years of proven success. Your one-stop solution for price discovery and vendor marketplace.",
  keywords: [
    "WhatPrice",
    "Pakistan price platform",
    "price discovery",
    "vendor marketplace Pakistan",
    "Pakistan e-commerce",
  ],
  openGraph: {
    title: "WhatPrice - Pakistan's Premier Price Discovery Platform",
    description:
      "9 years proven track record. Pakistan's trusted price platform.",
    url: "https://www.whatprice.com.pk",
    siteName: "WhatPrice",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatPrice - Pakistan's Premier Price Discovery Platform",
    description:
      "9 years proven track record. Pakistan's trusted price platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center">
            <h1 className="text-3xl font-bold text-blue-600">WhatPrice</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Pakistan&apos;s Trusted Price Discovery Platform
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Building the future of vendor marketplace in Pakistan
            </p>
          </div>

          {/* Placeholder Content Sections */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Trusted Platform
              </h3>
              <p className="text-gray-600">
                9 years of proven success serving Pakistan&apos;s market
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Market Leader
              </h3>
              <p className="text-gray-600">
                Connecting vendors and customers across major cities
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Growing Community
              </h3>
              <p className="text-gray-600">
                Empowering businesses to succeed in the digital economy
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-12 mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              More Coming Soon
            </h3>
            <p className="text-lg text-gray-600">
              We&apos;re working on something exciting. Stay tuned for updates!
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Interested in Investment Opportunities?
              </h3>
              <p className="text-gray-600 mb-6">
                Discover strategic partnership opportunities with WhatPrice
              </p>
              <Link
                href="/investors"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-full font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                View Investor Information
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
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              <p>&copy; 2025 WhatPrice. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
