'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function PublicLayout({ children, showFooter = true }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}

export default PublicLayout;
