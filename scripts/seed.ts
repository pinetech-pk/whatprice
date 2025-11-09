/**
 * Database Seeding Script
 *
 * This script populates the database with initial data for testing and development.
 * Run: npx tsx scripts/seed.ts
 */

import connectDB from '../src/lib/db/connection';
import { Role, Category, Retailer, User, Product } from '../src/models';
import { PERMISSIONS, DEFAULT_ROLES } from '../src/models/Role';
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
    },
    {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphones',
      isActive: true,
      order: 1,
    },
    {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptop computers and notebooks',
      isActive: true,
      order: 2,
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      isActive: true,
      order: 2,
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      isActive: true,
      order: 3,
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      isActive: true,
      order: 4,
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
      phone: '+1-555-0101',
      address: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Express Shipping', 'In-Store Pickup'],
      paymentMethods: ['Credit Card', 'Debit Card', 'PayPal', 'Apple Pay'],
    },
    {
      name: 'ElectroWorld',
      slug: 'electroworld',
      description: 'Premium electronics at competitive prices',
      website: 'https://electroworld.example.com',
      email: 'support@electroworld.example.com',
      phone: '+1-555-0102',
      address: {
        street: '456 Electronics Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Next Day Delivery'],
      paymentMethods: ['Credit Card', 'Debit Card', 'Google Pay'],
    },
    {
      name: 'BestBuy Store',
      slug: 'bestbuy-store',
      description: 'Best deals on consumer electronics',
      website: 'https://bestbuystore.example.com',
      email: 'info@bestbuystore.example.com',
      phone: '+1-555-0103',
      address: {
        street: '789 Shopping Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
      },
      isActive: true,
      isVerified: true,
      deliveryOptions: ['Standard Shipping', 'Express Shipping', 'Same Day Delivery'],
      paymentMethods: ['Credit Card', 'Debit Card', 'PayPal', 'Cryptocurrency'],
    },
  ];

  const createdRetailers = await Retailer.insertMany(retailers);
  console.log(`✅ Created ${createdRetailers.length} retailers`);
  return createdRetailers;
}

async function seedUsers(roles: any[]) {
  console.log('Seeding users...');

  const adminRole = roles.find((r) => r.slug === DEFAULT_ROLES.ADMIN);
  const userRole = roles.find((r) => r.slug === DEFAULT_ROLES.USER);

  if (!adminRole || !userRole) {
    console.error('❌ Required roles not found');
    return [];
  }

  const users = [
    {
      email: 'admin@whatprice.com',
      password: 'admin123', // In production, this should be hashed
      firstName: 'Admin',
      lastName: 'User',
      role: adminRole._id,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'john.doe@example.com',
      password: 'password123', // In production, this should be hashed
      firstName: 'John',
      lastName: 'Doe',
      role: userRole._id,
      isActive: true,
      isEmailVerified: true,
      phone: '+1-555-0201',
      address: {
        street: '321 User Lane',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA',
      },
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  console.log('⚠️  WARNING: Passwords are stored in plain text. Implement proper hashing before production!');
  return createdUsers;
}

async function seedProducts(categories: any[], retailers: any[]) {
  console.log('Seeding products...');

  const smartphoneCategory = categories.find((c) => c.slug === 'smartphones');
  const laptopCategory = categories.find((c) => c.slug === 'laptops');

  if (!smartphoneCategory || !laptopCategory) {
    console.error('❌ Required categories not found');
    return [];
  }

  const products = [
    {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'Latest flagship iPhone with advanced camera system and A17 Pro chip',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      sku: 'AAPL-IP15PM-256',
      category: smartphoneCategory._id,
      images: [
        'https://via.placeholder.com/800x800?text=iPhone+15+Pro+Max',
      ],
      prices: retailers.slice(0, 3).map((retailer, index) => ({
        retailer: retailer._id,
        price: 1199 - index * 50,
        originalPrice: 1299,
        currency: 'USD',
        isAvailable: true,
        url: `${retailer.website}/iphone-15-pro-max`,
        lastUpdated: new Date(),
      })),
      specifications: new Map([
        ['Display', '6.7" Super Retina XDR'],
        ['Processor', 'A17 Pro'],
        ['RAM', '8GB'],
        ['Storage', '256GB'],
        ['Camera', '48MP Main + 12MP Ultra Wide + 12MP Telephoto'],
        ['Battery', '4422 mAh'],
      ]),
      features: ['5G Support', 'Face ID', 'Water Resistant', 'Wireless Charging'],
      tags: ['smartphone', 'iphone', 'apple', '5g'],
      isActive: true,
    },
    {
      name: 'MacBook Pro 16" M3 Max',
      slug: 'macbook-pro-16-m3-max',
      description: 'Powerful laptop for professionals with M3 Max chip',
      brand: 'Apple',
      model: 'MacBook Pro 16"',
      sku: 'AAPL-MBP16-M3M',
      category: laptopCategory._id,
      images: [
        'https://via.placeholder.com/800x800?text=MacBook+Pro+16',
      ],
      prices: retailers.slice(0, 2).map((retailer, index) => ({
        retailer: retailer._id,
        price: 3499 - index * 100,
        originalPrice: 3699,
        currency: 'USD',
        isAvailable: true,
        url: `${retailer.website}/macbook-pro-16`,
        lastUpdated: new Date(),
      })),
      specifications: new Map([
        ['Display', '16.2" Liquid Retina XDR'],
        ['Processor', 'Apple M3 Max'],
        ['RAM', '36GB Unified Memory'],
        ['Storage', '1TB SSD'],
        ['Graphics', 'Up to 40-core GPU'],
        ['Battery', 'Up to 22 hours'],
      ]),
      features: ['Touch ID', 'MagSafe Charging', 'Thunderbolt 4', 'ProMotion'],
      tags: ['laptop', 'macbook', 'apple', 'professional'],
      isActive: true,
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Premium Android smartphone with S Pen and AI features',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      sku: 'SAMS-S24U-512',
      category: smartphoneCategory._id,
      images: [
        'https://via.placeholder.com/800x800?text=Galaxy+S24+Ultra',
      ],
      prices: retailers.map((retailer, index) => ({
        retailer: retailer._id,
        price: 1299 - index * 40,
        originalPrice: 1399,
        currency: 'USD',
        isAvailable: true,
        url: `${retailer.website}/galaxy-s24-ultra`,
        lastUpdated: new Date(),
      })),
      specifications: new Map([
        ['Display', '6.8" Dynamic AMOLED 2X'],
        ['Processor', 'Snapdragon 8 Gen 3'],
        ['RAM', '12GB'],
        ['Storage', '512GB'],
        ['Camera', '200MP Main + 50MP Telephoto + 12MP Ultra Wide + 10MP Telephoto'],
        ['Battery', '5000 mAh'],
      ]),
      features: ['S Pen', '5G Support', 'IP68 Water Resistant', '45W Fast Charging'],
      tags: ['smartphone', 'samsung', 'galaxy', 'android', '5g'],
      isActive: true,
    },
  ];

  const createdProducts = await Product.insertMany(products);
  console.log(`✅ Created ${createdProducts.length} products`);
  return createdProducts;
}

async function main() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Role.deleteMany({}),
      Category.deleteMany({}),
      Retailer.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
    ]);
    console.log('✅ Existing data cleared\n');

    // Seed data in order (maintaining referential integrity)
    const roles = await seedRoles();
    const categories = await seedCategories();
    const retailers = await seedRetailers();
    const users = await seedUsers(roles);
    const products = await seedProducts(categories, retailers);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Roles: ${roles.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Retailers: ${retailers.length}`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
