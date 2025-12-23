import mongoose from 'mongoose';
import MasterProduct from '@/models/MasterProduct';

export interface DuplicateCandidate {
  masterProductId: mongoose.Types.ObjectId;
  matchScore: number;
  matchReasons: string[];
  product: {
    name: string;
    brand: string;
    modelNumber: string | undefined;
    slug: string;
    vendorCount: number;
    minPrice: number;
    maxPrice: number;
  };
}

export interface DuplicateDetectionResult {
  hasPossibleDuplicates: boolean;
  highestScore: number;
  candidates: DuplicateCandidate[];
}

/**
 * Normalize a string for comparison
 * - Lowercase
 * - Remove extra spaces
 * - Remove common suffixes/prefixes
 * - Normalize common variations
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove common noise words
    .replace(/\b(the|a|an|for|with|and|or)\b/gi, '')
    // Normalize common variations
    .replace(/\bgb\b/gi, 'gb')
    .replace(/\btb\b/gi, 'tb')
    .replace(/\bmb\b/gi, 'mb')
    .replace(/\bram\b/gi, 'ram')
    .replace(/\brom\b/gi, 'rom')
    // Remove special characters except alphanumeric and spaces
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Extract key tokens from a product name
 */
function extractTokens(str: string): Set<string> {
  const normalized = normalizeString(str);
  const tokens = normalized.split(/\s+/).filter(t => t.length > 1);
  return new Set(tokens);
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1)
 * Based on Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  return 1 - (distance / maxLength);
}

/**
 * Extract numeric values from a string (for specs like storage, RAM)
 */
function extractNumericSpecs(str: string): Map<string, number> {
  const specs = new Map<string, number>();

  // Match patterns like "128GB", "8GB RAM", "256 GB"
  const patterns = [
    { regex: /(\d+)\s*gb/gi, key: 'storage_gb' },
    { regex: /(\d+)\s*tb/gi, key: 'storage_tb' },
    { regex: /(\d+)\s*gb\s*ram/gi, key: 'ram_gb' },
    { regex: /(\d+)\s*mp/gi, key: 'camera_mp' },
    { regex: /(\d+)\s*mah/gi, key: 'battery_mah' },
    { regex: /(\d+\.?\d*)\s*inch/gi, key: 'screen_inch' },
  ];

  for (const { regex, key } of patterns) {
    const match = str.match(regex);
    if (match) {
      const value = parseInt(match[0].replace(/[^\d.]/g, ''));
      if (!isNaN(value)) {
        specs.set(key, value);
      }
    }
  }

  return specs;
}

/**
 * Main duplicate detection function
 */
