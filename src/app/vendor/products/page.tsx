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
  Flame,
  Wallet,
  CreditCard,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { getCurrentVendorProfile, VendorProfileData } from '@/actions/vendors';
import {
  getVendorProductsAction,
  createVendorProductAction,
  deleteProductAction,
  toggleProductStockAction,
  updateVendorProductImagesAction,
  activateDealOfDayAction,
  VendorProductItem,
} from '@/actions/products';
import { getCategories } from '@/actions/categories';
import { getAllBrandsAction, requestNewBrandAction } from '@/actions/brands';
import { getPlatformSettingsAction } from '@/actions/settings';
import { Category, Brand } from '@/types/marketplace';
import { optimizeSquareProductImage } from '@/lib/image-optimizer';
import RichTextEditor from '@/components/RichTextEditor';

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

  // Multi-Image Upload State for Add Product
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [inputImageUrl, setInputImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery Management for Selected Product
  const [activeDetailImageIdx, setActiveDetailImageIdx] = useState(0);
  const [isUploadingDetailImage, setIsUploadingDetailImage] = useState(false);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Deal of the Day Promotion Modal State
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealProduct, setDealProduct] = useState<VendorProductItem | null>(null);
  const [dealDurationDays, setDealDurationDays] = useState(7);
  const [dealPaymentMethod, setDealPaymentMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [dealPricePerDay, setDealPricePerDay] = useState(500);
  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  // Action status
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorProf, cats, brs, settings] = await Promise.all([
        getCurrentVendorProfile(),
        getCategories(),
        getAllBrandsAction(),
        getPlatformSettingsAction(),
      ]);

      setProfile(vendorProf);
      setCategories(cats);
      setBrands(brs);
      setDealPricePerDay(Number(settings.dealOfDayPricePerDay) || 500);
      setPaystackPublicKey(settings.paystackPublicKey || '');

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

  // Handle Square Image Upload via R2 for Add Modal
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
        setUploadedImages((prev) => [...prev, data.url]);
      } else {
        if (optimized.previewUrl) {
          setUploadedImages((prev) => [...prev, optimized.previewUrl]);
        }
        setUploadError(data.error || 'Using local preview');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Image optimization or upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrlImage = () => {
    const trimmed = inputImageUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUploadError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    setUploadedImages((prev) => [...prev, trimmed]);
    setInputImageUrl('');
    setUploadError(null);
  };

  const handleRemoveUploadedImage = (idxToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSetPrimaryUploadedImage = (idxToPrimary: number) => {
    setUploadedImages((prev) => {
      const selected = prev[idxToPrimary];
      const rest = prev.filter((_, idx) => idx !== idxToPrimary);
      return [selected, ...rest];
    });
  };

  // Upload an additional photo to an already existing product
  const handleUploadDetailImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct || !profile?.id) return;
    setIsUploadingDetailImage(true);
    try {
      const optimized = await optimizeSquareProductImage(file, 800);
      const formData = new FormData();
      formData.append('file', optimized.file);
      formData.append('folder', 'products');
      const res = await fetch('/api/upload/r2', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success && data.url) {
        const currentList = Array.isArray(selectedProduct.images) ? selectedProduct.images : (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []);
        const updatedImages = [...currentList, data.url];
        const updateRes = await updateVendorProductImagesAction({
          vendorId: profile.id,
          productId: selectedProduct.id,
          images: updatedImages,
        });
        if (updateRes.success) {
          setSelectedProduct({
            ...selectedProduct,
            images: updatedImages,
            imageUrl: selectedProduct.imageUrl || data.url,
          });
          showToast('Photo added to product gallery!');
          loadData();
        } else {
          showToast(updateRes.error || 'Failed to update product images', 'error');
        }
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploadingDetailImage(false);
      if (detailFileInputRef.current) detailFileInputRef.current.value = '';
    }
  };

  // Delete an image from an already existing product
  const handleDeleteDetailImage = async (idxToRemove: number) => {
    if (!selectedProduct || !profile?.id) return;
    const currentList = Array.isArray(selectedProduct.images) ? selectedProduct.images : (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : []);
    if (currentList.length <= 1) {
      showToast('A product must have at least one photo.', 'error');
      return;
    }
    const updatedImages = currentList.filter((_, idx) => idx !== idxToRemove);
    const updateRes = await updateVendorProductImagesAction({
      vendorId: profile.id,
      productId: selectedProduct.id,
      images: updatedImages,
    });
    if (updateRes.success) {
      setSelectedProduct({
        ...selectedProduct,
        images: updatedImages,
        imageUrl: updatedImages[0],
      });
      setActiveDetailImageIdx(0);
      showToast('Image removed from gallery.');
      loadData();
    } else {
      showToast(updateRes.error || 'Failed to remove image', 'error');
    }
  };

  // Helper to load Paystack inline script
  const loadPaystackScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).PaystackPop) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleOpenDealModal = (prod: VendorProductItem) => {
    setDealProduct(prod);
    setDealDurationDays(7);
    setDealPaymentMethod('wallet');
    setDealError(null);
    setShowDealModal(true);
  };

  const handlePromoteDeal = async () => {
    if (!dealProduct || !profile?.id) return;
    setDealError(null);
    setSubmittingDeal(true);

    const totalCost = dealDurationDays * dealPricePerDay;

    try {
      if (dealPaymentMethod === 'wallet') {
        const walletBal = profile.walletBalance || 0;
        if (walletBal < totalCost) {
          setDealError(`Insufficient wallet balance (₦${walletBal.toLocaleString()}). Required: ₦${totalCost.toLocaleString()}. Please choose Paystack Checkout or top up.`);
          setSubmittingDeal(false);
          return;
        }

        const res = await activateDealOfDayAction({
          vendorId: profile.id,
          productId: dealProduct.id,
          durationDays: dealDurationDays,
          paymentMethod: 'wallet',
          vendorEmail: profile?.ownerEmail || undefined,
        });

        if (res.success) {
          showToast(`🔥 "${dealProduct.name}" is now featured as Deal of the Day for ${dealDurationDays} days!`);
          setShowDealModal(false);
          setDealProduct(null);
          await loadData();
        } else {
          setDealError(res.error || 'Failed to activate deal.');
        }
      } else {
        // Paystack Checkout
        let activeKey = paystackPublicKey?.trim();
        if (!activeKey) {
          try {
            const currentSettings = await getPlatformSettingsAction();
            activeKey = currentSettings.paystackPublicKey?.trim() || '';
            if (activeKey) setPaystackPublicKey(activeKey);
          } catch (e) {
            console.error('Error fetching live paystack key:', e);
          }
        }

        if (!activeKey) {
          setDealError('Paystack payment gateway public key is not configured in Admin Settings yet. Please configure it under Control Panel > Settings > Paystack.');
          setSubmittingDeal(false);
          return;
        }

        const scriptLoaded = await loadPaystackScript();
        if (!scriptLoaded || !(window as any).PaystackPop) {
          setDealError('Could not load Paystack checkout script. Please check your internet connection and try again.');
          setSubmittingDeal(false);
          return;
        }

        const vendorEmail = (profile?.ownerEmail && profile.ownerEmail.includes('@'))
          ? profile.ownerEmail.trim()
          : 'vendor@ogbamarketplace.com.ng';

        const amountKobo = Math.round(totalCost * 100);

        // Paystack inline.js strictly checks: "[object Function]" === {}.toString.call(callback)
        // An `async () => {}` returns "[object AsyncFunction]" which fails Paystack validation.
        // Therefore, callback and onClose must be standard function references.
        const paystack = (window as any).PaystackPop.setup({
          key: activeKey,
          email: vendorEmail,
          amount: amountKobo, // in kobo as integer
          currency: 'NGN',
          ref: `deal_${dealProduct.id.slice(0, 6)}_${Date.now()}`,
          metadata: {
            custom_fields: [
              {
                display_name: 'Product Promotion',
                variable_name: 'product_id',
                value: dealProduct.id,
              },
              {
                display_name: 'Duration Days',
                variable_name: 'duration_days',
                value: String(dealDurationDays),
              },
            ],
          },
          callback: function (response: { reference: string }) {
            (async () => {
              setSubmittingDeal(true);
              try {
                const res = await activateDealOfDayAction({
                  vendorId: profile.id,
                  productId: dealProduct.id,
                  durationDays: dealDurationDays,
                  paymentMethod: 'paystack',
                  paystackReference: response.reference,
                  vendorEmail: profile?.ownerEmail || vendorEmail,
                });

                if (res.success) {
                  showToast(`🔥 Deal of the Day payment verified! "${dealProduct.name}" is now featured for ${dealDurationDays} days!`);
                  setShowDealModal(false);
                  setDealProduct(null);
                  await loadData();
                } else {
                  setDealError(res.error || 'Payment was received but deal activation failed. Contact support.');
                }
              } catch (err: any) {
                setDealError(err.message || 'Error processing payment verification.');
              } finally {
                setSubmittingDeal(false);
              }
            })();
          },
          onClose: function () {
            setSubmittingDeal(false);
          },
        });

        paystack.openIframe();
        return;
      }
    } catch (err: any) {
      setDealError(err.message || 'Error processing deal activation.');
    } finally {
      if (dealPaymentMethod === 'wallet') {
        setSubmittingDeal(false);
      }
    }
  };

  // Submit New Product (Requires Admin Approval)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!profile?.id) {
      const err = 'Vendor profile session not found. Please log in again to continue.';
      setModalError(err);
      showToast(err, 'error');
      return;
    }

    if (!title.trim()) {
      const err = 'Please enter a product title.';
      setModalError(err);
      showToast(err, 'error');
      return;
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      const err = 'Please enter a valid selling price.';
      setModalError(err);
      showToast(err, 'error');
      return;
    }

    if (uploadedImages.length === 0) {
      const err = 'At least one square product photo is mandatory. Please upload a photo.';
      setModalError(err);
      showToast(err, 'error');
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
        images: uploadedImages,
      });

      if (res.success) {
        showToast('Product submitted! Awaiting administrator approval before appearing in store.');
        setShowAddModal(false);
        setModalError(null);
        // Reset form
        setTitle('');
        setPrice('');
        setComparePrice('');
        setDescription('');
        setUploadedImages([]);
        setInputImageUrl('');
        setHasBrand(false);
        setBrandId('');
        // Reload list
        loadData();
      } else {
        const errMsg = res.error || 'Failed to submit product.';
        setModalError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Submission failed.';
      setModalError(msg);
      showToast(msg, 'error');
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
            className={`fixed top-5 right-5 z-[100] max-w-md p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-xl transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/20'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-950/20'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white font-bold ml-3">
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
                  <th className="px-5 py-3.5">Promotion</th>
                  <th className="px-5 py-3.5">Moderation Status</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-forest-850" />
                        <span>Loading your store catalog from database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-slate-400 text-xs">
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

                      {/* Deals of the Day / Promotion */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {p.isDealOfDay ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                              <span>Deal Active</span>
                            </span>
                            {p.dealExpiresAt && (
                              <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                Until {new Date(p.dealExpiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenDealModal(p)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 transition-all shadow-2xs group"
                            title="Promote this product as Deal of the Day on the Homepage"
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                            <span>Promote 🔥</span>
                          </button>
                        )}
                      </td>

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
                {modalError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{modalError}</span>
                  </div>
                )}

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

                  {/* Multi-Image Upload (Mandatory Square 1:1 Aspect Ratio) */}
                  <div className="sm:col-span-2 space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                          Product Photos ({uploadedImages.length}) *
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Upload 1:1 square photos. The first image is the primary cover photo.
                        </p>
                      </div>
                      {uploadError && <p className="text-xs text-rose-600 font-bold">{uploadError}</p>}
                    </div>

                    {/* Thumbnails grid */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={`${img}-${idx}`}
                            className={`relative group rounded-xl border-2 overflow-hidden bg-white shadow-2xs aspect-square flex items-center justify-center ${
                              idx === 0 ? 'border-forest-850 ring-2 ring-forest-850/20' : 'border-slate-200'
                            }`}
                          >
                            <img src={img} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 ? (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-forest-850 text-white shadow-xs">
                                Primary Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryUploadedImage(idx)}
                                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/90 hover:bg-forest-850 hover:text-white text-slate-700 shadow-xs transition-colors opacity-90 group-hover:opacity-100"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedImage(idx)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                      >
                        <Upload className="w-4 h-4 text-forest-850" />
                        <span>{isUploadingImage ? 'Uploading Image...' : 'Upload Square Photo'}</span>
                      </button>
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="url"
                          value={inputImageUrl}
                          onChange={(e) => setInputImageUrl(e.target.value)}
                          placeholder="Or paste direct image URL (https://...)"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddUrlImage}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                      Detailed Description & Specifications *
                    </label>
                    <RichTextEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Describe freshness, origin, packaging, measurements, and guarantee..."
                      height={260}
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

        {/* Modal: View Details & Multi-Image Management */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Pinned Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-forest-850" />
                  <h3 className="font-extrabold text-base text-slate-900">Product Overview & Gallery</h3>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
                {/* Main Active Photo */}
                <div className="relative aspect-video max-h-72 w-full bg-slate-900/5 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[activeDetailImageIdx] || selectedProduct.images[0]}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain bg-slate-900/5"
                    />
                  ) : selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain bg-slate-900/5"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-forest-850 text-white shadow-md">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.brandName && (
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/95 text-slate-900 shadow-md">
                        {selectedProduct.brandName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Multi-Photo Gallery Strip & Management */}
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-forest-850" />
                      <span className="text-xs font-bold text-slate-800 uppercase">
                        Product Photo Gallery ({selectedProduct.images?.length || 1})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">Click photo to preview</span>
                  </div>

                  <input
                    type="file"
                    ref={detailFileInputRef}
                    accept="image/*"
                    onChange={handleUploadDetailImage}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {(selectedProduct.images || (selectedProduct.imageUrl ? [selectedProduct.imageUrl] : [])).map(
                      (img, idx) => (
                        <div
                          key={`${img}-${idx}`}
                          onClick={() => setActiveDetailImageIdx(idx)}
                          className={`relative group w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                            activeDetailImageIdx === idx
                              ? 'border-forest-850 ring-2 ring-forest-850/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-forest-850/90 text-white text-[8px] font-bold text-center py-0.5">
                              Main
                            </span>
                          )}
                          {(selectedProduct.images?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDetailImage(idx);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                              title="Delete photo"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {/* Add Photo Button */}
                    <button
                      type="button"
                      onClick={() => detailFileInputRef.current?.click()}
                      disabled={isUploadingDetailImage}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 hover:border-forest-850 text-slate-500 hover:text-forest-850 bg-white flex flex-col items-center justify-center gap-1 shrink-0 transition-colors shadow-2xs"
                      title="Add another photo to this product"
                    >
                      {isUploadingDetailImage ? (
                        <div className="w-4 h-4 border-2 border-forest-850/30 border-t-forest-850 rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-bold">+ Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Product Title and Pricing */}
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

                {/* Deal of the Day Promotion Status */}
                {selectedProduct.isDealOfDay ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-600 fill-amber-500 animate-pulse shrink-0" />
                      <div>
                        <span className="text-xs font-black text-amber-900 block">Active Deal of the Day</span>
                        {selectedProduct.dealExpiresAt && (
                          <span className="text-[11px] text-amber-700">
                            Featured on homepage until {new Date(selectedProduct.dealExpiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDealModal(selectedProduct)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Extend Deal
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                        <Flame className="w-4 h-4 fill-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Want more customer orders?</h4>
                        <p className="text-[11px] text-slate-500">
                          Feature this product as "Deal of the Day" for ₦{dealPricePerDay.toLocaleString()}/day.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDealModal(selectedProduct)}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      <span>Promote to Deal 🔥</span>
                    </button>
                  </div>
                )}

                {/* Moderation Banner */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
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

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <strong className="block text-slate-900 font-bold mb-1">Item Description:</strong>
                  {selectedProduct.description || 'No description provided.'}
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
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
        )}

        {/* Modal: Deal of the Day Promotion */}
        {showDealModal && dealProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Flame className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Promote to Deal of the Day</h3>
                    <p className="text-xs text-slate-500">Feature on the Homepage hero banner & flash deals</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDealModal(false);
                    setDealProduct(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {dealError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{dealError}</span>
                </div>
              )}

              {/* Product Summary */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                  <img src={dealProduct.imageUrl} alt={dealProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{dealProduct.name}</h4>
                  <p className="text-xs text-forest-850 font-black">
                    ₦{dealProduct.price.toLocaleString()} • {dealProduct.category}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Daily Rate</span>
                  <span className="text-sm font-black text-amber-600">₦{dealPricePerDay.toLocaleString()}/day</span>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">Select Promotion Duration</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { days: 1, label: '1 Day' },
                    { days: 3, label: '3 Days' },
                    { days: 7, label: '7 Days' },
                    { days: 14, label: '14 Days' },
                    { days: 30, label: '30 Days' },
                  ].map((opt) => {
                    const isSelected = dealDurationDays === opt.days;
                    return (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDealDurationDays(opt.days)}
                        className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-white/90' : 'text-slate-400 font-normal'}`}>
                          ₦{(opt.days * dealPricePerDay).toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-bold block">Total Promotion Fee</span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {dealDurationDays} days @ ₦{dealPricePerDay.toLocaleString()} / day
                  </span>
                </div>
                <div className="text-xl font-black text-amber-950">
                  ₦{(dealDurationDays * dealPricePerDay).toLocaleString()}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">Choose Payment Source</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Wallet Balance Option */}
                  <div
                    onClick={() => setDealPaymentMethod('wallet')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      dealPaymentMethod === 'wallet'
                        ? 'border-forest-850 bg-forest-50/50 ring-2 ring-forest-850/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        dealPaymentMethod === 'wallet' ? 'bg-forest-850 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">Wallet Balance</span>
                        <input
                          type="radio"
                          checked={dealPaymentMethod === 'wallet'}
                          onChange={() => setDealPaymentMethod('wallet')}
                          className="text-forest-850"
                        />
                      </div>
                      <p className="text-xs font-bold text-forest-850 mt-0.5">
                        ₦{(profile?.walletBalance || 0).toLocaleString()} Available
                      </p>
                      {(profile?.walletBalance || 0) < dealDurationDays * dealPricePerDay && (
                        <span className="text-[10px] text-rose-600 font-bold block mt-0.5">Insufficient funds</span>
                      )}
                    </div>
                  </div>

                  {/* Paystack Checkout Option */}
                  <div
                    onClick={() => setDealPaymentMethod('paystack')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      dealPaymentMethod === 'paystack'
                        ? 'border-forest-850 bg-forest-50/50 ring-2 ring-forest-850/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        dealPaymentMethod === 'paystack' ? 'bg-forest-850 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">Paystack Checkout</span>
                        <input
                          type="radio"
                          checked={dealPaymentMethod === 'paystack'}
                          onChange={() => setDealPaymentMethod('paystack')}
                          className="text-forest-850"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Card, USSD, Bank Transfer</p>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Instant Activation</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowDealModal(false);
                    setDealProduct(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePromoteDeal}
                  disabled={submittingDeal}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingDeal ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Flame className="w-4 h-4 fill-white text-white" />
                      <span>
                        {dealPaymentMethod === 'wallet'
                          ? `Pay ₦${(dealDurationDays * dealPricePerDay).toLocaleString()} from Wallet`
                          : `Pay ₦${(dealDurationDays * dealPricePerDay).toLocaleString()} with Paystack`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
