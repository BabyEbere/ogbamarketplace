'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Tag,
  Plus,
  Search,
  Upload,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  Cloud,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { Brand, Category } from '@/types/marketplace';
import { 
  getAllBrandsAction, 
  createBrandAction, 
  updateBrandAction, 
  deleteBrandAction 
} from '@/actions/brands';
import { getCategories } from '@/actions/categories';
import { optimizeBrandLogo, formatBytes, OptimizedImageResult } from '@/lib/image-optimizer';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Image Optimization & Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedImageResult | null>(null);
  const [uploadingToR2, setUploadingToR2] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [brandsData, catsData] = await Promise.all([
        getAllBrandsAction(),
        getCategories(),
      ]);
      setBrands(brandsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Error loading brands data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setWebsiteUrl('');
    setDescription('');
    setSelectedCategoryIds([]);
    setLogoUrl('');
    setIsActive(true);
    setOptimizedResult(null);
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setWebsiteUrl(brand.websiteUrl || '');
    setDescription(brand.description || '');
    setSelectedCategoryIds(brand.categoryIds || []);
    setLogoUrl(brand.logoUrl || '');
    setIsActive(brand.isActive);
    setOptimizedResult(null);
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingBrand) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle Logo file selection with Canvas WebP compression
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOptimizing(true);
    setFormError(null);

    try {
      const result = await optimizeBrandLogo(file, 400, 0.82);
      setOptimizedResult(result);

      // Automatically upload optimized WebP image to Cloudflare R2
      setUploadingToR2(true);
      const formData = new FormData();
      formData.append('file', result.file);
      formData.append('folder', 'brands');

      const response = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        setLogoUrl(data.url);
      } else {
        // If Cloudflare R2 is not configured yet, use preview URL or prompt
        const errorMsg = data.message || data.error || 'Failed to upload to Cloudflare R2.';
        setFormError(`${errorMsg} You can configure credentials in Settings -> Cloudflare R2 Storage.`);
        // Fallback to data URL or preview for now
        setLogoUrl(result.previewUrl);
      }
    } catch (err: any) {
      setFormError(err.message || 'Error optimizing logo image.');
    } finally {
      setOptimizing(false);
      setUploadingToR2(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (editingBrand) {
        const res = await updateBrandAction({
          id: editingBrand.id,
          name,
          slug,
          logoUrl,
          websiteUrl,
          description,
          categoryIds: selectedCategoryIds,
          isActive,
        });

        if (res.success) {
          setFormSuccess('Brand updated successfully!');
          await loadData();
          setTimeout(() => setShowModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to update brand.');
        }
      } else {
        const res = await createBrandAction({
          name,
          slug,
          logoUrl,
          websiteUrl,
          description,
          categoryIds: selectedCategoryIds,
          isActive,
        });

        if (res.success) {
          setFormSuccess('Brand created and associated successfully!');
          await loadData();
          setTimeout(() => setShowModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to create brand.');
        }
      }
    } catch (err: any) {
      setFormError('Server error while saving brand.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, brandName: string) => {
    if (!confirm(`Are you sure you want to delete brand "${brandName}"? This will remove its category associations.`)) {
      return;
    }

    try {
      const res = await deleteBrandAction(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || 'Failed to delete brand.');
      }
    } catch (err) {
      alert('Error deleting brand.');
    }
  };

  // Filter Brands
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedFilterCategory === 'all' ||
      (b.categoryIds && b.categoryIds.includes(selectedFilterCategory)) ||
      (b.categories && b.categories.some((c) => c.slug === selectedFilterCategory || c.id === selectedFilterCategory));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Commercial Brands & Category Association"
        subtitle="Manage brands, associate each brand with multiple departments, and upload optimized logos to Cloudflare R2 storage."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Controls & Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Brands</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{brands.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active in Store</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {brands.filter((b) => b.isActive).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departments Linked</span>
            <p className="text-2xl font-black text-forest-850 mt-1">{categories.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Engine</span>
            <p className="text-sm font-extrabold text-amber-600 mt-2 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-amber-500" />
              Cloudflare R2 + WebP
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search brands (e.g. Apple, Samsung)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
              />
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
              >
                <option value="all">All Departments ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh brands list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Brand</span>
            </button>
          </div>
        </div>

        {/* Brands Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Brand Logo</th>
                  <th className="px-5 py-3.5">Brand Name</th>
                  <th className="px-5 py-3.5">Associated Departments</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">
                      Loading brands catalog from database...
                    </td>
                  </tr>
                ) : filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">
                      No brands found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Logo Preview */}
                      <td className="px-5 py-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Tag className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">{brand.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{brand.slug}</div>
                        {brand.websiteUrl && (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-forest-700 hover:underline mt-0.5"
                          >
                            <span>Website</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>

                      {/* Associated Categories */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {brand.categories && brand.categories.length > 0 ? (
                            brand.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-forest-50 text-forest-900 border border-forest-200"
                              >
                                <Layers className="w-3 h-3 text-forest-600" />
                                {cat.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No categories linked</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                            brand.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              brand.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{brand.isActive ? 'Active' : 'Hidden'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(brand)}
                            className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg transition-colors"
                            title="Edit Brand"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id, brand.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Brand"
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

      {/* MODAL: Add / Edit Brand */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-forest-850" />
                {editingBrand ? 'Edit Brand Details' : 'Add New Commercial Brand'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold p-1 rounded-lg"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Apple, Samsung, Tecno"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. apple, samsung"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Logo Upload with Image Optimization & Cloudflare R2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-amber-500" />
                    Brand Logo (Cloudflare R2 + WebP Optimizer)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Auto-Compressed
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Tag className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoFileChange}
                      accept="image/png, image/jpeg, image/webp, image/svg+xml"
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={optimizing || uploadingToR2}
                        className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-forest-800" />
                        <span>{optimizing ? 'Optimizing...' : uploadingToR2 ? 'Uploading to R2...' : 'Select Logo Image'}</span>
                      </button>

                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Or enter logo image URL directly..."
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      />
                    </div>

                    {/* Optimization Feedback Badge */}
                    {optimizedResult && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            Original: <strong>{formatBytes(optimizedResult.originalSize)}</strong> &rarr; Optimized: <strong>{formatBytes(optimizedResult.optimizedSize)}</strong>
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          ⚡ {optimizedResult.savingsPercent}% Disk Saved!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Associate Multiple Categories (Many-to-Many Multi-Select) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Associate with Marketplace Departments (Multi-Select)
                </label>
                <p className="text-[11px] text-slate-500">
                  Select one or more departments where this brand should be visible and available for filtering:
                </p>

                <div className="max-h-48 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = selectedCategoryIds.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategorySelection(cat.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-left border ${
                          isSelected
                            ? 'bg-forest-850 text-white border-forest-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-emerald-300" />}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 text-right">
                  {selectedCategoryIds.length} departments selected
                </div>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Official Website (Optional)
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://brand.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="brand_active_toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-forest-850 rounded border-slate-300 focus:ring-forest-800 cursor-pointer"
                />
                <label htmlFor="brand_active_toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Brand is Active & Visible for Filtering on Marketplace
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{editingBrand ? 'Save Changes' : 'Create Brand'}</span>
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