export async function detectDuplicates(
  productData: {
    name: string;
    brand: string;
    modelNumber?: string;
    categoryId: mongoose.Types.ObjectId | string;
  },
  options: {
    threshold?: number;
    maxResults?: number;
  } = {}
): Promise<DuplicateDetectionResult> {
  const threshold = options.threshold || 50; // Minimum score to be considered a duplicate
  const maxResults = options.maxResults || 10;

  // Find candidate MasterProducts in the same category or with matching brand
  const candidates = await MasterProduct.find({
    isActive: true,
    $or: [
      { category: productData.categoryId },
      { brand: { $regex: new RegExp(`^${productData.brand}$`, 'i') } },
    ],
  }).select('name brand modelNumber slug vendorCount minPrice maxPrice category');

  const results: DuplicateCandidate[] = [];

  for (const candidate of candidates) {
    let score = 0;
    const matchReasons: string[] = [];

    // 1. Brand match (25 points max)
    const brandSimilarity = stringSimilarity(productData.brand, candidate.brand || '');
    if (brandSimilarity === 1) {
      score += 25;
      matchReasons.push('Exact brand match');
    } else if (brandSimilarity > 0.8) {
      score += Math.round(brandSimilarity * 20);
      matchReasons.push('Similar brand name');
    }

    // 2. Model number match (35 points max)
    if (productData.modelNumber && candidate.modelNumber) {
      const modelSimilarity = stringSimilarity(productData.modelNumber, candidate.modelNumber);
      if (modelSimilarity === 1) {
        score += 35;
        matchReasons.push('Exact model number match');
      } else if (modelSimilarity > 0.7) {
        score += Math.round(modelSimilarity * 30);
        matchReasons.push('Similar model number');
      }
    }

    // 3. Name similarity (25 points max)
    const nameSimilarity = stringSimilarity(productData.name, candidate.name);
    if (nameSimilarity === 1) {
      score += 25;
      matchReasons.push('Exact name match');
    } else if (nameSimilarity > 0.6) {
      score += Math.round(nameSimilarity * 20);
      matchReasons.push('Similar product name');
    }

    // 4. Token overlap (15 points max)
    const inputTokens = extractTokens(productData.name);
    const candidateTokens = extractTokens(candidate.name);
    const tokenSimilarity = jaccardSimilarity(inputTokens, candidateTokens);
    if (tokenSimilarity > 0.5) {
      score += Math.round(tokenSimilarity * 15);
      matchReasons.push('Matching keywords');
    }

    // 5. Spec matching - bonus for same specs in name
    const inputSpecs = extractNumericSpecs(productData.name);
    const candidateSpecs = extractNumericSpecs(candidate.name);

    let specMatches = 0;
    for (const [key, value] of inputSpecs) {
      if (candidateSpecs.get(key) === value) {
        specMatches++;
      }
    }

    if (specMatches > 0 && inputSpecs.size > 0) {
      const specBonus = Math.min(10, specMatches * 5);
      score += specBonus;
      matchReasons.push(`${specMatches} matching specifications`);
    }

    // Only include if above threshold
    if (score >= threshold) {
      results.push({
        masterProductId: candidate._id,
        matchScore: Math.min(100, score), // Cap at 100
        matchReasons,
        product: {
          name: candidate.name,
          brand: candidate.brand || '',
          modelNumber: candidate.modelNumber,
          slug: candidate.slug,
          vendorCount: candidate.vendorCount || 0,
          minPrice: candidate.minPrice || 0,
          maxPrice: candidate.maxPrice || 0,
        },
      });
    }
  }

  // Sort by score descending and limit results
  results.sort((a, b) => b.matchScore - a.matchScore);
  const topResults = results.slice(0, maxResults);

  return {
    hasPossibleDuplicates: topResults.length > 0,
    highestScore: topResults.length > 0 ? topResults[0].matchScore : 0,
    candidates: topResults,
  };
}

/**
 * Quick check if exact duplicate exists
 */
export async function checkExactDuplicate(
  brand: string,
  modelNumber: string,
  categoryId: mongoose.Types.ObjectId | string
): Promise<{ exists: boolean; masterProduct?: typeof MasterProduct.prototype }> {
  if (!modelNumber) {
    return { exists: false };
  }

  const normalizedBrand = normalizeString(brand);
  const normalizedModel = normalizeString(modelNumber);

  const existing = await MasterProduct.findOne({
    category: categoryId,
    isActive: true,
    $expr: {
      $and: [
        { $eq: [{ $toLower: '$brand' }, normalizedBrand] },
        { $eq: [{ $toLower: '$modelNumber' }, normalizedModel] },
      ],
    },
  });

  return {
    exists: !!existing,
    masterProduct: existing || undefined,
  };
}

/**
 * Search MasterProducts for vendor product linking
 */
export async function searchMasterProducts(
  query: {
    search?: string;
    categoryId?: mongoose.Types.ObjectId | string;
    brand?: string;
  },
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  products: typeof MasterProduct.prototype[];
  total: number;
  pages: number;
}> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  const searchQuery: Record<string, unknown> = {
    isActive: true,
  };

  if (query.categoryId) {
    searchQuery.category = query.categoryId;
  }

  if (query.brand) {
    searchQuery.brand = { $regex: new RegExp(query.brand, 'i') };
  }

  if (query.search) {
    searchQuery.$or = [
      { name: { $regex: new RegExp(query.search, 'i') } },
      { brand: { $regex: new RegExp(query.search, 'i') } },
      { modelNumber: { $regex: new RegExp(query.search, 'i') } },
    ];
  }

  const [products, total] = await Promise.all([
    MasterProduct.find(searchQuery)
      .populate('category', 'name slug')
      .select('name brand modelNumber slug images vendorCount minPrice maxPrice avgPrice')
      .sort({ vendorCount: -1, name: 1 })
      .skip(skip)
      .limit(limit),
    MasterProduct.countDocuments(searchQuery),
  ]);

  return {
    products,
    total,
    pages: Math.ceil(total / limit),
  };
}
