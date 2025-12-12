'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import type { Category } from '@/lib/api/types';

interface CategorySelectorProps {
  value: string; // Selected category ID
  onChange: (categoryId: string, category: Category | null) => void;
  disabled?: boolean;
  error?: string;
}

interface CategoryLevel {
  categories: Category[];
  selected: Category | null;
  loading: boolean;
}

export function CategorySelector({
  value,
  onChange,
  disabled = false,
  error,
}: CategorySelectorProps) {
  // State for each level of categories
  const [level1, setLevel1] = useState<CategoryLevel>({
    categories: [],
    selected: null,
    loading: true,
  });
  const [level2, setLevel2] = useState<CategoryLevel>({
    categories: [],
    selected: null,
    loading: false,
  });
  const [level3, setLevel3] = useState<CategoryLevel>({
    categories: [],
    selected: null,
    loading: false,
  });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [initLoading, setInitLoading] = useState(true);

  // Fetch all categories on mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      setInitLoading(true);
      const response = await api.get<{ categories: Category[] }>('/categories');
      if (response.ok && response.data) {
        const cats = response.data.categories;
        setAllCategories(cats);

        // Set level 1 categories (no parent)
        const rootCats = cats.filter((c) => !c.parent);
        setLevel1({
          categories: rootCats,
          selected: null,
          loading: false,
        });

        // If there's an initial value, populate the hierarchy
        if (value) {
          initializeFromValue(cats, value);
        }
      }
      setInitLoading(false);
    };
    fetchAllCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize category selection from existing value
  const initializeFromValue = useCallback(
    (cats: Category[], categoryId: string) => {
      const selectedCat = cats.find((c) => c._id === categoryId);
      if (!selectedCat) return;

      // Build path from selected to root
      const path: Category[] = [];
      let current: Category | undefined = selectedCat;

      while (current) {
        path.unshift(current);
        current = current.parent
          ? cats.find((c) => c._id === current!.parent)
          : undefined;
      }

      // Set selections based on path length
      const rootCats = cats.filter((c) => !c.parent);

      if (path.length >= 1) {
        const l1Selected = path[0];
        const l2Cats = cats.filter((c) => c.parent === l1Selected._id);
        setLevel1({
          categories: rootCats,
          selected: l1Selected,
          loading: false,
        });
        setLevel2({
          categories: l2Cats,
          selected: path.length >= 2 ? path[1] : null,
          loading: false,
        });

        if (path.length >= 2) {
          const l2Selected = path[1];
          const l3Cats = cats.filter((c) => c.parent === l2Selected._id);
          setLevel3({
            categories: l3Cats,
            selected: path.length >= 3 ? path[2] : null,
            loading: false,
          });
        }
      }
    },
    []
  );

  // Handle level 1 selection change
  const handleLevel1Change = (categoryId: string) => {
    const selected = level1.categories.find((c) => c._id === categoryId) || null;
    setLevel1((prev) => ({ ...prev, selected }));

    // Clear lower levels
    setLevel3({ categories: [], selected: null, loading: false });

    if (selected) {
      // Load level 2 categories
      const children = allCategories.filter((c) => c.parent === categoryId);
      setLevel2({ categories: children, selected: null, loading: false });

      // If no children, select this category
      if (children.length === 0) {
        onChange(categoryId, selected);
      } else {
        onChange('', null); // Clear selection until deepest level selected
      }
    } else {
      setLevel2({ categories: [], selected: null, loading: false });
      onChange('', null);
    }
  };

  // Handle level 2 selection change
  const handleLevel2Change = (categoryId: string) => {
    const selected = level2.categories.find((c) => c._id === categoryId) || null;
    setLevel2((prev) => ({ ...prev, selected }));

    // Clear level 3
    if (selected) {
      // Load level 3 categories
      const children = allCategories.filter((c) => c.parent === categoryId);
      setLevel3({ categories: children, selected: null, loading: false });

      // If no children, select this category
      if (children.length === 0) {
        onChange(categoryId, selected);
      } else {
        onChange('', null);
      }
    } else {
      setLevel3({ categories: [], selected: null, loading: false });
      // Fall back to level 1 selection if available
      if (level1.selected) {
        const l2Children = allCategories.filter(
          (c) => c.parent === level1.selected!._id
        );
        if (l2Children.length === 0) {
          onChange(level1.selected._id, level1.selected);
        } else {
          onChange('', null);
        }
      }
    }
  };

  // Handle level 3 selection change
  const handleLevel3Change = (categoryId: string) => {
    const selected = level3.categories.find((c) => c._id === categoryId) || null;
    setLevel3((prev) => ({ ...prev, selected }));

    if (selected) {
      onChange(categoryId, selected);
    } else {
      // Fall back to level 2 selection
      if (level2.selected) {
        const l3Children = allCategories.filter(
          (c) => c.parent === level2.selected!._id
        );
        if (l3Children.length === 0) {
          onChange(level2.selected._id, level2.selected);
        } else {
          onChange('', null);
        }
      }
    }
  };

  // Get the full category path string
  const getCategoryPath = () => {
    const parts: string[] = [];
    if (level1.selected) parts.push(level1.selected.name);
    if (level2.selected) parts.push(level2.selected.name);
    if (level3.selected) parts.push(level3.selected.name);
    return parts.join(' → ');
  };

  // Get the selected category's CPV info
  const getSelectedCategoryInfo = () => {
    const selected = level3.selected || level2.selected || level1.selected;
    if (!selected) return null;

    return {
      baseViewRate: selected.baseViewRate,
      minBidAmount: selected.minBidAmount,
      maxBidAmount: selected.maxBidAmount,
      competitiveness: selected.competitiveness,
    };
  };

  const selectedInfo = getSelectedCategoryInfo();

  if (initLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Level 1: Main Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={level1.selected?._id || ''}
          onChange={(e) => handleLevel1Change(e.target.value)}
          disabled={disabled || level1.loading}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
            error ? 'border-red-300' : 'border-gray-200'
          }`}
        >
          <option value="">Select a category</option>
          {level1.categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Level 2: Sub Category */}
      {level2.categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-category
          </label>
          <select
            value={level2.selected?._id || ''}
            onChange={(e) => handleLevel2Change(e.target.value)}
            disabled={disabled || level2.loading}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select a sub-category</option>
            {level2.categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Level 3: Product Type */}
      {level3.categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Type
          </label>
          <select
            value={level3.selected?._id || ''}
            onChange={(e) => handleLevel3Change(e.target.value)}
            disabled={disabled || level3.loading}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select a product type</option>
            {level3.categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selected Category Path */}
      {value && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">{getCategoryPath()}</span>
        </div>
      )}

      {/* Category CPV Info */}
      {selectedInfo && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Category Pricing Info
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Base Rate:</span>
              <span className="ml-2 font-medium">
                PKR {selectedInfo.baseViewRate}/100 views
              </span>
            </div>
            <div>
              <span className="text-gray-500">Bid Range:</span>
              <span className="ml-2 font-medium">
                PKR {selectedInfo.minBidAmount} - {selectedInfo.maxBidAmount}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Competition:</span>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedInfo.competitiveness === 'high'
                    ? 'bg-red-100 text-red-700'
                    : selectedInfo.competitiveness === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {selectedInfo.competitiveness.charAt(0).toUpperCase() +
                  selectedInfo.competitiveness.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
