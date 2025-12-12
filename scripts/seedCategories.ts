/**
 * Pakistan Market Categories Seed Script
 *
 * This script populates the database with comprehensive category structure
 * tailored for the Pakistan market.
 *
 * Run: npx tsx scripts/seedCategories.ts
 *
 * Category Structure:
 * - Level 1: Main categories (Electronics, Home Appliances, Fashion, etc.)
 * - Level 2: Sub-categories (Mobiles, Laptops, ACs, etc.)
 * - Level 3: Product types (Smartphones, Gaming Laptops, Split ACs, etc.)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../src/lib/db/connection';
import Category from '../src/models/Category';

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  order: number;
  baseViewRate: number;
  minBidAmount: number;
  maxBidAmount: number;
  competitiveness: 'low' | 'medium' | 'high';
  children?: CategoryData[];
}

// Pakistan Market Category Structure
const PAKISTAN_CATEGORIES: CategoryData[] = [
  {
    name: 'Mobile Phones',
    slug: 'mobile-phones',
    description: 'Smartphones, feature phones, and mobile accessories',
    icon: 'smartphone',
    order: 1,
    baseViewRate: 25, // High competition category
    minBidAmount: 15,
    maxBidAmount: 200,
    competitiveness: 'high',
    children: [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Android and iOS smartphones',
        order: 1,
        baseViewRate: 30,
        minBidAmount: 20,
        maxBidAmount: 250,
        competitiveness: 'high',
        children: [
          {
            name: 'iPhone',
            slug: 'iphone',
            description: 'Apple iPhone smartphones',
            order: 1,
            baseViewRate: 35,
            minBidAmount: 25,
            maxBidAmount: 300,
            competitiveness: 'high',
          },
          {
            name: 'Samsung',
            slug: 'samsung-phones',
            description: 'Samsung Galaxy smartphones',
            order: 2,
            baseViewRate: 30,
            minBidAmount: 20,
            maxBidAmount: 250,
            competitiveness: 'high',
          },
          {
            name: 'Xiaomi',
            slug: 'xiaomi-phones',
            description: 'Xiaomi and Redmi smartphones',
            order: 3,
            baseViewRate: 25,
            minBidAmount: 15,
            maxBidAmount: 200,
            competitiveness: 'high',
          },
          {
            name: 'Oppo',
            slug: 'oppo-phones',
            description: 'Oppo smartphones',
            order: 4,
            baseViewRate: 25,
            minBidAmount: 15,
            maxBidAmount: 200,
            competitiveness: 'medium',
          },
          {
            name: 'Vivo',
            slug: 'vivo-phones',
            description: 'Vivo smartphones',
            order: 5,
            baseViewRate: 25,
            minBidAmount: 15,
            maxBidAmount: 200,
            competitiveness: 'medium',
          },
          {
            name: 'Realme',
            slug: 'realme-phones',
            description: 'Realme smartphones',
            order: 6,
            baseViewRate: 22,
            minBidAmount: 12,
            maxBidAmount: 180,
            competitiveness: 'medium',
          },
          {
            name: 'Infinix',
            slug: 'infinix-phones',
            description: 'Infinix smartphones',
            order: 7,
            baseViewRate: 20,
            minBidAmount: 10,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
          {
            name: 'Tecno',
            slug: 'tecno-phones',
            description: 'Tecno smartphones',
            order: 8,
            baseViewRate: 18,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Feature Phones',
        slug: 'feature-phones',
        description: 'Basic mobile phones and keypad phones',
        order: 2,
        baseViewRate: 10,
        minBidAmount: 8,
        maxBidAmount: 60,
        competitiveness: 'low',
      },
      {
        name: 'Mobile Accessories',
        slug: 'mobile-accessories',
        description: 'Cases, chargers, screen protectors, and more',
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 80,
        competitiveness: 'medium',
        children: [
          {
            name: 'Phone Cases & Covers',
            slug: 'phone-cases',
            description: 'Protective cases and covers for smartphones',
            order: 1,
            baseViewRate: 10,
            minBidAmount: 8,
            maxBidAmount: 60,
            competitiveness: 'low',
          },
          {
            name: 'Chargers & Cables',
            slug: 'chargers-cables',
            description: 'Mobile chargers, cables, and power banks',
            order: 2,
            baseViewRate: 12,
            minBidAmount: 8,
            maxBidAmount: 80,
            competitiveness: 'medium',
          },
          {
            name: 'Screen Protectors',
            slug: 'screen-protectors',
            description: 'Tempered glass and screen protectors',
            order: 3,
            baseViewRate: 10,
            minBidAmount: 8,
            maxBidAmount: 60,
            competitiveness: 'low',
          },
          {
            name: 'Earphones & Headsets',
            slug: 'earphones-headsets',
            description: 'Wired and wireless earphones',
            order: 4,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 100,
            competitiveness: 'medium',
          },
        ],
      },
    ],
  },
  {
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    description: 'Laptops, desktops, and computer accessories',
    icon: 'laptop',
    order: 2,
    baseViewRate: 25,
    minBidAmount: 20,
    maxBidAmount: 250,
    competitiveness: 'high',
    children: [
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'All types of laptop computers',
        order: 1,
        baseViewRate: 30,
        minBidAmount: 25,
        maxBidAmount: 300,
        competitiveness: 'high',
        children: [
          {
            name: 'Gaming Laptops',
            slug: 'gaming-laptops',
            description: 'High-performance gaming laptops',
            order: 1,
            baseViewRate: 35,
            minBidAmount: 30,
            maxBidAmount: 350,
            competitiveness: 'high',
          },
          {
            name: 'Business Laptops',
            slug: 'business-laptops',
            description: 'Professional and business laptops',
            order: 2,
            baseViewRate: 28,
            minBidAmount: 22,
            maxBidAmount: 280,
            competitiveness: 'medium',
          },
          {
            name: 'Student Laptops',
            slug: 'student-laptops',
            description: 'Affordable laptops for students',
            order: 3,
            baseViewRate: 22,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'high',
          },
          {
            name: 'MacBooks',
            slug: 'macbooks',
            description: 'Apple MacBook laptops',
            order: 4,
            baseViewRate: 35,
            minBidAmount: 30,
            maxBidAmount: 350,
            competitiveness: 'high',
          },
        ],
      },
      {
        name: 'Desktop Computers',
        slug: 'desktop-computers',
        description: 'Desktop PCs and workstations',
        order: 2,
        baseViewRate: 25,
        minBidAmount: 20,
        maxBidAmount: 250,
        competitiveness: 'medium',
        children: [
          {
            name: 'Gaming PCs',
            slug: 'gaming-pcs',
            description: 'Custom gaming desktop computers',
            order: 1,
            baseViewRate: 30,
            minBidAmount: 25,
            maxBidAmount: 300,
            competitiveness: 'high',
          },
          {
            name: 'Office Desktops',
            slug: 'office-desktops',
            description: 'Desktops for office and home use',
            order: 2,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'low',
          },
          {
            name: 'All-in-One PCs',
            slug: 'all-in-one-pcs',
            description: 'All-in-one desktop computers',
            order: 3,
            baseViewRate: 22,
            minBidAmount: 18,
            maxBidAmount: 200,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: 'Computer Components',
        slug: 'computer-components',
        description: 'PC parts and components',
        order: 3,
        baseViewRate: 20,
        minBidAmount: 15,
        maxBidAmount: 200,
        competitiveness: 'medium',
        children: [
          {
            name: 'Graphics Cards',
            slug: 'graphics-cards',
            description: 'NVIDIA and AMD graphics cards',
            order: 1,
            baseViewRate: 28,
            minBidAmount: 22,
            maxBidAmount: 280,
            competitiveness: 'high',
          },
          {
            name: 'Processors',
            slug: 'processors',
            description: 'Intel and AMD CPUs',
            order: 2,
            baseViewRate: 25,
            minBidAmount: 20,
            maxBidAmount: 250,
            competitiveness: 'high',
          },
          {
            name: 'RAM & Memory',
            slug: 'ram-memory',
            description: 'RAM modules and memory',
            order: 3,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
          {
            name: 'Storage Drives',
            slug: 'storage-drives',
            description: 'SSDs, HDDs, and external drives',
            order: 4,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
          {
            name: 'Motherboards',
            slug: 'motherboards',
            description: 'Computer motherboards',
            order: 5,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: 'Computer Accessories',
        slug: 'computer-accessories',
        description: 'Keyboards, mice, monitors, and more',
        order: 4,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
        children: [
          {
            name: 'Monitors',
            slug: 'monitors',
            description: 'Computer monitors and displays',
            order: 1,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'medium',
          },
          {
            name: 'Keyboards',
            slug: 'keyboards',
            description: 'Mechanical and membrane keyboards',
            order: 2,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Mouse & Mousepads',
            slug: 'mouse-mousepads',
            description: 'Gaming and office mice',
            order: 3,
            baseViewRate: 12,
            minBidAmount: 8,
            maxBidAmount: 100,
            competitiveness: 'low',
          },
          {
            name: 'Printers & Scanners',
            slug: 'printers-scanners',
            description: 'Inkjet, laser printers, and scanners',
            order: 4,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
        ],
      },
    ],
  },
  {
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'Air conditioners, refrigerators, washing machines, and more',
    icon: 'home',
    order: 3,
    baseViewRate: 20,
    minBidAmount: 15,
    maxBidAmount: 180,
    competitiveness: 'high',
    children: [
      {
        name: 'Air Conditioners',
        slug: 'air-conditioners',
        description: 'Split, window, and portable ACs',
        order: 1,
        baseViewRate: 25,
        minBidAmount: 20,
        maxBidAmount: 220,
        competitiveness: 'high',
        children: [
          {
            name: 'Split ACs',
            slug: 'split-acs',
            description: 'Inverter and non-inverter split ACs',
            order: 1,
            baseViewRate: 28,
            minBidAmount: 22,
            maxBidAmount: 250,
            competitiveness: 'high',
          },
          {
            name: 'Window ACs',
            slug: 'window-acs',
            description: 'Window air conditioners',
            order: 2,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'medium',
          },
          {
            name: 'Portable ACs',
            slug: 'portable-acs',
            description: 'Portable and floor standing ACs',
            order: 3,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Refrigerators',
        slug: 'refrigerators',
        description: 'Single door, double door, and side-by-side fridges',
        order: 2,
        baseViewRate: 22,
        minBidAmount: 18,
        maxBidAmount: 200,
        competitiveness: 'high',
        children: [
          {
            name: 'Double Door Refrigerators',
            slug: 'double-door-refrigerators',
            description: 'Double door frost-free refrigerators',
            order: 1,
            baseViewRate: 25,
            minBidAmount: 20,
            maxBidAmount: 220,
            competitiveness: 'high',
          },
          {
            name: 'Single Door Refrigerators',
            slug: 'single-door-refrigerators',
            description: 'Compact single door refrigerators',
            order: 2,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
          {
            name: 'Side-by-Side Refrigerators',
            slug: 'side-by-side-refrigerators',
            description: 'Premium side-by-side refrigerators',
            order: 3,
            baseViewRate: 28,
            minBidAmount: 22,
            maxBidAmount: 250,
            competitiveness: 'medium',
          },
          {
            name: 'Deep Freezers',
            slug: 'deep-freezers',
            description: 'Chest and upright deep freezers',
            order: 4,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Washing Machines',
        slug: 'washing-machines',
        description: 'Automatic and semi-automatic washing machines',
        order: 3,
        baseViewRate: 20,
        minBidAmount: 15,
        maxBidAmount: 180,
        competitiveness: 'high',
        children: [
          {
            name: 'Automatic Washing Machines',
            slug: 'automatic-washing-machines',
            description: 'Front and top load automatic washers',
            order: 1,
            baseViewRate: 25,
            minBidAmount: 20,
            maxBidAmount: 220,
            competitiveness: 'high',
          },
          {
            name: 'Semi-Automatic Washing Machines',
            slug: 'semi-automatic-washing-machines',
            description: 'Twin tub washing machines',
            order: 2,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Dryers',
            slug: 'dryers',
            description: 'Clothes dryers and spin dryers',
            order: 3,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Kitchen Appliances',
        slug: 'kitchen-appliances',
        description: 'Microwaves, ovens, blenders, and more',
        order: 4,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
        children: [
          {
            name: 'Microwaves & Ovens',
            slug: 'microwaves-ovens',
            description: 'Microwave ovens and built-in ovens',
            order: 1,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
          {
            name: 'Blenders & Mixers',
            slug: 'blenders-mixers',
            description: 'Blenders, food processors, and mixers',
            order: 2,
            baseViewRate: 12,
            minBidAmount: 8,
            maxBidAmount: 100,
            competitiveness: 'medium',
          },
          {
            name: 'Rice Cookers',
            slug: 'rice-cookers',
            description: 'Electric rice cookers',
            order: 3,
            baseViewRate: 10,
            minBidAmount: 8,
            maxBidAmount: 80,
            competitiveness: 'low',
          },
          {
            name: 'Air Fryers',
            slug: 'air-fryers',
            description: 'Air fryers and health grills',
            order: 4,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Electric Kettles',
            slug: 'electric-kettles',
            description: 'Electric kettles and water boilers',
            order: 5,
            baseViewRate: 8,
            minBidAmount: 6,
            maxBidAmount: 60,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Fans & Coolers',
        slug: 'fans-coolers',
        description: 'Ceiling fans, pedestal fans, and air coolers',
        order: 5,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
        children: [
          {
            name: 'Ceiling Fans',
            slug: 'ceiling-fans',
            description: 'Inverter and regular ceiling fans',
            order: 1,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'high',
          },
          {
            name: 'Pedestal Fans',
            slug: 'pedestal-fans',
            description: 'Stand and pedestal fans',
            order: 2,
            baseViewRate: 12,
            minBidAmount: 8,
            maxBidAmount: 100,
            competitiveness: 'medium',
          },
          {
            name: 'Air Coolers',
            slug: 'air-coolers',
            description: 'Desert and room air coolers',
            order: 3,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'high',
          },
        ],
      },
      {
        name: 'Water Dispensers',
        slug: 'water-dispensers',
        description: 'Water dispensers and water purifiers',
        order: 6,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Geysers & Water Heaters',
        slug: 'geysers-water-heaters',
        description: 'Electric and gas water heaters',
        order: 7,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'high',
      },
    ],
  },
  {
    name: 'TV & Entertainment',
    slug: 'tv-entertainment',
    description: 'LED TVs, home theater systems, and gaming consoles',
    icon: 'tv',
    order: 4,
    baseViewRate: 22,
    minBidAmount: 18,
    maxBidAmount: 200,
    competitiveness: 'high',
    children: [
      {
        name: 'LED TVs',
        slug: 'led-tvs',
        description: 'Smart and non-smart LED televisions',
        order: 1,
        baseViewRate: 25,
        minBidAmount: 20,
        maxBidAmount: 250,
        competitiveness: 'high',
        children: [
          {
            name: '32-43 Inch TVs',
            slug: '32-43-inch-tvs',
            description: 'Compact TVs for bedrooms and small rooms',
            order: 1,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'high',
          },
          {
            name: '50-55 Inch TVs',
            slug: '50-55-inch-tvs',
            description: 'Medium-sized TVs for living rooms',
            order: 2,
            baseViewRate: 25,
            minBidAmount: 20,
            maxBidAmount: 220,
            competitiveness: 'high',
          },
          {
            name: '65+ Inch TVs',
            slug: '65-plus-inch-tvs',
            description: 'Large premium televisions',
            order: 3,
            baseViewRate: 30,
            minBidAmount: 25,
            maxBidAmount: 280,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: 'Home Audio',
        slug: 'home-audio',
        description: 'Speakers, soundbars, and home theater systems',
        order: 2,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'medium',
        children: [
          {
            name: 'Soundbars',
            slug: 'soundbars',
            description: 'TV soundbars and sound systems',
            order: 1,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'medium',
          },
          {
            name: 'Bluetooth Speakers',
            slug: 'bluetooth-speakers',
            description: 'Portable Bluetooth speakers',
            order: 2,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Home Theater Systems',
            slug: 'home-theater-systems',
            description: '5.1 and 7.1 surround sound systems',
            order: 3,
            baseViewRate: 22,
            minBidAmount: 18,
            maxBidAmount: 200,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming consoles and accessories',
        order: 3,
        baseViewRate: 25,
        minBidAmount: 20,
        maxBidAmount: 250,
        competitiveness: 'high',
        children: [
          {
            name: 'Gaming Consoles',
            slug: 'gaming-consoles',
            description: 'PlayStation, Xbox, and Nintendo consoles',
            order: 1,
            baseViewRate: 30,
            minBidAmount: 25,
            maxBidAmount: 300,
            competitiveness: 'high',
          },
          {
            name: 'Gaming Accessories',
            slug: 'gaming-accessories',
            description: 'Controllers, headsets, and gaming chairs',
            order: 2,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
        ],
      },
    ],
  },
  {
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: "Men's, women's, and kids' clothing and accessories",
    icon: 'shirt',
    order: 5,
    baseViewRate: 15,
    minBidAmount: 10,
    maxBidAmount: 120,
    competitiveness: 'medium',
    children: [
      {
        name: "Men's Fashion",
        slug: 'mens-fashion',
        description: "Men's clothing, footwear, and accessories",
        order: 1,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
        children: [
          {
            name: "Men's Clothing",
            slug: 'mens-clothing',
            description: 'Shalwar Kameez, shirts, trousers, and kurtas',
            order: 1,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: "Men's Footwear",
            slug: 'mens-footwear',
            description: 'Shoes, sandals, and sneakers',
            order: 2,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: "Men's Watches",
            slug: 'mens-watches',
            description: 'Analog, digital, and smart watches',
            order: 3,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: "Women's Fashion",
        slug: 'womens-fashion',
        description: "Women's clothing, footwear, and accessories",
        order: 2,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'high',
        children: [
          {
            name: "Women's Clothing",
            slug: 'womens-clothing',
            description: 'Lawn, silk, cotton suits, and western wear',
            order: 1,
            baseViewRate: 20,
            minBidAmount: 15,
            maxBidAmount: 180,
            competitiveness: 'high',
          },
          {
            name: "Women's Footwear",
            slug: 'womens-footwear',
            description: 'Heels, flats, sandals, and sneakers',
            order: 2,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Handbags & Clutches',
            slug: 'handbags-clutches',
            description: "Women's bags and purses",
            order: 3,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
          {
            name: 'Jewelry',
            slug: 'jewelry',
            description: 'Fashion and artificial jewelry',
            order: 4,
            baseViewRate: 15,
            minBidAmount: 10,
            maxBidAmount: 120,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: "Kids' Fashion",
        slug: 'kids-fashion',
        description: "Children's clothing and footwear",
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Health & Beauty',
    slug: 'health-beauty',
    description: 'Skincare, makeup, personal care, and health products',
    icon: 'heart',
    order: 6,
    baseViewRate: 15,
    minBidAmount: 10,
    maxBidAmount: 120,
    competitiveness: 'medium',
    children: [
      {
        name: 'Skincare',
        slug: 'skincare',
        description: 'Face wash, moisturizers, serums, and more',
        order: 1,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'high',
      },
      {
        name: 'Makeup',
        slug: 'makeup',
        description: 'Foundation, lipstick, mascara, and makeup kits',
        order: 2,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'high',
      },
      {
        name: 'Hair Care',
        slug: 'hair-care',
        description: 'Shampoos, conditioners, and hair treatments',
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'medium',
      },
      {
        name: 'Personal Care',
        slug: 'personal-care',
        description: 'Grooming products, trimmers, and shavers',
        order: 4,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        description: 'Supplements, vitamins, and health devices',
        order: 5,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Sports equipment, fitness gear, and outdoor products',
    icon: 'dumbbell',
    order: 7,
    baseViewRate: 12,
    minBidAmount: 8,
    maxBidAmount: 100,
    competitiveness: 'low',
    children: [
      {
        name: 'Exercise & Fitness',
        slug: 'exercise-fitness',
        description: 'Gym equipment, yoga mats, and fitness accessories',
        order: 1,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Sports Equipment',
        slug: 'sports-equipment',
        description: 'Cricket, football, badminton, and more',
        order: 2,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
        children: [
          {
            name: 'Cricket',
            slug: 'cricket',
            description: 'Cricket bats, balls, and gear',
            order: 1,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'high',
          },
          {
            name: 'Football',
            slug: 'football',
            description: 'Footballs, boots, and accessories',
            order: 2,
            baseViewRate: 12,
            minBidAmount: 8,
            maxBidAmount: 100,
            competitiveness: 'medium',
          },
          {
            name: 'Badminton',
            slug: 'badminton',
            description: 'Rackets, shuttlecocks, and nets',
            order: 3,
            baseViewRate: 10,
            minBidAmount: 8,
            maxBidAmount: 80,
            competitiveness: 'low',
          },
        ],
      },
      {
        name: 'Outdoor & Camping',
        slug: 'outdoor-camping',
        description: 'Tents, camping gear, and outdoor equipment',
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'low',
      },
      {
        name: 'Bicycles',
        slug: 'bicycles',
        description: 'Mountain bikes, road bikes, and kids bikes',
        order: 4,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car accessories, motorcycle parts, and automotive tools',
    icon: 'car',
    order: 8,
    baseViewRate: 18,
    minBidAmount: 12,
    maxBidAmount: 150,
    competitiveness: 'medium',
    children: [
      {
        name: 'Car Accessories',
        slug: 'car-accessories',
        description: 'Car electronics, covers, and interior accessories',
        order: 1,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'medium',
      },
      {
        name: 'Car Electronics',
        slug: 'car-electronics',
        description: 'Car audio, GPS, and dash cams',
        order: 2,
        baseViewRate: 20,
        minBidAmount: 15,
        maxBidAmount: 180,
        competitiveness: 'medium',
      },
      {
        name: 'Motorcycle Accessories',
        slug: 'motorcycle-accessories',
        description: 'Helmets, gloves, and motorcycle gear',
        order: 3,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Tires & Rims',
        slug: 'tires-rims',
        description: 'Car and motorcycle tires and alloy rims',
        order: 4,
        baseViewRate: 20,
        minBidAmount: 15,
        maxBidAmount: 180,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Furniture, home decor, and household items',
    icon: 'sofa',
    order: 9,
    baseViewRate: 15,
    minBidAmount: 10,
    maxBidAmount: 120,
    competitiveness: 'medium',
    children: [
      {
        name: 'Furniture',
        slug: 'furniture',
        description: 'Sofas, beds, tables, and chairs',
        order: 1,
        baseViewRate: 20,
        minBidAmount: 15,
        maxBidAmount: 180,
        competitiveness: 'medium',
        children: [
          {
            name: 'Living Room Furniture',
            slug: 'living-room-furniture',
            description: 'Sofas, coffee tables, and TV stands',
            order: 1,
            baseViewRate: 22,
            minBidAmount: 18,
            maxBidAmount: 200,
            competitiveness: 'medium',
          },
          {
            name: 'Bedroom Furniture',
            slug: 'bedroom-furniture',
            description: 'Beds, wardrobes, and dressing tables',
            order: 2,
            baseViewRate: 22,
            minBidAmount: 18,
            maxBidAmount: 200,
            competitiveness: 'medium',
          },
          {
            name: 'Office Furniture',
            slug: 'office-furniture',
            description: 'Desks, office chairs, and storage',
            order: 3,
            baseViewRate: 18,
            minBidAmount: 12,
            maxBidAmount: 150,
            competitiveness: 'medium',
          },
        ],
      },
      {
        name: 'Home Decor',
        slug: 'home-decor',
        description: 'Wall art, mirrors, and decorative items',
        order: 2,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'low',
      },
      {
        name: 'Lighting',
        slug: 'lighting',
        description: 'LED lights, chandeliers, and lamps',
        order: 3,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Bed & Bath',
        slug: 'bed-bath',
        description: 'Bedsheets, towels, and bathroom accessories',
        order: 4,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'low',
      },
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        description: 'Cookware, dinnerware, and kitchen storage',
        order: 5,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'low',
      },
    ],
  },
  {
    name: 'Baby & Kids',
    slug: 'baby-kids',
    description: 'Baby products, toys, and kids essentials',
    icon: 'baby',
    order: 10,
    baseViewRate: 15,
    minBidAmount: 10,
    maxBidAmount: 120,
    competitiveness: 'medium',
    children: [
      {
        name: 'Baby Care',
        slug: 'baby-care',
        description: 'Diapers, feeding, and baby essentials',
        order: 1,
        baseViewRate: 15,
        minBidAmount: 10,
        maxBidAmount: 120,
        competitiveness: 'medium',
      },
      {
        name: 'Baby Gear',
        slug: 'baby-gear',
        description: 'Strollers, car seats, and carriers',
        order: 2,
        baseViewRate: 18,
        minBidAmount: 12,
        maxBidAmount: 150,
        competitiveness: 'medium',
      },
      {
        name: 'Toys & Games',
        slug: 'toys-games',
        description: 'Action figures, dolls, and board games',
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Books, office supplies, and school stationery',
    icon: 'book',
    order: 11,
    baseViewRate: 10,
    minBidAmount: 8,
    maxBidAmount: 80,
    competitiveness: 'low',
    children: [
      {
        name: 'Books',
        slug: 'books',
        description: 'Fiction, non-fiction, and educational books',
        order: 1,
        baseViewRate: 10,
        minBidAmount: 8,
        maxBidAmount: 80,
        competitiveness: 'low',
      },
      {
        name: 'Stationery',
        slug: 'stationery',
        description: 'Pens, notebooks, and office supplies',
        order: 2,
        baseViewRate: 8,
        minBidAmount: 6,
        maxBidAmount: 60,
        competitiveness: 'low',
      },
      {
        name: 'School Supplies',
        slug: 'school-supplies',
        description: 'Bags, lunch boxes, and school essentials',
        order: 3,
        baseViewRate: 12,
        minBidAmount: 8,
        maxBidAmount: 100,
        competitiveness: 'medium',
      },
    ],
  },
  {
    name: 'Groceries & Food',
    slug: 'groceries-food',
    description: 'Grocery items, packaged food, and beverages',
    icon: 'shopping-cart',
    order: 12,
    baseViewRate: 10,
    minBidAmount: 8,
    maxBidAmount: 80,
    competitiveness: 'low',
    children: [
      {
        name: 'Packaged Food',
        slug: 'packaged-food',
        description: 'Snacks, cereals, and ready-to-eat food',
        order: 1,
        baseViewRate: 10,
        minBidAmount: 8,
        maxBidAmount: 80,
        competitiveness: 'low',
      },
      {
        name: 'Beverages',
        slug: 'beverages',
        description: 'Tea, coffee, juices, and soft drinks',
        order: 2,
        baseViewRate: 10,
        minBidAmount: 8,
        maxBidAmount: 80,
        competitiveness: 'low',
      },
      {
        name: 'Cooking Essentials',
        slug: 'cooking-essentials',
        description: 'Rice, flour, oil, and spices',
        order: 3,
        baseViewRate: 8,
        minBidAmount: 6,
        maxBidAmount: 60,
        competitiveness: 'low',
      },
    ],
  },
];

// Helper function to recursively create categories
async function createCategory(
  categoryData: CategoryData,
  parentId: mongoose.Types.ObjectId | null = null
): Promise<mongoose.Types.ObjectId> {
  const { children, ...data } = categoryData;

  const category = new Category({
    ...data,
    parent: parentId,
    isActive: true,
    currency: 'PKR',
    totalProducts: 0,
    totalViews: 0,
  });

  await category.save();
  console.log(`  ✓ Created: ${data.name}${parentId ? ' (sub-category)' : ''}`);

  // Recursively create children
  if (children && children.length > 0) {
    for (const child of children) {
      await createCategory(child, category._id);
    }
  }

  return category._id;
}

async function seedCategories() {
  console.log('\n🏷️  Seeding Pakistan market categories...\n');

  let totalCreated = 0;

  for (const category of PAKISTAN_CATEGORIES) {
    console.log(`\n📁 ${category.name}`);
    await createCategory(category);

    // Count total categories (including children)
    const countCategories = (cat: CategoryData): number => {
      let count = 1;
      if (cat.children) {
        for (const child of cat.children) {
          count += countCategories(child);
        }
      }
      return count;
    };
    totalCreated += countCategories(category);
  }

  return totalCreated;
}

async function main() {
  try {
    console.log('🌱 Starting Pakistan market categories seeding...');

    // Connect to database
    await connectDB();

    // Ask about clearing existing categories
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`\n⚠️  Found ${existingCount} existing categories.`);
      console.log('   Clearing existing categories...');
      await Category.deleteMany({});
      console.log('   ✅ Existing categories cleared');
    }

    // Seed categories
    const totalCreated = await seedCategories();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ Category seeding completed!');
    console.log('='.repeat(50));
    console.log(`\n📊 Summary:`);
    console.log(`   Total categories created: ${totalCreated}`);
    console.log(`   Main categories: ${PAKISTAN_CATEGORIES.length}`);

    // Verify hierarchy
    const level1 = await Category.countDocuments({ parent: null });
    const level2 = await Category.countDocuments({
      parent: { $ne: null },
    });
    console.log(`   Level 1 (Main): ${level1}`);
    console.log(`   Level 2+ (Sub): ${level2}`);

    // Show CPV rate range
    const cpvStats = await Category.aggregate([
      {
        $group: {
          _id: null,
          minRate: { $min: '$baseViewRate' },
          maxRate: { $max: '$baseViewRate' },
          avgRate: { $avg: '$baseViewRate' },
        },
      },
    ]);

    if (cpvStats.length > 0) {
      console.log(`\n💰 CPV Rate Range:`);
      console.log(`   Min: PKR ${cpvStats[0].minRate} per 100 views`);
      console.log(`   Max: PKR ${cpvStats[0].maxRate} per 100 views`);
      console.log(`   Avg: PKR ${Math.round(cpvStats[0].avgRate)} per 100 views`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
