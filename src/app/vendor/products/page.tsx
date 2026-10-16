'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Layers,
  X,
  Tag,
  Clock,
  AlertCircle,
  RefreshCw,
  Building,
  Check,
} from 'lucide-react';
import { getCurrentVendorProfile, VendorProfileData } from '@/actions/vendors';
import {
  getVendorProductsAction,
  createVendorProductAction,
  deleteProductAction,
  toggleProductStockAction,
  VendorProductItem,
} from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { getAllBrandsAction, requestNewBrandAction } from '@/actions/brands';
import { Category, Brand } from '@/types/marketplace';
import { optimizeSquareProductImage } from '@/lib/image-optimizer';

export default function VendorProductsPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [products, setProducts] = useState<VendorProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrandRequestModal, setShowBrandRequestModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProductItem | null>(null);

  // Form State for Add Product
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');

  // Brand selection
  const [hasBrand, setHasBrand] = useState(false);
  const [brandId, setBrandId] = useState('');

  // Brand Request Modal State
  const [reqBrandName, setReqBrandName] = useState('');
  const [reqBrandWebsite, setReqBrandWebsite] = useState('');
  const [reqBrandDescription, setReqBrandDescription] = useState('');
  const [submittingBrandReq, setSubmittingBrandReq] = useState(false);

  // Image Upload State (Mandatory Square Image)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorProf, cats, brs] = await Promise.all([
        getCurrentVendorProfile(),
        getCategories(),
        getAllBrandsAction(),
      ]);

      setProfile(vendorProf);
      setCategories(cats);
      setBrands(brs);

      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }

      if (vendorProf?.id) {
        const vendorProds = await getVendorProductsAction(vendorProf.id);
        setProducts(vendorProds);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error loading vendor products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Square Image Upload via R2
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const optimized = await optimizeSquareProductImage(file, 800);

      const formData = new FormData();
      formData.append('file', optimized.file);
      formData.append('folder', 'products');

      const res = await fetch('/api/upload/r2', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setUploadedImageUrl(data.url);
      } else {
        setUploadError(data.error || 'Failed to upload image. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image optimization or upload failed.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Submit New Product (Requires Admin Approval)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      showToast('Vendor profile not identified. Please re-login.', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('Please enter a product title.', 'error');
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showToast('Please enter a valid selling price.', 'error');
      return;
    }

    if (!uploadedImageUrl) {
      showToast('A square product photo is mandatory. Please upload an image.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createVendorProductAction({
        vendorId: profile.id,
        title: title.trim(),
        price: numericPrice,
        compareAtPrice: comparePrice ? parseFloat(comparePrice.replace(/[^0-9.]/g, '')) : undefined,
        stock: parseInt(stock) || 1,
        unit: unit.trim() || 'Piece',
        categoryId: categoryId || (categories[0]?.id || ''),
        brandId: hasBrand && brandId ? brandId : undefined,
        description: description.trim(),
        imageUrl: uploadedImageUrl,
      });

      if (res.success) {
        showToast('Product submitted! Awaiting administrator approval before appearing in store.');
        setShowAddModal(false);
        // Reset form
        setTitle('');
        setPrice('');
        setComparePrice('');
        setDescription('');
        setUploadedImageUrl('');
        setHasBrand(false);
        setBrandId('');
        // Reload list
        loadData();
      } else {
        showToast(res.error || 'Failed to submit product.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Brand Request
  const handleSubmitBrandRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !reqBrandName.trim()) return;

    setSubmittingBrandReq(true);
    try {
      const res = await requestNewBrandAction({
        vendorId: profile.id,
        brandName: reqBrandName.trim(),
        categoryId: categoryId || undefined,
        websiteUrl: reqBrandWebsite.trim() || undefined,
        description: reqBrandDescription.trim() || undefined,
      });

      if (res.success) {
        showToast('Brand addition requested! Admin will review and add it to the brand catalog.');
        setReqBrandName('');
        setReqBrandWebsite('');
        setReqBrandDescription('');
        setShowBrandRequestModal(false);
      } else {
        showToast(res.error || 'Failed to submit brand request.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting brand request.', 'error');
    } finally {
      setSubmittingBrandReq(false);
    }
  };

  // Toggle Stock in DB
  const handleToggleStock = async (product: VendorProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newInStock = !product.inStock;
      const res = await toggleProductStockAction({ id: product.id, inStock: newInStock });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, inStock: newInStock, stock: newInStock ? 10 : 0 } : p))
        );
        if (selectedProduct?.id === product.id) {
          setSelectedProduct((prev) => (prev ? { ...prev, inStock: newInStock, stock: newInStock ? 10 : 0 } : null));
        }
      } else {
        showToast(res.error || 'Failed to update stock.', 'error');
      }
    } catch (err) {
      showToast('Error toggling stock.', 'error');
    }
  };

  // Real DB Product Deletion
  const handleDeleteProduct = async (product: VendorProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${product.name}"? It will be removed from your catalog.`)) {
      return;
    }

    try {
      const res = await deleteProductAction(product.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (selectedProduct?.id === product.id) {
          setSelectedProduct(null);
        }
        showToast(`"${product.name}" deleted successfully.`);
      } else {
        showToast(res.error || 'Failed to delete product.', 'error');
      }
    } catch (err) {
      showToast('Error deleting product.', 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="My Products Catalog"
        subtitle="Upload items with mandatory square photos, brand association, and portion pricing. Note: newly uploaded items require administrator approval."
        liveStats={{ label: 'Store Items', value: `${products.length} Products` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Top Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items, category, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh products"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Item</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-forest-850" />
              <span>Products in Your Storefront</span>
            </h3>
            <span className="text-xs font-bold bg-forest-50 text-forest-850 border border-forest-100 px-3 py-1 rounded-full">
              {filteredProducts.length} Items Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Product & Photo (1:1)</th>
                  <th className="px-5 py-3.5">Department & Brand</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Stock</th>
                  <th className="px-5 py-3.5">Moderation Status</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-forest-850" />
                        <span>Loading your store catalog from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span className="font-bold text-slate-600 text-sm">No products listed yet</span>
                        <p className="text-slate-400 max-w-sm">
                          Click "Upload New Item" above to add your first product with photo, price, and brand assignment.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Photo & Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-forest-850 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {p.unit} • OGB-{p.id.slice(0, 5).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-slate-700 font-semibold">{p.category}</div>
                        {p.brandName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 mt-1">
                            <Tag className="w-2.5 h-2.5" />
                            {p.brandName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Brand</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-black text-slate-900 text-sm">
                        ₦{p.price.toLocaleString()}
                        {p.compareAtPrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₦{p.compareAtPrice.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-700">{p.stock} units</td>

                      {/* Moderation Status */}
                      <td className="px-5 py-3.5">
                        {p.approvalStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Live in Store</span>
                          </span>
                        ) : p.approvalStatus === 'declined' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800"
                            title={p.rejectionReason || 'Declined by admin'}
                          >
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Declined</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Review</span>
                          </span>
                        )}
                      </td>

                      {/* In Stock Toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => handleToggleStock(p, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                            p.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(p);
                            }}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-forest-850 hover:bg-forest-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProduct(p, e)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

        {/* Modal: Upload New Item */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Upload Product for Review</h3>
                  <p className="text-xs text-slate-500">
                    Mandatory square photo, category & brand selection. Products require admin approval before going live.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Item / Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 25 Litres Pure Ogba Red Palm Oil"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                    />
                  </div>

                  {/* Category (Dynamic from DB) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Department / Category *</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Unit / Portion *</label>
                    <input
                      type="text"
                      placeholder="e.g. 25L Jerrycan, Bag, Plate, Piece"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Brand Section: "Does your product have a brand?" */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase">Does this product have a brand?</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="has_brand_opt"
                            checked={hasBrand}
                            onChange={() => setHasBrand(true)}
                            className="text-forest-850"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                          <input
                            type="radio"
                            name="has_brand_opt"
                            checked={!hasBrand}
                            onChange={() => {
                              setHasBrand(false);
                              setBrandId('');
                            }}
                            className="text-forest-850"
                          />
                          <span>No (Generic / Local Farm)</span>
                        </label>
                      </div>
                    </div>

                    {hasBrand && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-700">Select Brand:</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={brandId}
                            onChange={(e) => setBrandId(e.target.value)}
                            className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800"
                          >
                            <option value="">-- Choose from Brand List ({brands.length} available) --</option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setShowBrandRequestModal(true)}
                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            + Brand Not Listed? Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Selling Price (₦) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 25000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-forest-850 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Compare Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Discount / Slash Price (₦)</label>
                    <input
                      type="number"
                      placeholder="e.g. 28000 (Optional)"
                      value={comparePrice}
                      onChange={(e) => setComparePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Stock */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 20"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  {/* Mandatory Square Image Upload (1:1 Aspect Ratio) */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Product Photo (Mandatory Square 1:1 Aspect Ratio) *
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                      {/* Square Preview */}
                      <div className="w-28 h-28 aspect-square rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {uploadedImageUrl ? (
                          <img
                            src={uploadedImageUrl}
                            alt="Uploaded preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2 text-slate-400">
                            <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                            <span className="text-[10px] font-bold block mt-1">1:1 Square</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors inline-flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4 text-forest-850" />
                          <span>{isUploadingImage ? 'Uploading Image...' : 'Choose Square Photo'}</span>
                        </button>
                        <p className="text-[11px] text-slate-500">
                          Upload high-resolution square photo (PNG, JPG, or WEBP). Image is securely saved to Cloudflare R2 storage.
                        </p>
                        {uploadError && (
                          <p className="text-xs text-rose-600 font-bold">{uploadError}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                      Detailed Description & Specifications *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe freshness, origin, packaging, measurements, and guarantee..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isUploadingImage}
                    className="px-6 py-2.5 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Submit for Admin Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Brand Addition */}
        {showBrandRequestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-forest-850" />
                  <h3 className="text-base font-extrabold text-slate-900">Request Brand Addition</h3>
                </div>
                <button
                  onClick={() => setShowBrandRequestModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Can't find your product's official brand in our directory? Submit a brand request. Administrators will review and add it.
              </p>

              <form onSubmit={handleSubmitBrandRequest} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dangote, Nestlé, Sony"
                    value={reqBrandName}
                    onChange={(e) => setReqBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Brand Website (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={reqBrandWebsite}
                    onChange={(e) => setReqBrandWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Notes / Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the brand products..."
                    value={reqBrandDescription}
                    onChange={(e) => setReqBrandDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBrandRequestModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBrandReq}
                    className="px-5 py-2 bg-forest-850 hover:bg-forest-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {submittingBrandReq ? 'Submitting...' : 'Send Request to Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Details */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative aspect-square max-h-72 w-full bg-slate-100">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-forest-850 text-white shadow-md">
                    {selectedProduct.category}
                  </span>
                  {selectedProduct.brandName && (
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/90 text-slate-900 shadow-md">
                      {selectedProduct.brandName}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                  <div className="flex items-baseline gap-3 mt-1.5">
                    <span className="text-2xl font-black text-forest-850">
                      ₦{selectedProduct.price.toLocaleString()}
                    </span>
                    {selectedProduct.compareAtPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        ₦{selectedProduct.compareAtPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-bold">• {selectedProduct.unit}</span>
                  </div>
                </div>

                {/* Moderation Banner */}
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    selectedProduct.approvalStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedProduct.approvalStatus === 'declined'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {selectedProduct.approvalStatus === 'approved' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>This product is approved by admin and active on OGBA MARKET PLACE.</span>
                    </>
                  ) : selectedProduct.approvalStatus === 'declined' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <span>Product was declined. </span>
                        {selectedProduct.rejectionReason && (
                          <span className="font-normal italic">Reason: "{selectedProduct.rejectionReason}"</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Pending Administrator Review. Product will become public once verified.</span>
                    </>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="block text-slate-900 font-bold mb-1">Item Description:</strong>
                  {selectedProduct.description || 'No description provided.'}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteProduct(selectedProduct)}
                    className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Product</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStock(selectedProduct)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                        selectedProduct.inStock ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {selectedProduct.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
