import connectDB from '@/lib/db/connection';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import Category from '@/models/Category';

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  brand?: string;
  city?: string;
  sort?: string;
}

export async function getProducts(filters: ProductFilters = {}) {
  try {
    await connectDB();

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sort = filters.sort || 'recommended';

    // Build query for active products from verified vendors
    // Exclude soft-deleted products
    const query: Record<string, unknown> = {
      isActive: true,
      isInStock: true,
      deletedAt: null, // Exclude soft-deleted products
    };

    if (filters.categoryId) {
      query.category = filters.categoryId;
    }

    if (filters.brand) {
      query.brand = { $regex: filters.brand, $options: 'i' };
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { brand: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ];
    }

    if (filters.minPrice || filters.maxPrice) {
      query.price = {};
      if (filters.minPrice) {
        (query.price as Record<string, number>).$gte = Number(filters.minPrice);
      }
      if (filters.maxPrice) {
        (query.price as Record<string, number>).$lte = Number(filters.maxPrice);
      }
    }

    // Get verified vendor IDs (exclude soft-deleted vendors)
    const vendorQuery: Record<string, unknown> = {
      verificationStatus: 'verified',
      isActive: true,
      deletedAt: null, // Exclude soft-deleted vendors
    };

    if (filters.city) {
      vendorQuery['address.city'] = { $regex: filters.city, $options: 'i' };
    }

    const verifiedVendors = await Vendor.find(vendorQuery).select('_id');
    const vendorIds = verifiedVendors.map((v) => v._id);
    query.vendorId = { $in: vendorIds };

    // Build sort options
    let sortOption: Record<string, 1 | -1> = {};

    switch (sort) {
      case 'price_low':
        sortOption = { price: 1 };
        break;
      case 'price_high':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1, reviewCount: -1 };
        break;
      case 'recommended':
      default:
        sortOption = { placementTier: -1, currentBid: -1, rating: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('vendorId', 'storeName slug rating address.city')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select(
          'name slug description brand images price originalPrice currency rating reviewCount viewCount category vendorId placementTier createdAt'
        )
        .lean(),
      Product.countDocuments(query),
    ]);

    // Get unique brands for filters
    const brands = await Product.distinct('brand', {
      ...query,
      brand: { $exists: true, $ne: '' },
    });

    // Get price range for filters
    const priceStats = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    // Convert MongoDB documents to plain objects with proper vendor fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plainProducts = products.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description,
      brand: p.brand,
      images: p.images || [],
      price: p.price,
      originalPrice: p.originalPrice,
      currency: p.currency,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      viewCount: p.viewCount || 0,
      placementTier: p.placementTier,
      createdAt: p.createdAt,
      category: p.category ? {
        name: p.category.name,
        slug: p.category.slug,
        _id: p.category._id.toString(),
      } : null,
      vendorId: p.vendorId ? {
        storeName: p.vendorId.storeName,
        slug: p.vendorId.slug,
        rating: p.vendorId.rating,
        address: p.vendorId.address,
        _id: p.vendorId._id.toString(),
      } : null,
    }));

    return {
      products: plainProducts,
      filters: {
        brands: brands.filter(Boolean).slice(0, 50),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      products: [],
      filters: { brands: [], priceRange: { minPrice: 0, maxPrice: 0 } },
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    await connectDB();

    const product = await Product.findOne({ slug, isActive: true, deletedAt: null })
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName slug description logo rating reviewCount address phone deletedAt')
      .lean();

    if (!product) {
      return null;
    }

    // Check if vendor is not soft-deleted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((product as any).vendorId?.deletedAt) {
      return null; // Product's vendor is deleted
    }

    // Get related products (same category, excluding soft-deleted)
    const relatedProducts = await Product.find({
      category: product.category?._id,
      _id: { $ne: product._id },
      isActive: true,
      isInStock: true,
      deletedAt: null,
    })
      .populate('vendorId', 'storeName slug rating')
      .limit(4)
      .select('name slug images price originalPrice rating reviewCount vendorId')
      .lean();

    // Get more products from the same vendor (excluding soft-deleted)
    const vendorProducts = await Product.find({
      vendorId: product.vendorId?._id,
      _id: { $ne: product._id },
      isActive: true,
      isInStock: true,
      deletedAt: null,
    })
      .populate('vendorId', 'storeName slug rating')
      .limit(4)
      .select('name slug images price originalPrice rating reviewCount vendorId')
      .lean();

    // Convert to plain objects with string IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pAny = product as any;
    const plainProduct = {
      ...product,
      _id: pAny._id.toString(),
      id: pAny._id.toString(),
      category: pAny.category ? {
        name: pAny.category.name,
        slug: pAny.category.slug,
        _id: pAny.category._id.toString(),
      } : null,
      vendor: pAny.vendorId ? {
        storeName: pAny.vendorId.storeName,
        slug: pAny.vendorId.slug,
        description: pAny.vendorId.description,
        logo: pAny.vendorId.logo,
        rating: pAny.vendorId.rating,
        reviewCount: pAny.vendorId.reviewCount,
        address: pAny.vendorId.address,
        phone: pAny.vendorId.phone,
        _id: pAny.vendorId._id.toString(),
        whatsapp: pAny.vendorId.phone,
      } : null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plainRelated = relatedProducts.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      images: p.images || [],
      price: p.price,
      originalPrice: p.originalPrice,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      vendorId: p.vendorId ? {
        storeName: p.vendorId.storeName,
        slug: p.vendorId.slug,
        rating: p.vendorId.rating,
        _id: p.vendorId._id.toString(),
      } : null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plainVendorProducts = vendorProducts.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      images: p.images || [],
      price: p.price,
      originalPrice: p.originalPrice,
      rating: p.rating || 0,
      reviewCount: p.reviewCount || 0,
      vendorId: p.vendorId ? {
        storeName: p.vendorId.storeName,
        slug: p.vendorId.slug,
        rating: p.vendorId.rating,
        _id: p.vendorId._id.toString(),
      } : null,
    }));

    return {
      product: plainProduct,
      relatedProducts: plainRelated,
      vendorProducts: plainVendorProducts,
    };
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

