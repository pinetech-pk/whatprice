import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title:
    "WhatPrice - Investment Opportunity | Pakistan's Leading Price Discovery Platform",
  description:
    "Join WhatPrice's investment journey. 9 years of proven success in Pakistan's price discovery market. Seeking $25-30K for 15-18% equity to transform into a leading vendor marketplace with 220M population reach.",
  keywords: [
    "WhatPrice investment",
    "Pakistan startup investment",
    "price discovery platform",
    "vendor marketplace Pakistan",
    "angel investment Pakistan",
    "Pakistan e-commerce",
    "startup funding Pakistan",
    "tech investment opportunity",
  ],
  authors: [{ name: "WhatPrice Team" }],
  creator: "WhatPrice",
  publisher: "WhatPrice",

  // Open Graph for social media (Facebook, LinkedIn)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.whatprice.com.pk",
    siteName: "WhatPrice Investment Opportunity",
    title:
      "WhatPrice Investment Opportunity - Pakistan's Premier Price Platform",
    description:
      "9 years of proven success. Seeking strategic partners to transform Pakistan's trusted price platform into a leading vendor marketplace. $25-30K investment for 15-18% equity.",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "WhatPrice Investment Opportunity",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title:
      "WhatPrice Investment Opportunity - Pakistan's Leading Price Platform",
    description:
      "Join us in building Pakistan's premier vendor marketplace. 9 years proven track record, 220M market reach.",
    images: ["/twitter-image.png"], // You'll need to add this image
    creator: "@whatprice", // Add your Twitter handle
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Favicon and icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Verification tags (add when you have them)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
