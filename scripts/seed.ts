/**
 * Database Seeding Script
 *
 * This script populates the database with initial data for testing and development.
 * Run: npx tsx scripts/seed.ts
 */

import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/db/connection';
import {
  Role,
  Category,
  Retailer,
  User,
  Product,
  Vendor,
  MasterProduct,
  ProductView,
  ViewTransaction,
  VendorMetrics,
} from '../src/models';
import { PERMISSIONS, DEFAULT_ROLES, IRole } from '../src/models/Role';
import { ICategory } from '../src/models/Category';
import { IRetailer } from '../src/models/Retailer';
import { IVendor } from '../src/models/Vendor';
import mongoose from 'mongoose';

async function seedRoles() {
  console.log('Seeding roles...');

  const roles = [
    {
      name: 'Administrator',
      slug: DEFAULT_ROLES.ADMIN,
      description: 'Full system access with all permissions',
      permissions: Object.values(PERMISSIONS),
      isActive: true,
    },
    {
      name: 'User',
      slug: DEFAULT_ROLES.USER,
      description: 'Regular user with basic permissions',
      permissions: [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.RETAILER_READ,
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.REVIEW_CREATE,
        PERMISSIONS.REVIEW_READ,
        PERMISSIONS.CATEGORY_READ,
      ],
      isActive: true,
    },
    {
      name: 'Retailer',
      slug: DEFAULT_ROLES.RETAILER,
      description: 'Retailer account with product and order management',
      permissions: [
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.RETAILER_READ,
        PERMISSIONS.RETAILER_UPDATE,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.ORDER_UPDATE,
        PERMISSIONS.REVIEW_READ,
        PERMISSIONS.CATEGORY_READ,
      ],
      isActive: true,
    },
    {
      name: 'Moderator',
      slug: DEFAULT_ROLES.MODERATOR,
      description: 'Content moderator with review management',
      permissions: [
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.RETAILER_READ,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.REVIEW_READ,
        PERMISSIONS.REVIEW_UPDATE,
        PERMISSIONS.REVIEW_DELETE,
        PERMISSIONS.CATEGORY_READ,
      ],
      isActive: true,
    },
    {
      name: 'Vendor',
      slug: DEFAULT_ROLES.VENDOR,
      description: 'Marketplace vendor with product management capabilities',
      permissions: [
        PERMISSIONS.VENDOR_DASHBOARD,
        PERMISSIONS.VENDOR_PRODUCTS,
        PERMISSIONS.VENDOR_ANALYTICS,
        PERMISSIONS.VENDOR_BILLING,
        PERMISSIONS.VENDOR_SETTINGS,
        PERMISSIONS.PRODUCT_CREATE,
        PERMISSIONS.PRODUCT_READ,
        PERMISSIONS.PRODUCT_UPDATE,
        PERMISSIONS.PRODUCT_DELETE,
      ],
      isActive: true,
    },
  ];

  const createdRoles = await Role.insertMany(roles);
  console.log(`✅ Created ${createdRoles.length} roles`);
  return createdRoles;
}

async function seedCategories() {
  console.log('Seeding categories...');

  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      order: 1,
      baseViewRate: 15,
      minBidAmount: 10,
      maxBidAmount: 100,
    },
    {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones',
      isActive: true,
      order: 1,
      baseViewRate: 20,
      minBidAmount: 15,
      maxBidAmount: 150,
    },
    {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptop computers and notebooks',
      isActive: true,
      order: 2,
      baseViewRate: 25,
      minBidAmount: 20,
      maxBidAmount: 200,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      isActive: true,
      order: 2,
      baseViewRate: 10,
      minBidAmount: 10,
      maxBidAmount: 80,
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      isActive: true,
      order: 3,
      baseViewRate: 12,
      minBidAmount: 10,
      maxBidAmount: 100,
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      isActive: true,
      order: 4,
      baseViewRate: 10,
      minBidAmount: 10,
      maxBidAmount: 80,
    },
  ];

  const createdCategories = await Category.insertMany(categories);

  // Update parent-child relationships
  const electronics = createdCategories.find((c) => c.slug === 'electronics');
  if (electronics) {
    await Category.updateMany(
      { slug: { $in: ['smartphones', 'laptops'] } },
      { parent: electronics._id }
    );
  }

  console.log(`✅ Created ${createdCategories.length} categories`);
  return createdCategories;
}

