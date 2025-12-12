'use client';

import React from 'react';
import Link from 'next/link';
import Logo from './Logo';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
  ],
  forConsumers: [
    { label: 'Browse Products', href: '/products' },
    { label: 'Categories', href: '/categories' },
    { label: 'Compare Prices', href: '/compare' },
    { label: 'How It Works', href: '/how-it-works' },
  ],
  forVendors: [
    { label: 'Sell on WhatPrice', href: '/vendor/register' },
    { label: 'Vendor Login', href: '/vendor/login' },
    { label: 'Pricing & Plans', href: '/vendor/pricing' },
    { label: 'Vendor Resources', href: '/vendor/resources' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/whatprice', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/whatprice', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/whatprice', label: 'Instagram' },
  { icon: Linkedin, href: 'https://linkedin.com/company/whatprice', label: 'LinkedIn' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <div className="bg-white inline-block p-2 rounded-lg">
                <Logo size="standard" />
              </div>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Pakistan&apos;s trusted price discovery platform. Compare prices, find the best deals,
              and connect with verified vendors across the country.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:info@whatprice.com.pk"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                info@whatprice.com.pk
              </a>
              <a
                href="tel:+923001234567"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                +92 300 1234567
              </a>
              <div className="flex items-start gap-2 text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>Lahore, Pakistan</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* For Consumers */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Consumers</h3>
            <ul className="space-y-2">
              {footerLinks.forConsumers.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2">
              {footerLinks.forVendors.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              &copy; {currentYear} WhatPrice. All rights reserved.
            </div>

            {/* Developer Credit */}
            <div className="text-gray-500 text-sm flex items-center gap-1">
              Designed & Developed by{' '}
              <a
                href="https://www.pinetech.pk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 font-medium"
              >
                Pinetech - Web Studio
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
