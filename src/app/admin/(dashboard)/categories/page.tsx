'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  AlertTriangle,
  Package,
  TrendingUp,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parent: string | null;
  baseViewRate: number;
  minBidAmount: number;
  maxBidAmount: number;
  competitiveness: 'low' | 'medium' | 'high';
  isActive: boolean;
  productCount: number;
}

interface CategoryStats {
  total: number;
  active: number;
  withProducts: number;
  rootCategories: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  parent: string;
  icon: string;
  order: number;
  baseViewRate: number;
  minBidAmount: number;
  maxBidAmount: number;
  competitiveness: 'low' | 'medium' | 'high';
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  parent: '',
  icon: '',
  order: 0,
  baseViewRate: 10,
  minBidAmount: 10,
  maxBidAmount: 100,
  competitiveness: 'low',
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories?includeInactive=true');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCategories(data.categories);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build tree structure
  const buildTree = () => {
    const map = new Map<string, Category & { children: Category[] }>();
    const roots: (Category & { children: Category[] })[] = [];

    // First pass: create nodes with empty children
    categories.forEach((cat) => {
      map.set(cat._id, { ...cat, children: [] });
    });

    // Second pass: assign children
    categories.forEach((cat) => {
      const node = map.get(cat._id)!;
      if (cat.parent && map.has(cat.parent)) {
        map.get(cat.parent)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent: category.parent || '',
      icon: category.icon || '',
      order: 0,
      baseViewRate: category.baseViewRate,
      minBidAmount: category.minBidAmount,
      maxBidAmount: category.maxBidAmount,
      competitiveness: category.competitiveness,
    });
    setShowModal(true);
  };

  const handleCreate = (parentId?: string) => {
    setEditingCategory(null);
    setFormData({
      ...initialFormData,
      parent: parentId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : '/api/admin/categories';

      const res = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      setShowModal(false);
      setEditingCategory(null);
      setFormData(initialFormData);
      fetchCategories();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      fetchCategories();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/categories/${deletingCategory._id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Delete failed');
      }

      setShowDeleteModal(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getCompetitivenessColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCategories = searchTerm
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  const tree = buildTree();

  const renderCategory = (category: Category & { children: Category[] }, level = 0) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedCategories.has(category._id);

    return (
      <div key={category._id}>
        <div
          className={`flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 ${
            !category.isActive ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpand(category._id)}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${
              !hasChildren ? 'invisible' : ''
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {/* Icon */}
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-blue-600" />
          </div>

          {/* Name & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {!category.isActive && (
                <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                  Inactive
                </span>
              )}
              {category.productCount > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {category.productCount}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{category.slug}</p>
          </div>

          {/* CPV Rate */}
          <div className="hidden sm:block text-sm text-gray-600">
            <span className="font-medium">PKR {category.baseViewRate}</span>
            <span className="text-xs text-gray-400">/100 views</span>
          </div>

          {/* Competitiveness */}
          <span
            className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getCompetitivenessColor(
              category.competitiveness
            )}`}
          >
            {category.competitiveness}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCreate(category._id)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Add subcategory"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleEdit(category)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggle(category)}
              className={`p-2 rounded-lg transition-colors ${
                category.isActive
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={category.isActive ? 'Deactivate' : 'Activate'}
            >
              {category.isActive ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                setDeletingCategory(category);
                setShowDeleteModal(true);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{category.children.map((child) => renderCategory(child as Category & { children: Category[] }, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-500 mt-1">Manage product categories and CPV rates</p>
        </div>
        <button
          onClick={() => handleCreate()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Categories</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.rootCategories}</p>
            <p className="text-sm text-gray-500">Root Categories</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-purple-600">{stats.withProducts}</p>
            <p className="text-sm text-gray-500">With Products</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Tree */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading categories...</p>
          </div>
        ) : filteredCategories ? (
          // Search results (flat list)
          filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No categories found</div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100"
              >
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FolderTree className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{cat.name}</span>
                  <p className="text-xs text-gray-500">{cat.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )
        ) : tree.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No categories yet. Click &quot;Add Category&quot; to create one.
          </div>
        ) : (
          tree.map((cat) => renderCategory(cat))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData(initialFormData);
                    setFormError('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Smartphones"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Root Category)</option>
                  {categories
                    .filter((c) => c._id !== editingCategory?._id)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  CPV Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Base Rate (PKR/100 views)
                    </label>
                    <input
                      type="number"
                      value={formData.baseViewRate}
                      onChange={(e) =>
                        setFormData({ ...formData, baseViewRate: parseInt(e.target.value) || 10 })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Competitiveness</label>
                    <select
                      value={formData.competitiveness}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          competitiveness: e.target.value as 'low' | 'medium' | 'high',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min Bid (PKR)</label>
                    <input
                      type="number"
                      value={formData.minBidAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minBidAmount: parseInt(e.target.value) || 10 })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Bid (PKR)</label>
                    <input
                      type="number"
                      value={formData.maxBidAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxBidAmount: parseInt(e.target.value) || 100 })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCategory(null);
                    setFormData(initialFormData);
                    setFormError('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingCategory.name}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingCategory(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
