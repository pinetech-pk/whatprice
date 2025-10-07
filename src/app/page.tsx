import type { Metadata } from "next";
import WhatPriceLanding from "@/components/WhatPriceLanding";

export const metadata: Metadata = {
  title:
    "WhatPrice Investment Opportunity | Pakistan's Premier Price Discovery Platform",
  description:
    "Invest in WhatPrice - Pakistan's trusted price platform with 9 years of proven success. Seeking $25-30K for 15-18% equity to build a leading vendor marketplace. 220M population market, 35% YoY e-commerce growth.",
  keywords: [
    "WhatPrice investment",
    "Pakistan startup",
    "angel investment opportunity",
    "vendor marketplace",
    "price discovery platform Pakistan",
    "Pakistan e-commerce investment",
    "startup funding",
    "tech investment Pakistan",
  ],
  openGraph: {
    title:
      "WhatPrice Investment Opportunity - Join Pakistan's E-commerce Revolution",
    description:
      "9 years proven track record. $25-30K investment for 15-18% equity. Transform Pakistan's trusted price platform into a leading vendor marketplace.",
    url: "https://www.whatprice.com.pk",
    siteName: "WhatPrice",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatPrice Investment Opportunity",
    description:
      "Join us in building Pakistan's premier vendor marketplace. 9 years proven success, seeking strategic partners.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return <WhatPriceLanding />;
}
