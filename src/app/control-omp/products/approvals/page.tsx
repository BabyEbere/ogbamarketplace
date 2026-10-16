'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  PackageCheck,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Store,
  MapPin,
  Tag,
  Layers,
  Eye,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getPendingProductsReviewAction,
  approveProductAction,
  declineProductAction,
  PendingProductReviewRecord,
} from '@/actions/products';

export default function AdminProductApprovalsPage() {
  const [products, setProducts] = useState<PendingProductReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Decline Modal State
  const [selectedProductForDecline, setSelectedProductForDecline] = useState<PendingProductReviewRecord | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState<string | null>(null);

  // Notification Toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getPendingProductsReviewAction();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load pending products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (product: PendingProductReviewRecord) => {
    try {
      setActionLoadingId(product.id);
      const res = await approveProductAction(product.id);
      if (res.success) {
        showToast(`Product "${product.title}" has been approved and published to the marketplace!`);
        await loadData();
      } else {
        showToast(res.error || 'Failed to approve product.', 'error');
      }
    } catch (err) {
      showToast('Server error while approving product.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForDecline) return;

    if (!declineReason.trim()) {
      setDeclineError('Please enter a specific reason for declining this product.');
      return;
    }

    try {
      setActionLoadingId(selectedProductForDecline.id);
      const res = await declineProductAction({
        productId: selectedProductForDecline.id,
        reason: declineReason.trim(),
      });

      if (res.success) {
        showToast(`Product "${selectedProductForDecline.title}" was declined.`);
        setSelectedProductForDecline(null);
        setDeclineReason('');
        setDeclineError(null);
        await loadData();
      } else {
        setDeclineError(res.error || 'Failed to decline product.');
      }
    } catch (err) {
      setDeclineError('Server error while declining product.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Product Review & Approvals Queue"
        subtitle="Review new products submitted by vendors before they go live on Ogba Marketplace. Verify square image quality, pricing, and category classification."
        liveStats={{ label: 'Pending Review', value: `${products.length} Products`, badge: 'Action Required' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {notification && (
          <div
            className={`p-4 rounded-xl border font-bold text-xs flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Search and Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pending products, vendors, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Product Approval Cards Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
              Loading pending products review queue from database...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-16 text-center rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Review Queue is Clear!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All vendor-submitted products have been reviewed and processed. Newly uploaded products will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const isBusy = actionLoadingId === product.id;
                const primaryImage = product.images.length > 0 ? product.images[0] : '';

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Square Product Image */}
                      <div className="w-28 h-28 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden relative flex items-center justify-center">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.title}
                            className="w-full h-full object-cover aspect-square"
                          />
                        ) : (
                          <div className="text-[10px] text-slate-400 font-bold">No Image</div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          1:1
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {product.categoryName}
                          </span>
                          {product.brandName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              {product.brandName}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            Pending Review
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-2">
                          {product.title}
                        </h4>

                        <div className="flex items-baseline gap-2">
                          <span className="font-black text-forest-850 text-base">
                            ₦{product.price.toLocaleString()}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₦{product.compareAtPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                          <Store className="w-3.5 h-3.5 text-forest-700 shrink-0" />
                          <span className="font-semibold text-slate-800">{product.vendorName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">{product.vendorLocation}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description excerpt */}
                    {product.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2 italic">
                        "{product.description}"
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Stock: {product.stock} {product.unit}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProductForDecline(product);
                            setDeclineReason('');
                            setDeclineError(null);
                          }}
                          disabled={isBusy}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(product)}
                          disabled={isBusy}
                          className="px-4 py-2 rounded-xl bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isBusy ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Approve & Publish Live</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Decline Product with Reason */}
        {selectedProductForDecline && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  Decline Product Submission
                </h3>
                <button
                  onClick={() => setSelectedProductForDecline(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div><strong>Product:</strong> {selectedProductForDecline.title}</div>
                <div><strong>Vendor:</strong> {selectedProductForDecline.vendorName}</div>
              </div>

              {declineError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {declineError}
                </div>
              )}

              <form onSubmit={handleConfirmDecline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="e.g. Image is not square and blurry, or price is unreasonably marked up. Please re-upload a clear square photo."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    This reason will be visible to the vendor on their dashboard so they can fix it.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductForDecline(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoadingId === selectedProductForDecline.id}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
