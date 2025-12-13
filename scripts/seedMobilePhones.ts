/**
 * Mobile Phones Seed Script
 *
 * Creates test data for comparative pricing:
 * - 3 Mobile stores (Ansari Mobiles, Asma Electronics, Brands Perfect)
 * - 10 Mobile phones (5 Vivo, 5 Oppo)
 * - Each store sells all 10 products at different prices (500-1000 PKR variation)
 *
 * Run: npx tsx scripts/seedMobilePhones.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import bcrypt from 'bcryptjs';
import connectDB from '../src/lib/db/connection';
import {
  Role,
  Category,
  User,
  Product,
  Vendor,
  MasterProduct,
} from '../src/models';
import mongoose from 'mongoose';

// Mobile phone specifications data (based on current Pakistan market prices Dec 2024)
const mobilePhones = [
  // Vivo Phones (5)
  {
    name: 'Vivo Y200 5G',
    slug: 'vivo-y200-5g',
    brand: 'Vivo',
    modelNumber: 'V2302',
    basePrice: 52500,
    description: 'Vivo Y200 5G with 50MP OIS camera, Snapdragon 4 Gen 1 processor, and 5000mAh battery. Features 44W FlashCharge for rapid charging.',
    specifications: {
      'Display': '6.72" FHD+ AMOLED, 120Hz',
      'Processor': 'Snapdragon 4 Gen 1',
      'RAM': '8GB',
      'Storage': '128GB',
      'Main Camera': '50MP OIS + 2MP',
      'Front Camera': '16MP',
      'Battery': '5000mAh, 44W Fast Charging',
      'OS': 'Android 14, Funtouch OS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', '50MP OIS Camera', 'AMOLED Display', '44W FlashCharge', 'In-display Fingerprint'],
    tags: ['vivo', 'y200', '5g', 'mid-range', 'amoled'],
  },
  {
    name: 'Vivo Y400 5G',
    slug: 'vivo-y400-5g',
    brand: 'Vivo',
    modelNumber: 'V2408',
    basePrice: 64000,
    description: 'Vivo Y400 5G featuring massive 6000mAh battery, 50MP AI camera system, and Dimensity 6300 processor for smooth performance.',
    specifications: {
      'Display': '6.67" FHD+ LCD, 120Hz',
      'Processor': 'Dimensity 6300',
      'RAM': '8GB',
      'Storage': '256GB',
      'Main Camera': '50MP + 2MP Depth',
      'Front Camera': '8MP',
      'Battery': '6000mAh, 44W Fast Charging',
      'OS': 'Android 14, Funtouch OS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', '6000mAh Mega Battery', '44W FlashCharge', 'Side Fingerprint', 'Extended RAM'],
    tags: ['vivo', 'y400', '5g', 'big-battery', 'budget'],
  },
  {
    name: 'Vivo V30e 5G',
    slug: 'vivo-v30e-5g',
    brand: 'Vivo',
    modelNumber: 'V2316',
    basePrice: 96000,
    description: 'Vivo V30e with ZEISS-style portrait photography, 50MP Sony IMX882 sensor, and sleek curved display design.',
    specifications: {
      'Display': '6.78" FHD+ AMOLED, 120Hz Curved',
      'Processor': 'Snapdragon 6 Gen 1',
      'RAM': '8GB',
      'Storage': '256GB',
      'Main Camera': '50MP Sony IMX882 OIS + 8MP Ultra-wide',
      'Front Camera': '50MP AF',
      'Battery': '5500mAh, 80W Fast Charging',
      'OS': 'Android 14, Funtouch OS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'ZEISS Portrait', '80W FlashCharge', 'Curved AMOLED', '50MP Selfie Camera'],
    tags: ['vivo', 'v30e', '5g', 'camera-phone', 'curved-display'],
  },
  {
    name: 'Vivo V30 5G',
    slug: 'vivo-v30-5g',
    brand: 'Vivo',
    modelNumber: 'V2318',
    basePrice: 115000,
    description: 'Vivo V30 5G - Flagship camera experience with ZEISS optics, 50MP Sony sensor, and professional-grade portrait modes.',
    specifications: {
      'Display': '6.78" FHD+ AMOLED, 120Hz',
      'Processor': 'Snapdragon 7 Gen 3',
      'RAM': '12GB',
      'Storage': '256GB',
      'Main Camera': '50MP Sony IMX921 OIS + 50MP Ultra-wide',
      'Front Camera': '50MP AF',
      'Battery': '5000mAh, 80W Fast Charging',
      'OS': 'Android 14, Funtouch OS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'ZEISS Optics', 'Dual 50MP Cameras', '80W FlashCharge', 'IP54 Water Resistant'],
    tags: ['vivo', 'v30', '5g', 'flagship-camera', 'zeiss'],
  },
  {
    name: 'Vivo V40 5G',
    slug: 'vivo-v40-5g',
    brand: 'Vivo',
    modelNumber: 'V2326',
    basePrice: 135000,
    description: 'Vivo V40 5G with ZEISS multifocal portrait system, Dimensity 9200+ flagship processor, and studio-quality lighting effects.',
    specifications: {
      'Display': '6.78" FHD+ AMOLED, 120Hz',
      'Processor': 'Dimensity 9200+',
      'RAM': '12GB',
      'Storage': '256GB',
      'Main Camera': '50MP Sony IMX921 OIS + 50MP Sony IMX816',
      'Front Camera': '50MP AF',
      'Battery': '5500mAh, 80W Fast Charging',
      'OS': 'Android 14, Funtouch OS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'ZEISS Multifocal Portrait', 'Aura Light', '80W FlashCharge', 'AI Eraser'],
    tags: ['vivo', 'v40', '5g', 'premium', 'zeiss-portrait'],
  },

  // Oppo Phones (5)
  {
    name: 'Oppo A3x 5G',
    slug: 'oppo-a3x-5g',
    brand: 'Oppo',
    modelNumber: 'CPH2639',
    basePrice: 33000,
    description: 'Oppo A3x 5G - Entry-level 5G smartphone with large display, AI-powered camera, and long-lasting battery.',
    specifications: {
      'Display': '6.67" HD+ LCD, 90Hz',
      'Processor': 'Dimensity 6300',
      'RAM': '4GB',
      'Storage': '128GB',
      'Main Camera': '8MP + AI Lens',
      'Front Camera': '5MP',
      'Battery': '5100mAh, 45W Fast Charging',
      'OS': 'Android 14, ColorOS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', '45W SUPERVOOC', 'AI Portrait', 'Side Fingerprint', 'Expandable Storage'],
    tags: ['oppo', 'a3x', '5g', 'budget', 'entry-level'],
  },
  {
    name: 'Oppo A5 Pro 5G',
    slug: 'oppo-a5-pro-5g',
    brand: 'Oppo',
    modelNumber: 'CPH2657',
    basePrice: 54000,
    description: 'Oppo A5 Pro 5G with 50MP AI camera, powerful processor, and premium design at an affordable price point.',
    specifications: {
      'Display': '6.67" FHD+ AMOLED, 120Hz',
      'Processor': 'Dimensity 7050',
      'RAM': '8GB',
      'Storage': '256GB',
      'Main Camera': '50MP + 2MP Depth',
      'Front Camera': '16MP',
      'Battery': '5800mAh, 67W Fast Charging',
      'OS': 'Android 14, ColorOS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', '67W SUPERVOOC', 'AMOLED Display', '50MP Camera', 'In-display Fingerprint'],
    tags: ['oppo', 'a5-pro', '5g', 'mid-range', 'value'],
  },
  {
    name: 'Oppo Reno 12F 5G',
    slug: 'oppo-reno-12f-5g',
    brand: 'Oppo',
    modelNumber: 'CPH2607',
    basePrice: 60000,
    description: 'Oppo Reno 12F 5G - Stylish design with AI features, 50MP triple camera system, and fast charging technology.',
    specifications: {
      'Display': '6.67" FHD+ AMOLED, 120Hz',
      'Processor': 'MediaTek Dimensity 6300',
      'RAM': '8GB',
      'Storage': '256GB',
      'Main Camera': '50MP + 8MP Ultra-wide + 2MP Macro',
      'Front Camera': '32MP',
      'Battery': '5000mAh, 45W Fast Charging',
      'OS': 'Android 14, ColorOS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'AI Portrait', 'Triple Camera', '45W SUPERVOOC', 'Slim Design'],
    tags: ['oppo', 'reno', '12f', '5g', 'stylish'],
  },
  {
    name: 'Oppo Reno 12 5G',
    slug: 'oppo-reno-12-5g',
    brand: 'Oppo',
    modelNumber: 'CPH2631',
    basePrice: 100000,
    description: 'Oppo Reno 12 5G with advanced AI features, professional portrait photography, and premium curved display.',
    specifications: {
      'Display': '6.7" FHD+ AMOLED, 120Hz Curved',
      'Processor': 'Dimensity 7300-Energy',
      'RAM': '12GB',
      'Storage': '256GB',
      'Main Camera': '50MP OIS + 8MP Ultra-wide + 2MP Macro',
      'Front Camera': '32MP',
      'Battery': '5000mAh, 80W Fast Charging',
      'OS': 'Android 14, ColorOS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'AI Eraser 2.0', '80W SUPERVOOC', 'Curved Display', 'Portrait Expert'],
    tags: ['oppo', 'reno', '12', '5g', 'premium', 'ai-features'],
  },
  {
    name: 'Oppo Reno 12 Pro 5G',
    slug: 'oppo-reno-12-pro-5g',
    brand: 'Oppo',
    modelNumber: 'CPH2637',
    basePrice: 169000,
    description: 'Oppo Reno 12 Pro 5G - Flagship experience with Dimensity 9200 processor, periscope telephoto camera, and AI capabilities.',
    specifications: {
      'Display': '6.7" FHD+ AMOLED, 120Hz Curved',
      'Processor': 'Dimensity 9200',
      'RAM': '12GB',
      'Storage': '512GB',
      'Main Camera': '50MP OIS + 8MP Ultra-wide + 50MP Periscope Telephoto',
      'Front Camera': '50MP',
      'Battery': '5000mAh, 80W Fast Charging',
      'OS': 'Android 14, ColorOS 14',
      'SIM': 'Dual Nano SIM, 5G',
    },
    features: ['5G Support', 'Periscope Telephoto', 'AI Assistant', '80W SUPERVOOC', 'ProXDR Display'],
    tags: ['oppo', 'reno', '12-pro', '5g', 'flagship', 'periscope'],
  },
];

// Store data
const stores = [
  {
    storeName: 'Ansari Mobiles',
    slug: 'ansari-mobiles',
    description: 'Trusted mobile phone retailer in Lahore since 2010. Authorized dealer for Vivo, Oppo, Samsung, and more. PTA approved phones with warranty.',
    email: 'ansari.mobiles@example.com',
    phone: '03211234567',
    whatsapp: '03211234567',
    address: {
      street: 'Shop 45, Hall Road Mobile Market',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
      country: 'Pakistan',
    },
    rating: 4.6,
    reviewCount: 156,
    priceAdjustment: 0, // Base price
  },
  {
    storeName: 'Asma Electronics',
    slug: 'asma-electronics',
    description: 'Premium electronics store in Karachi. Specializing in smartphones, tablets, and accessories. Best prices with genuine warranty.',
    email: 'asma.electronics@example.com',
    phone: '03332345678',
    whatsapp: '03332345678',
    address: {
      street: 'Plot 22, Saddar Electronics Market',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '74400',
      country: 'Pakistan',
    },
    rating: 4.4,
    reviewCount: 89,
    priceAdjustment: 500, // 500 PKR higher
  },
  {
    storeName: 'Brands Perfect',
    slug: 'brands-perfect',
    description: 'Your one-stop shop for branded mobile phones in Islamabad. Authorized dealer with official warranty. EMI options available.',
    email: 'brands.perfect@example.com',
    phone: '03453456789',
    whatsapp: '03453456789',
    address: {
      street: 'F-10 Markaz, Shop 12',
      city: 'Islamabad',
      state: 'ICT',
      zipCode: '44000',
      country: 'Pakistan',
    },
    rating: 4.7,
    reviewCount: 203,
    priceAdjustment: 1000, // 1000 PKR higher
  },
];

async function getOrCreateSmartphoneCategory(): Promise<mongoose.Types.ObjectId> {
  console.log('Finding/Creating Smartphones category...');

  // Look for existing smartphones category
  let category = await Category.findOne({ slug: 'smartphones' });

  if (category) {
    console.log('✅ Found existing Smartphones category');
    return category._id;
  }

  // Look for Electronics parent category
  let electronicsCategory = await Category.findOne({ slug: 'electronics' });

  if (!electronicsCategory) {
    // Create Electronics category
    electronicsCategory = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      isActive: true,
      order: 1,
      baseViewRate: 15,
      minBidAmount: 10,
      maxBidAmount: 100,
    });
    console.log('✅ Created Electronics category');
  }

  // Create Smartphones as sub-category
  category = await Category.create({
    name: 'Smartphones',
    slug: 'smartphones',
    description: 'Mobile phones and smartphones from top brands',
    parent: electronicsCategory._id,
    isActive: true,
    order: 1,
    baseViewRate: 20,
    minBidAmount: 15,
    maxBidAmount: 150,
    competitiveness: 'high',
  });

  console.log('✅ Created Smartphones category');
  return category._id;
}

async function getVendorRole(): Promise<mongoose.Types.ObjectId> {
  const vendorRole = await Role.findOne({ slug: 'vendor' });
  if (!vendorRole) {
    throw new Error('Vendor role not found. Please run the main seed script first: npx tsx scripts/seed.ts');
  }
  return vendorRole._id;
}

async function createMobileStoreUsers(vendorRoleId: mongoose.Types.ObjectId) {
  console.log('Creating mobile store users...');

  const vendorPassword = await bcrypt.hash('Store123!', 12);

  const users = [];
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const existingUser = await User.findOne({ email: store.email });

    if (existingUser) {
      console.log(`  User ${store.email} already exists, skipping...`);
      users.push(existingUser);
      continue;
    }

    const user = await User.create({
      email: store.email,
      password: vendorPassword,
      firstName: store.storeName.split(' ')[0],
      lastName: 'Store',
      role: vendorRoleId,
      isActive: true,
      isEmailVerified: true,
      phone: store.phone,
    });
    users.push(user);
  }

  console.log(`✅ Created/Found ${users.length} store users`);
  return users;
}

async function createMobileStoreVendors(users: mongoose.Document[]) {
  console.log('Creating mobile store vendors...');

  const vendors = [];
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const user = users[i];

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ userId: user._id });
    if (existingVendor) {
      console.log(`  Vendor ${store.storeName} already exists, skipping...`);
      vendors.push(existingVendor);
      continue;
    }

    const vendor = await Vendor.create({
      userId: user._id,
      storeName: store.storeName,
      slug: store.slug,
      description: store.description,
      email: store.email,
      phone: store.phone,
      whatsapp: store.whatsapp,
      address: store.address,
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      viewCredits: 10000,
      totalCreditsPurchased: 10000,
      graduationTier: 'starter',
      tierStartDate: new Date(),
      rating: store.rating,
      reviewCount: store.reviewCount,
      responseRate: 95,
      defaultBidAmount: 15,
      maxDailyBudget: 1000,
      isActive: true,
      isFeatured: i === 0, // First store is featured
    });
    vendors.push(vendor);
  }

  console.log(`✅ Created/Found ${vendors.length} vendors`);
  return vendors;
}

async function createMasterProducts(categoryId: mongoose.Types.ObjectId) {
  console.log('Creating master products...');

  const masterProducts = [];
  for (const phone of mobilePhones) {
    // Check if master product exists
    const existing = await MasterProduct.findOne({ slug: phone.slug });
    if (existing) {
      console.log(`  MasterProduct ${phone.name} already exists, skipping...`);
      masterProducts.push(existing);
      continue;
    }

    const masterProduct = await MasterProduct.create({
      name: phone.name,
      slug: phone.slug,
      description: phone.description,
      brand: phone.brand,
      modelNumber: phone.modelNumber,
      category: categoryId,
      images: [], // User will add images
      specifications: new Map(Object.entries(phone.specifications)),
      features: phone.features,
      tags: phone.tags,
      vendorCount: 3, // Will be sold by all 3 vendors
      isActive: true,
    });
    masterProducts.push(masterProduct);
  }

  console.log(`✅ Created/Found ${masterProducts.length} master products`);
  return masterProducts;
}

async function createVendorProducts(
  categoryId: mongoose.Types.ObjectId,
  vendors: mongoose.Document[],
  masterProducts: mongoose.Document[]
) {
  console.log('Creating vendor product listings...');

  const products = [];

  for (let vendorIndex = 0; vendorIndex < vendors.length; vendorIndex++) {
    const vendor = vendors[vendorIndex];
    const store = stores[vendorIndex];

    for (let productIndex = 0; productIndex < mobilePhones.length; productIndex++) {
      const phone = mobilePhones[productIndex];
      const masterProduct = masterProducts[productIndex];

      // Create unique slug for this vendor's listing
      const productSlug = `${phone.slug}-${store.slug}`;

      // Check if product exists
      const existing = await Product.findOne({ slug: productSlug });
      if (existing) {
        console.log(`  Product ${productSlug} already exists, skipping...`);
        products.push(existing);
        continue;
      }

      // Calculate price with variation (500-1000 PKR difference between stores)
      const priceVariation = store.priceAdjustment + Math.floor(Math.random() * 500);
      const price = phone.basePrice + priceVariation;
      const originalPrice = price + Math.floor(Math.random() * 3000) + 2000; // 2000-5000 more as "original"

      const product = await Product.create({
        vendorId: vendor._id,
        name: phone.name,
        slug: productSlug,
        description: `${phone.description} Available at ${store.storeName} with official warranty and after-sales support.`,
        brand: phone.brand,
        productModel: phone.modelNumber,
        category: categoryId,
        images: [], // User will add images
        productType: 'comparative',
        masterProductId: masterProduct._id,
        price,
        originalPrice,
        currency: 'PKR',
        stock: Math.floor(Math.random() * 20) + 5, // 5-25 units
        isInStock: true,
        specifications: new Map(Object.entries({
          ...phone.specifications,
          'Warranty': '1 Year Official',
          'PTA Status': 'Approved',
        })),
        features: [...phone.features, 'PTA Approved', 'Official Warranty', `Available at ${store.storeName}`],
        tags: [...phone.tags, store.slug, store.address.city.toLowerCase()],
        isActive: true,
        currentBid: 15 + (vendorIndex * 5), // Different bid amounts
        placementTier: vendorIndex === 0 ? 'premium' : vendorIndex === 1 ? 'enhanced' : 'standard',
        dailyBudget: 200 + (vendorIndex * 100),
        rating: 4.0 + (Math.random() * 0.8),
        reviewCount: Math.floor(Math.random() * 50) + 10,
      });
      products.push(product);
    }
  }

  // Update vendor product counts
  for (const vendor of vendors) {
    const count = products.filter(p => p.vendorId.toString() === vendor._id.toString()).length;
    await Vendor.updateOne(
      { _id: vendor._id },
      { totalProducts: count, activeProducts: count }
    );
  }

  // Update master product price aggregates
  for (let i = 0; i < masterProducts.length; i++) {
    const mp = masterProducts[i];
    const vendorProducts = products.filter(
      p => p.masterProductId?.toString() === mp._id.toString()
    );
    const prices = vendorProducts.map(p => p.price);

    if (prices.length > 0) {
      await MasterProduct.updateOne(
        { _id: mp._id },
        {
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          vendorCount: prices.length,
          priceLastUpdated: new Date(),
        }
      );
    }
  }

  console.log(`✅ Created/Found ${products.length} vendor product listings`);
  return products;
}

async function main() {
  try {
    console.log('🌱 Starting Mobile Phones Seed Script...\n');

    // Connect to database
    await connectDB();

    // Get or create smartphone category
    const categoryId = await getOrCreateSmartphoneCategory();

    // Get vendor role
    const vendorRoleId = await getVendorRole();

    // Create store users
    const users = await createMobileStoreUsers(vendorRoleId);

    // Create vendors
    const vendors = await createMobileStoreVendors(users);

    // Create master products
    const masterProducts = await createMasterProducts(categoryId);

    // Create vendor product listings
    const products = await createVendorProducts(categoryId, vendors, masterProducts);

    console.log('\n✨ Mobile Phones Seed Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Stores Created: ${vendors.length}`);
    console.log(`   Master Products: ${masterProducts.length}`);
    console.log(`   Product Listings: ${products.length}`);

    console.log('\n🏪 Store Credentials (password for all: Store123!):');
    stores.forEach(store => {
      console.log(`   ${store.storeName}: ${store.email}`);
    });

    console.log('\n📱 Mobile Phones Added:');
    console.log('   Vivo: Y200, Y400, V30e, V30, V40');
    console.log('   Oppo: A3x, A5 Pro, Reno 12F, Reno 12, Reno 12 Pro');

    console.log('\n💰 Price Variations:');
    console.log('   Ansari Mobiles: Base price');
    console.log('   Asma Electronics: +500-1000 PKR');
    console.log('   Brands Perfect: +1000-1500 PKR');

    console.log('\n📸 Note: Images are empty. You can add them manually via the vendor portal.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in mobile phones seed:', error);
    process.exit(1);
  }
}

// Run the seeder
main();
