'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Package,
  Search,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Tag,
  Store,
  Layers,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Flame,
  ExternalLink,
  SlidersHorizontal,
  Check,
  X,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Product, Category, Brand } from '@/types/marketplace';
import {
  getProducts,
  toggleProductDealAction,
  deleteProductAction,
  updateProductAdminAction,
  createProductAdminAction,
} from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { getAllBrandsAction } from '@/actions/brands';
import { optimizeSquareProductImage } from '@/lib/image-optimizer';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [unit, setUnit] = useState('Piece');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isDealOfDay, setIsDealOfDay] = useState(false);
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSavings, setImageSavings] = useState<number | null>(null);

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      // 1. Center-crop and compress to 1:1 square WebP
      const optimized = await optimizeSquareProductImage(file, 600, 0.85);
      setImageSavings(optimized.savingsPercent);

      // 2. Upload to Cloudflare R2
      const formData = new FormData();
      formData.append('file', optimized.file);
      formData.append('folder', 'products');

      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setImageUrl(data.url);
      } else {
        setImageUrl(optimized.previewUrl);
        if (data.message || data.error) {
          setFormError(`${data.message || data.error} (Using local preview)`);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      const [prodData, catData, brandData] = await Promise.all([
        getProducts({ includeInactive: true }),
        getCategories(),
        getAllBrandsAction(),
      ]);
      setProducts(prodData);
      setCategories(catData);
      setBrands(brandData);
    } catch (err) {
      console.error('Error loading products data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSlug('');
    setPrice('');
    setCompareAtPrice('');
    setStock('25');
    setUnit('Piece');
    setCategoryId(categories[0]?.id || '');
    setBrandId('');
    setDescription('');
    setImageUrl('');
    setIsDealOfDay(false);
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setSlug(p.slug);
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice ? String(p.compareAtPrice) : '');
    setStock(String(p.stock));
    setUnit(p.unit || 'Piece');
    setCategoryId(p.categoryId || '');
    setBrandId(p.brandId || '');
    setDescription(p.description || '');
    setImageUrl(p.images && p.images.length > 0 ? p.images[0] : '');
    setIsDealOfDay(Boolean(p.isDealOfDay));
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingProduct) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleToggleDeal = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleProductDealAction({ id, isDealOfDay: !currentStatus });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isDealOfDay: !currentStatus } : p))
        );
      } else {
        alert(res.error || 'Failed to toggle deal status.');
      }
    } catch (err) {
      alert('Error updating deal status.');
    }
  };

  const handleDelete = async (id: string, productTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${productTitle}" from the marketplace database?`)) {
      return;
    }

    try {
      const res = await deleteProductAction(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res.error || 'Failed to delete product.');
      }
    } catch (err) {
      alert('Error deleting product.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;

    if (!editingProduct && !imageUrl.trim()) {
      setFormError('A square product photo is mandatory. Please upload an image.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const numericPrice = Number(price.replace(/[^0-9.]/g, ''));
      const numericCompareAt = compareAtPrice ? Number(compareAtPrice.replace(/[^0-9.]/g, '')) : undefined;
      const numericStock = Number(stock) || 0;

      if (editingProduct) {
        const res = await updateProductAdminAction({
          id: editingProduct.id,
          title,
          price: numericPrice,
          compareAtPrice: numericCompareAt,
          stock: numericStock,
          unit,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          description,
          isDealOfDay,
        });

        if (res.success) {
          setFormSuccess('Product updated in database successfully!');
          await loadAllData();
          setTimeout(() => setShowAddModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to update product.');
        }
      } else {
        const res = await createProductAdminAction({
          title,
          slug,
          price: numericPrice,
          compareAtPrice: numericCompareAt,
          stock: numericStock,
          unit,
          categoryId: categoryId || (categories[0]?.id || ''),
          brandId: brandId || undefined,
          description,
          images: imageUrl ? [imageUrl] : [],
          isDealOfDay,
        });

        if (res.success) {
          setFormSuccess('Product created in database successfully!');
          await loadAllData();
          setTimeout(() => setShowAddModal(false), 900);
        } else {
          setFormError(res.error || 'Failed to create product.');
        }
      }
    } catch (err: any) {
      setFormError('Server error while saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      p.categorySlug === selectedCategory ||
      p.categoryId === selectedCategory;

    const matchesBrand =
      selectedBrand === 'all' ||
      p.brandSlug === selectedBrand ||
      p.brandId === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  // Calculate live inventory stats
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalDealsCount = products.filter((p) => p.isDealOfDay).length;
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Products Catalog Moderation"
        subtitle="Live Supabase database inventory. Supervise merchant stock, pricing, Deal of the Day promotions, and brand assignments."
        liveStats={{ label: 'Live Database Listings', value: `${products.length} Products` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Top Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Listings</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Units in Stock</span>
            <p className="text-2xl font-black text-forest-850 mt-1">{totalStockCount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flash Deals Active</span>
            <p className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-amber-500" />
              {totalDealsCount}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Value</span>
            <p className="text-xl font-black text-emerald-600 mt-1">₦{totalInventoryValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, merchants, brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              <option value="all">All Departments ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-forest-800"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={loadAllData}
              className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh products from database"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Database Products Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-forest-850" />
              <span>Live Database Records (`products` Table)</span>
            </h4>
            <span className="text-xs font-bold text-forest-850 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
              {filteredProducts.length} Showing
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Product & Thumbnail</th>
                  <th className="px-5 py-3.5">Merchant / Location</th>
                  <th className="px-5 py-3.5">Department & Brand</th>
                  <th className="px-5 py-3.5">Price (₦)</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Deal of Day</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                      Loading products catalog from Supabase database...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-slate-400">
                      No products found matching your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden relative">
                            <img
                              src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80'}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm max-w-xs truncate" title={product.title}>
                              {product.title}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{product.sku}</span>
                              <span>•</span>
                              <span>{product.unit}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant Vendor */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-xs text-forest-850 flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-forest-600" />
                          <span>{product.vendorName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{product.vendorLocation}</div>
                      </td>

                      {/* Department & Brand */}
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{product.categoryName}</span>
                        </div>
                        {product.brandName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1">
                            <Tag className="w-2.5 h-2.5" />
                            {product.brandName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No brand</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5">
                        <div className="font-black text-slate-900 text-sm">
                          ₦{product.price.toLocaleString()}
                        </div>
                        {product.compareAtPrice && (
                          <div className="text-[11px] text-slate-400 line-through">
                            ₦{product.compareAtPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            product.stock > 10
                              ? 'bg-emerald-100 text-emerald-800'
                              : product.stock > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.stock > 10
                                ? 'bg-emerald-500'
                                : product.stock > 0
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{product.stock} in stock</span>
                        </span>
                      </td>

                      {/* Deal of the Day Toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleDeal(product.id, Boolean(product.isDealOfDay))}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            product.isDealOfDay
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to toggle Deal of the Day"
                        >
                          <Flame className={`w-3.5 h-3.5 ${product.isDealOfDay ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                          <span>{product.isDealOfDay ? 'Deal of Day' : 'Standard'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
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

      {/* MODAL: Create / Edit Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-forest-850" />
                <span>{editingProduct ? 'Edit Marketplace Listing' : 'Add New Product to Database'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department / Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    <option value="">Select Department</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brand (Optional)
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  >
                    <option value="">No Brand / Generic</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Selling Price (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Old Price (₦)
                  </label>
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="e.g. 52000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Mandatory Square Image Upload (1:1 Ratio) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Product Photo (Square 1:1 Aspect Ratio) *
                  </label>
                  {imageSavings !== null && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Saved {imageSavings}% via WebP
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3.5 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                  {/* Square Preview */}
                  <div className="w-24 h-24 aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-7 h-7 mx-auto text-slate-300" />
                        <span className="text-[9px] font-bold block mt-1">1:1 Square</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4 text-forest-850" />
                      <span>{uploadingImage ? 'Optimizing & Uploading...' : 'Upload Square Photo'}</span>
                    </button>
                    <p className="text-[11px] text-slate-500">
                      Auto-center-crops to exact 1:1 square, converts to WebP, and stores in Cloudflare R2.
                    </p>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or enter direct image URL https://..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product specifications, warranty details, and packaging info..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="deal_toggle"
                  checked={isDealOfDay}
                  onChange={(e) => setIsDealOfDay(e.target.checked)}
                  className="w-4 h-4 text-forest-850 rounded border-slate-300 focus:ring-forest-800 cursor-pointer"
                />
                <label htmlFor="deal_toggle" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Feature as "Flash Deal of the Day" on Home Page and Mobile App</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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
                      <span>{editingProduct ? 'Update Listing' : 'Publish Product to DB'}</span>
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