export async function getCategories(format: 'flat' | 'tree' = 'flat') {
  try {
    await connectDB();

    if (format === 'tree') {
      const tree = await Category.getTree();
      // Convert tree IDs to strings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convertIds = (cats: any[]): any[] => cats.map((cat) => ({
        ...cat,
        _id: cat._id?.toString ? cat._id.toString() : cat._id,
        parent: cat.parent?.toString ? cat.parent.toString() : (cat.parent || null),
        children: cat.children ? convertIds(cat.children) : undefined,
      }));
      return convertIds(tree);
    }

    const categories = await Category.find({ isActive: true })
      .select('name slug description icon parent baseViewRate minBidAmount maxBidAmount competitiveness order')
      .sort({ order: 1, name: 1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return categories.map((cat: any) => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      parent: cat.parent?.toString() || null,
      baseViewRate: cat.baseViewRate,
      minBidAmount: cat.minBidAmount,
      maxBidAmount: cat.maxBidAmount,
      competitiveness: cat.competitiveness,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    await connectDB();

    // Get all categories as a tree
    const tree = await Category.getTree();

    // Convert tree IDs to strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convertIds = (cats: any[]): any[] => cats.map((cat) => ({
      ...cat,
      _id: cat._id?.toString ? cat._id.toString() : cat._id,
      parent: cat.parent?.toString ? cat.parent.toString() : (cat.parent || null),
      children: cat.children ? convertIds(cat.children) : undefined,
    }));
    const convertedTree = convertIds(tree);

    // Find category by slug (including in children)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findCategory = (cats: any[], targetSlug: string): any | null => {
      for (const cat of cats) {
        if (cat.slug === targetSlug) return cat;
        if (cat.children) {
          const found = findCategory(cat.children, targetSlug);
          if (found) return found;
        }
      }
      return null;
    };

    const category = findCategory(convertedTree, slug);

    if (!category) {
      return null;
    }

    return category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return null;
  }
}