async function seedRetailers() {
  console.log('Seeding retailers...');

  const retailers = [
    {
      name: 'TechMart',
      slug: 'techmart',
      description: 'Your one-stop shop for all tech products',
      website: 'https://techmart.example.com',
      email: 'contact@techmart.example.com',
      phone: '+92-300-1234567',
      address: {
        street: '123 Tech Street',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Express Shipping', 'In-Store Pickup'],
      paymentMethods: ['Credit Card', 'Debit Card', 'JazzCash', 'EasyPaisa'],
    },
    {
      name: 'ElectroWorld',
      slug: 'electroworld',
      description: 'Premium electronics at competitive prices',
      website: 'https://electroworld.example.com',
      email: 'support@electroworld.example.com',
      phone: '+92-300-2345678',
      address: {
        street: '456 Electronics Ave',
        city: 'Karachi',
        state: 'Sindh',
        zipCode: '74000',
        country: 'Pakistan',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Next Day Delivery'],
      paymentMethods: ['Credit Card', 'Debit Card', 'Bank Transfer'],
    },
    {
      name: 'BestBuy Store',
      slug: 'bestbuy-store',
      description: 'Best deals on consumer electronics',
      website: 'https://bestbuystore.example.com',
      email: 'info@bestbuystore.example.com',
      phone: '+92-300-3456789',
      address: {
        street: '789 Shopping Blvd',
        city: 'Islamabad',
        state: 'ICT',
        zipCode: '44000',
        country: 'Pakistan',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Express Shipping', 'Same Day Delivery'],
      paymentMethods: ['Credit Card', 'Debit Card', 'JazzCash', 'EasyPaisa', 'COD'],
    },
  ];

  const createdRetailers = await Retailer.insertMany(retailers);
  console.log(`✅ Created ${createdRetailers.length} retailers`);
  return createdRetailers;
}

async function seedUsers(roles: IRole[]) {
  console.log('Seeding users...');

  const adminRole = roles.find((r) => r.slug === DEFAULT_ROLES.ADMIN);
  const userRole = roles.find((r) => r.slug === DEFAULT_ROLES.USER);
  const vendorRole = roles.find((r) => r.slug === DEFAULT_ROLES.VENDOR);

  if (!adminRole || !userRole || !vendorRole) {
    console.error('❌ Required roles not found');
    return [];
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword = await bcrypt.hash('User1234!', 12);
  const vendorPassword = await bcrypt.hash('Vendor123!', 12);

  const users = [
    {
      email: 'admin@whatprice.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: adminRole._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'user@whatprice.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: userRole._id,
      isActive: true,
      isEmailVerified: true,
      phone: '+92-300-1111111',
      address: {
        street: '321 User Lane',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan',
      },
    },
    // Vendor users
    {
      email: 'vendor1@whatprice.com',
      password: vendorPassword,
      firstName: 'Ali',
      lastName: 'Khan',
      role: vendorRole._id,
      isActive: true,
      isEmailVerified: true,
      phone: '+92-300-1234567',
    },
    {
      email: 'vendor2@whatprice.com',
      password: vendorPassword,
      firstName: 'Sara',
      lastName: 'Ahmed',
      role: vendorRole._id,
      isActive: true,
      isEmailVerified: true,
      phone: '+92-300-2345678',
    },
    {
      email: 'vendor3@whatprice.com',
      password: vendorPassword,
      firstName: 'Hassan',
      lastName: 'Malik',
      role: vendorRole._id,
      isActive: true,
      isEmailVerified: true,
      phone: '+92-300-3456789',
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

async function seedVendors(users: mongoose.Document[]) {
  console.log('Seeding vendors...');

  const vendorUsers = users.filter((u) => (u as unknown as { email: string }).email.startsWith('vendor'));

  if (vendorUsers.length < 3) {
    console.error('❌ Not enough vendor users found');
    return [];
  }

  const vendors = [
    {
      userId: vendorUsers[0]._id,
      storeName: 'Ali Electronics',
      slug: 'ali-electronics',
      description: 'Quality electronics at the best prices in Lahore. 10+ years of experience.',
      email: 'vendor1@whatprice.com',
      phone: '03001234567',
      whatsapp: '03001234567',
      website: 'https://alielectronics.pk',
      address: {
        street: 'Shop 15, Hall Road',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      viewCredits: 5000,
      totalCreditsPurchased: 5000,
      totalCreditsUsed: 0,
      totalSpent: 500,
      graduationTier: 'starter',
      tierStartDate: new Date(),
      totalProducts: 0,
      activeProducts: 0,
      totalViews: 0,
      totalClicks: 0,
      totalSales: 0,
      conversionRate: 0,
      rating: 4.5,
      reviewCount: 25,
      responseRate: 95,
      defaultBidAmount: 15,
      maxDailyBudget: 500,
      currentDailySpend: 0,
      lastDailyResetAt: new Date(),
      isActive: true,
      isFeatured: true,
    },
    {
      userId: vendorUsers[1]._id,
      storeName: 'Sara Mobile Hub',
      slug: 'sara-mobile-hub',
      description: 'Premium smartphones and accessories. Authorized dealer for major brands.',
      email: 'vendor2@whatprice.com',
      phone: '03002345678',
      whatsapp: '03002345678',
      address: {
        street: 'Plaza 22, Saddar',
        city: 'Karachi',
        state: 'Sindh',
        zipCode: '74000',
        country: 'Pakistan',
      },
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      viewCredits: 3000,
      totalCreditsPurchased: 3000,
      totalCreditsUsed: 0,
      totalSpent: 300,
      graduationTier: 'growth',
      tierStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      totalProducts: 0,
      activeProducts: 0,
      totalViews: 0,
      totalClicks: 0,
      totalSales: 0,
      conversionRate: 0,
      rating: 4.8,
      reviewCount: 42,
      responseRate: 98,
      defaultBidAmount: 20,
      maxDailyBudget: 800,
      currentDailySpend: 0,
      lastDailyResetAt: new Date(),
      isActive: true,
      isFeatured: false,
    },
    {
      userId: vendorUsers[2]._id,
      storeName: 'Hassan Tech Store',
      slug: 'hassan-tech-store',
      description: 'Your trusted destination for laptops and computers in Islamabad.',
      email: 'vendor3@whatprice.com',
      phone: '03003456789',
      whatsapp: '03003456789',
      address: {
        street: 'F-10 Markaz',
        city: 'Islamabad',
        state: 'ICT',
        zipCode: '44000',
        country: 'Pakistan',
      },
      verificationStatus: 'pending', // One pending vendor for testing
      viewCredits: 100, // Free starter credits
      totalCreditsPurchased: 0,
      totalCreditsUsed: 0,
      totalSpent: 0,
      graduationTier: 'starter',
      tierStartDate: new Date(),
      totalProducts: 0,
      activeProducts: 0,
      totalViews: 0,
      totalClicks: 0,
      totalSales: 0,
      conversionRate: 0,
      rating: 0,
      reviewCount: 0,
      responseRate: 0,
      defaultBidAmount: 10,
      currentDailySpend: 0,
      lastDailyResetAt: new Date(),
      isActive: true,
      isFeatured: false,
    },
  ];

  const createdVendors = await Vendor.insertMany(vendors);
  console.log(`✅ Created ${createdVendors.length} vendors`);
  return createdVendors;
}

async function seedMasterProducts(categories: ICategory[]) {
  console.log('Seeding master products...');

  const smartphoneCategory = categories.find((c) => c.slug === 'smartphones');
  const laptopCategory = categories.find((c) => c.slug === 'laptops');

  if (!smartphoneCategory || !laptopCategory) {
    console.error('❌ Required categories not found');
    return [];
  }

  const masterProducts = [
    {
      name: 'iPhone 15 Pro Max 256GB',
      slug: 'iphone-15-pro-max-256gb',
      description: 'Apple iPhone 15 Pro Max with A17 Pro chip, 256GB storage',
      brand: 'Apple',
      modelNumber: 'A3105',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=iPhone+15+Pro+Max'],
      specifications: new Map([
        ['Display', '6.7" Super Retina XDR OLED'],
        ['Processor', 'A17 Pro'],
        ['RAM', '8GB'],
        ['Storage', '256GB'],
        ['Camera', '48MP + 12MP + 12MP'],
        ['Battery', '4422 mAh'],
        ['OS', 'iOS 17'],
      ]),
      features: ['5G', 'Face ID', 'USB-C', 'Action Button', 'Titanium Design'],
      tags: ['iphone', 'apple', 'smartphone', '5g', 'flagship'],
      vendorCount: 0,
      totalViews: 0,
      avgRating: 0,
      totalReviews: 0,
      isActive: true,
    },
    {
      name: 'Samsung Galaxy S24 Ultra 512GB',
      slug: 'samsung-galaxy-s24-ultra-512gb',
      description: 'Samsung Galaxy S24 Ultra with S Pen and Galaxy AI',
      brand: 'Samsung',
      modelNumber: 'SM-S928B',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=Galaxy+S24+Ultra'],
      specifications: new Map([
        ['Display', '6.8" Dynamic AMOLED 2X'],
        ['Processor', 'Snapdragon 8 Gen 3'],
        ['RAM', '12GB'],
        ['Storage', '512GB'],
        ['Camera', '200MP + 50MP + 12MP + 10MP'],
        ['Battery', '5000 mAh'],
        ['OS', 'Android 14, One UI 6.1'],
      ]),
      features: ['S Pen', '5G', 'Galaxy AI', '45W Fast Charging', 'IP68'],
      tags: ['samsung', 'galaxy', 'android', '5g', 'flagship'],
      vendorCount: 0,
      totalViews: 0,
      avgRating: 0,
      totalReviews: 0,
      isActive: true,
    },
    {
      name: 'MacBook Pro 14" M3 Pro',
      slug: 'macbook-pro-14-m3-pro',
      description: 'Apple MacBook Pro 14-inch with M3 Pro chip',
      brand: 'Apple',
      modelNumber: 'MRX33',
      category: laptopCategory._id,
      images: ['https://via.placeholder.com/800x800?text=MacBook+Pro+14'],
      specifications: new Map([
        ['Display', '14.2" Liquid Retina XDR'],
        ['Processor', 'Apple M3 Pro'],
        ['RAM', '18GB Unified'],
        ['Storage', '512GB SSD'],
        ['Graphics', '14-core GPU'],
        ['Battery', 'Up to 17 hours'],
      ]),
      features: ['ProMotion', 'MagSafe 3', 'Thunderbolt 4', 'Touch ID'],
      tags: ['macbook', 'apple', 'laptop', 'professional'],
      vendorCount: 0,
      totalViews: 0,
      avgRating: 0,
      totalReviews: 0,
      isActive: true,
    },
  ];

  const createdMasterProducts = await MasterProduct.insertMany(masterProducts);
  console.log(`✅ Created ${createdMasterProducts.length} master products`);
  return createdMasterProducts;
}

async function seedVendorProducts(
  categories: ICategory[],
  vendors: IVendor[],
  masterProducts: mongoose.Document[]
) {
  console.log('Seeding vendor products...');

  const smartphoneCategory = categories.find((c) => c.slug === 'smartphones');
  const laptopCategory = categories.find((c) => c.slug === 'laptops');
  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'verified');

  if (!smartphoneCategory || !laptopCategory || verifiedVendors.length < 2) {
    console.error('❌ Required categories or vendors not found');
    return [];
  }

  const iphone = masterProducts.find((p) => (p as { slug: string }).slug.includes('iphone'));
  const samsung = masterProducts.find((p) => (p as { slug: string }).slug.includes('samsung'));
  const macbook = masterProducts.find((p) => (p as { slug: string }).slug.includes('macbook'));

  const products = [
    // Vendor 1 (Ali Electronics) products
    {
      vendorId: verifiedVendors[0]._id,
      name: 'iPhone 15 Pro Max 256GB - Natural Titanium',
      slug: 'iphone-15-pro-max-256gb-ali-electronics',
      description: 'Brand new iPhone 15 Pro Max. PTA approved. 1 year warranty.',
      brand: 'Apple',
      productModel: 'iPhone 15 Pro Max',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=iPhone+15+Ali'],
      productType: 'comparative',
      masterProductId: iphone?._id,
      price: 549999,
      originalPrice: 579999,
      currency: 'PKR',
      stock: 15,
      isInStock: true,
      specifications: new Map([
        ['Color', 'Natural Titanium'],
        ['Storage', '256GB'],
        ['Warranty', '1 Year'],
      ]),
      features: ['PTA Approved', 'Sealed Box', 'Official Warranty'],
      tags: ['iphone', 'apple', 'pta-approved'],
      isActive: true,
      currentBid: 20,
      placementTier: 'enhanced',
      dailyBudget: 200,
    },
    {
      vendorId: verifiedVendors[0]._id,
      name: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black',
      slug: 'samsung-s24-ultra-512gb-ali-electronics',
      description: 'Official Samsung Galaxy S24 Ultra with Galaxy AI features.',
      brand: 'Samsung',
      productModel: 'Galaxy S24 Ultra',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=S24+Ultra+Ali'],
      productType: 'comparative',
      masterProductId: samsung?._id,
      price: 479999,
      originalPrice: 499999,
      currency: 'PKR',
      stock: 10,
      isInStock: true,
      specifications: new Map([
        ['Color', 'Titanium Black'],
        ['Storage', '512GB'],
        ['Warranty', '1 Year'],
      ]),
      features: ['Official Warranty', 'Galaxy AI', 'S Pen Included'],
      tags: ['samsung', 'galaxy', 'android'],
      isActive: true,
      currentBid: 15,
      placementTier: 'standard',
    },
    // Vendor 2 (Sara Mobile Hub) products
    {
      vendorId: verifiedVendors[1]._id,
      name: 'iPhone 15 Pro Max 256GB - Blue Titanium',
      slug: 'iphone-15-pro-max-256gb-sara-mobile',
      description: 'Authentic iPhone 15 Pro Max. Authorized Apple dealer.',
      brand: 'Apple',
      productModel: 'iPhone 15 Pro Max',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=iPhone+15+Sara'],
      productType: 'comparative',
      masterProductId: iphone?._id,
      price: 559999,
      originalPrice: 589999,
      currency: 'PKR',
      stock: 8,
      isInStock: true,
      specifications: new Map([
        ['Color', 'Blue Titanium'],
        ['Storage', '256GB'],
        ['Warranty', '1 Year'],
      ]),
      features: ['Authorized Dealer', 'Free Screen Protector', 'Cash on Delivery'],
      tags: ['iphone', 'apple', 'authorized'],
      isActive: true,
      currentBid: 25,
      placementTier: 'premium',
      dailyBudget: 300,
    },
    {
      vendorId: verifiedVendors[1]._id,
      name: 'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
      slug: 'samsung-s24-ultra-512gb-sara-mobile',
      description: 'Samsung flagship with best-in-class camera.',
      brand: 'Samsung',
      productModel: 'Galaxy S24 Ultra',
      category: smartphoneCategory._id,
      images: ['https://via.placeholder.com/800x800?text=S24+Ultra+Sara'],
      productType: 'comparative',
      masterProductId: samsung?._id,
      price: 469999,
      originalPrice: 489999,
      currency: 'PKR',
      stock: 12,
      isInStock: true,
      specifications: new Map([
        ['Color', 'Titanium Gray'],
        ['Storage', '512GB'],
        ['Warranty', '1 Year'],
      ]),
      features: ['Official Warranty', 'Free Case', 'Exchange Available'],
      tags: ['samsung', 'galaxy', 'android'],
      isActive: true,
      currentBid: 18,
      placementTier: 'enhanced',
    },
    {
      vendorId: verifiedVendors[1]._id,
      name: 'MacBook Pro 14" M3 Pro - Space Black',
      slug: 'macbook-pro-14-m3-sara-mobile',
      description: 'Apple MacBook Pro for professionals. Incredible performance.',
      brand: 'Apple',
      productModel: 'MacBook Pro 14"',
      category: laptopCategory._id,
      images: ['https://via.placeholder.com/800x800?text=MacBook+Sara'],
      productType: 'comparative',
      masterProductId: macbook?._id,
      price: 749999,
      originalPrice: 789999,
      currency: 'PKR',
      stock: 5,
      isInStock: true,
      specifications: new Map([
        ['Color', 'Space Black'],
        ['RAM', '18GB'],
        ['Storage', '512GB'],
      ]),
      features: ['Official Warranty', 'Free Sleeve', 'EMI Available'],
      tags: ['macbook', 'apple', 'laptop'],
      isActive: true,
      currentBid: 30,
      placementTier: 'premium',
      dailyBudget: 500,
    },
  ];

  const createdProducts = await Product.insertMany(products);

  // Update vendor product counts
  for (const vendor of verifiedVendors) {
    const vendorProductCount = createdProducts.filter(
      (p) => p.vendorId.toString() === vendor._id.toString()
    ).length;
    await Vendor.updateOne(
      { _id: vendor._id },
      { totalProducts: vendorProductCount, activeProducts: vendorProductCount }
    );
  }

  // Update master product vendor counts
  for (const mp of masterProducts) {
    const count = createdProducts.filter(
      (p) => p.masterProductId?.toString() === mp._id.toString()
    ).length;
    await MasterProduct.updateOne({ _id: mp._id }, { vendorCount: count });
  }

  console.log(`✅ Created ${createdProducts.length} vendor products`);
  return createdProducts;
}

async function seedSampleViews(products: mongoose.Document[], vendors: IVendor[]) {
  console.log('Seeding sample view data...');

  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'verified');
  const views = [];
  const now = new Date();

  // Generate views for the past 7 days
  for (let day = 0; day < 7; day++) {
    const viewDate = new Date(now);
    viewDate.setDate(viewDate.getDate() - day);

    for (const product of products.slice(0, 4)) {
      const vendor = verifiedVendors.find(
        (v) => v._id.toString() === (product as { vendorId: mongoose.Types.ObjectId }).vendorId.toString()
      );
      if (!vendor) continue;

      // Generate 5-15 views per product per day
      const viewCount = Math.floor(Math.random() * 11) + 5;

      for (let i = 0; i < viewCount; i++) {
        const viewTime = new Date(viewDate);
        viewTime.setHours(Math.floor(Math.random() * 24));
        viewTime.setMinutes(Math.floor(Math.random() * 60));

        const duration = Math.floor(Math.random() * 30) + 1;
        const isQualified = duration >= 3;
        const clickedContact = isQualified && Math.random() > 0.7;

        views.push({
          productId: product._id,
          vendorId: vendor._id,
          masterProductId: (product as { masterProductId?: mongoose.Types.ObjectId }).masterProductId,
          sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          viewType: ['direct', 'search', 'comparison', 'category'][Math.floor(Math.random() * 4)],
          deviceType: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          viewDuration: duration,
          isQualifiedView: isQualified,
          clickedContact,
          cpvCharged: isQualified,
          cpvAmount: isQualified ? 0.15 : 0,
          vendorBidAmount: 15,
          isDuplicate: false,
          isBot: false,
          timestamp: viewTime,
        });
      }
    }
  }

  if (views.length > 0) {
    await ProductView.insertMany(views);

    // Update vendor totals
    for (const vendor of verifiedVendors) {
      const vendorViews = views.filter((v) => v.vendorId.toString() === vendor._id.toString());
      const qualifiedViews = vendorViews.filter((v) => v.isQualifiedView).length;
      const clicks = vendorViews.filter((v) => v.clickedContact).length;

      await Vendor.updateOne(
        { _id: vendor._id },
        {
          totalViews: vendorViews.length,
          totalClicks: clicks,
        }
      );
    }
  }

  console.log(`✅ Created ${views.length} sample views`);
  return views;
}

async function seedSampleTransactions(vendors: IVendor[]) {
  console.log('Seeding sample transactions...');

  const verifiedVendors = vendors.filter((v) => v.verificationStatus === 'verified');
  const transactions = [];

  for (const vendor of verifiedVendors) {
    // Credit purchase transaction
    transactions.push({
      vendorId: vendor._id,
      transactionType: 'purchase',
      purchaseDetails: {
        amount: vendor.totalSpent,
        currency: 'PKR',
        creditsAdded: vendor.viewCredits,
        pricePerCredit: vendor.totalSpent / vendor.viewCredits,
        paymentMethod: 'bank_transfer',
        invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      },
      creditBalanceBefore: 0,
      creditBalanceAfter: vendor.viewCredits,
      creditChange: vendor.viewCredits,
      status: 'completed',
      description: `Initial credit purchase: ${vendor.viewCredits} credits`,
    });

    // Bonus credits for featured vendor
    if (vendor.isFeatured) {
      transactions.push({
        vendorId: vendor._id,
        transactionType: 'bonus',
        creditBalanceBefore: vendor.viewCredits - 500,
        creditBalanceAfter: vendor.viewCredits,
        creditChange: 500,
        status: 'completed',
        description: 'Welcome bonus for featured vendor',
      });
    }
  }

  if (transactions.length > 0) {
    await ViewTransaction.insertMany(transactions);
  }

  console.log(`✅ Created ${transactions.length} sample transactions`);
  return transactions;
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Role.deleteMany({}),
      Category.deleteMany({}),
      Retailer.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
      Vendor.deleteMany({}),
      MasterProduct.deleteMany({}),
      ProductView.deleteMany({}),
      ViewTransaction.deleteMany({}),
      VendorMetrics.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Seed data in order (maintaining referential integrity)
    const roles = await seedRoles();
    const categories = await seedCategories();
    const retailers = await seedRetailers();
    const users = await seedUsers(roles);
    const vendors = await seedVendors(users);
    const masterProducts = await seedMasterProducts(categories);
    const products = await seedVendorProducts(
      categories,
      vendors as IVendor[],
      masterProducts
    );
    await seedSampleViews(products, vendors as IVendor[]);
    await seedSampleTransactions(vendors as IVendor[]);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Roles: ${roles.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Retailers: ${retailers.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Vendors: ${vendors.length}`);
    console.log(`   Master Products: ${masterProducts.length}`);
    console.log(`   Vendor Products: ${products.length}`);

    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@whatprice.com / Admin123!');
    console.log('   User: user@whatprice.com / User1234!');
    console.log('   Vendor 1 (Verified): vendor1@whatprice.com / Vendor123!');
    console.log('   Vendor 2 (Verified): vendor2@whatprice.com / Vendor123!');
    console.log('   Vendor 3 (Pending): vendor3@whatprice.com / Vendor123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
