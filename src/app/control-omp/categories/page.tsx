'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Plus,
  Search,
  CheckCircle,
  Sparkles,
  Edit2,
  Trash2,
  Layers,
  ChefHat,
  ShoppingBasket,
  Flame,
  Fish,
  Zap,
  HeartPulse,
  Shirt,
  Hammer,
  Smartphone,
  Laptop,
  Car,
  Package,
  RefreshCw,
  AlertCircle,
  Layers3,
} from 'lucide-react';
import {
  getAllCategoriesAdminAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  AdminCategoryRecord,
} from '@/actions/categories';

const AVAILABLE_ICONS = [
  { name: 'Layers', label: 'General / Departments', icon: Layers },
  { name: 'ShoppingBasket', label: 'Farm Produce / Groceries', icon: ShoppingBasket },
  { name: 'ChefHat', label: 'Cooked Meals / Food', icon: ChefHat },
  { name: 'Smartphone', label: 'Phones & Gadgets', icon: Smartphone },
  { name: 'Zap', label: 'Electronics & Solar Power', icon: Zap },
  { name: 'Laptop', label: 'Laptops & Computing', icon: Laptop },
  { name: 'HeartPulse', label: 'Pharmacy & Health', icon: HeartPulse },
  { name: 'Shirt', label: 'Fashion & Wears', icon: Shirt },
  { name: 'Hammer', label: 'Building Materials & Tools', icon: Hammer },
  { name: 'Flame', label: 'Palm Oil & Agro Mills', icon: Flame },
  { name: 'Fish', label: 'Livestock & Fresh Fish', icon: Fish },
  { name: 'Car', label: 'Auto Parts & Transport', icon: Car },
  { name: 'Package', label: 'General Retail', icon: Package },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryRecord | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const data = await getAllCategoriesAdminAction();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories from database:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('Layers');
    setDescription('');
    setDisplayOrder(String(categories.length + 1));
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: AdminCategoryRecord) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || 'Layers');
    setDescription(cat.description || '');
    setDisplayOrder(String(cat.displayOrder || 0));
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (editingCategory) {
        const res = await updateCategoryAction({
          id: editingCategory.id,
          name,
          slug,
          description,
          iconName: icon,
          displayOrder: Number(displayOrder) || 0,
        });

        if (res.success) {
          setFormSuccess(`Department "${name}" updated in database!`);
          await loadCategories();
          setTimeout(() => setShowModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to update department.');
        }
      } else {
        const res = await createCategoryAction({
          name,
          slug,
          description,
          iconName: icon,
          displayOrder: Number(displayOrder) || 0,
        });

        if (res.success) {
          setFormSuccess(`Department "${name}" created in database successfully!`);
          await loadCategories();
          setTimeout(() => setShowModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to create department.');
        }
      }
    } catch (err: any) {
      setFormError('Server error while saving department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete department "${catName}" from the database?`)) {
      return;
    }

    try {
      const res = await deleteCategoryAction(id);
      if (res.success) {
        await loadCategories();
      } else {
        alert(res.error || 'Failed to delete category.');
      }
    } catch (err) {
      alert('Error deleting category.');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIconComponent = (iconName: string) => {
    const matched = AVAILABLE_ICONS.find((i) => i.name.toLowerCase() === iconName.toLowerCase());
    const IconComponent = matched ? matched.icon : Layers;
    return <IconComponent className="w-4 h-4 text-forest-850" />;
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Market Categories & Commercial Departments"
        subtitle="100% database-driven commerce departments for the web catalog and mobile app. Add and manage categories."
        liveStats={{ label: 'Total in DB', value: `${categories.length} Departments` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Actions & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments (e.g. Food, Phones)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadCategories}
              className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh from database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Department</span>
            </button>
          </div>
        </div>

        {/* Categories Database Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Layers3 className="w-4 h-4 text-forest-850" />
              <span>Database Records (`categories` Table)</span>
            </h4>
            <span className="text-xs font-bold text-forest-850 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              {categories.length} Total Departments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Department Name</th>
                  <th className="px-5 py-3.5">Slug</th>
                  <th className="px-5 py-3.5">Products Listed</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                      Loading categories directly from Supabase database...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                      No categories found. Click "Create New Department" to add one!
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-850 font-bold flex items-center justify-center border border-forest-200 shrink-0">
                            {getCategoryIconComponent(cat.icon)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">{cat.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{cat.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                        {cat.slug}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-900 border border-forest-100">
                          {cat.itemCount} active products
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                        {cat.description || <span className="text-slate-300 italic">None</span>}
                      </td>

                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-500">
                        #{cat.displayOrder}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: Create / Edit Category */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-forest-850" />
                <span>{editingCategory ? 'Edit Department in Database' : 'Create New Department in Database'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cooked Meals & Food, Phones & Gadgets"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    URL / App Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cooked-meals-food"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Category Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i.name} value={i.name}>
                      {i.name} — {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Department Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Items and merchants featured under this department in Omoku & Egi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{editingCategory ? 'Update in Database' : 'Save Department to Database'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
