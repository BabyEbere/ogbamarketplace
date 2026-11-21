'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Flame,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  Wallet,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import { getCurrentVendorProfile, VendorProfileData } from '@/actions/vendors';
import { getVendorProductsAction, activateDealOfDayAction, VendorProductItem } from '@/actions/products';
import { getPlatformSettingsAction } from '@/actions/settings';

export default function VendorMarketingPage() {
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [products, setProducts] = useState<VendorProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealPricePerDay, setDealPricePerDay] = useState(500);
  const [paystackPublicKey, setPaystackPublicKey] = useState('');

  // Deal Modal state
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProductItem | null>(null);
  const [dealDurationDays, setDealDurationDays] = useState(7);
  const [dealPaymentMethod, setDealPaymentMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  // Search & Filter state for unpromoted products
  const [productSearch, setProductSearch] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorProf, settings] = await Promise.all([
        getCurrentVendorProfile(),
        getPlatformSettingsAction(),
      ]);

      setProfile(vendorProf);
      setDealPricePerDay(Number(settings.dealOfDayPricePerDay) || 500);
      setPaystackPublicKey(settings.paystackPublicKey || '');

      if (vendorProf?.id) {
        const prods = await getVendorProductsAction(vendorProf.id);
        setProducts(prods);
      }
    } catch (err) {
      console.error('Error loading vendor marketing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDealModal = (prod?: VendorProductItem) => {
    if (prod) {
      setSelectedProduct(prod);
    } else {
      const eligible = products.filter((p) => !p.isDealOfDay && p.approvalStatus === 'approved');
      setSelectedProduct(eligible.length > 0 ? eligible[0] : null);
    }
    setDealDurationDays(7);
    setDealPaymentMethod('wallet');
    setDealError(null);
    setShowDealModal(true);
  };

  const handlePromoteDeal = async () => {
    if (!selectedProduct || !profile?.id) return;
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
          productId: selectedProduct.id,
          durationDays: dealDurationDays,
          paymentMethod: 'wallet',
          vendorEmail: profile?.ownerEmail || undefined,
        });

        if (res.success) {
          showToast(`🔥 "${selectedProduct.name}" is now featured as Deal of the Day for ${dealDurationDays} days!`);
          setShowDealModal(false);
          setSelectedProduct(null);
          await loadData();
        } else {
          setDealError(res.error || 'Failed to activate deal.');
        }
      } else {
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
          setDealError('Paystack public key is not configured in Admin Settings yet.');
          setSubmittingDeal(false);
          return;
        }

        const scriptLoaded = await loadPaystackScript();
        if (!scriptLoaded || !(window as any).PaystackPop) {
          setDealError('Could not load Paystack checkout script. Check your internet connection.');
          setSubmittingDeal(false);
          return;
        }

        const vendorEmail = (profile?.ownerEmail && profile.ownerEmail.includes('@'))
          ? profile.ownerEmail.trim()
          : 'vendor@ogbamarketplace.com.ng';

        const amountKobo = Math.round(totalCost * 100);

        const paystack = (window as any).PaystackPop.setup({
          key: activeKey,
          email: vendorEmail,
          amount: amountKobo,
          currency: 'NGN',
          ref: `deal_${selectedProduct.id.slice(0, 6)}_${Date.now()}`,
          metadata: {
            custom_fields: [
              { display_name: 'Product Promotion', variable_name: 'product_id', value: selectedProduct.id },
              { display_name: 'Duration Days', variable_name: 'duration_days', value: String(dealDurationDays) },
            ],
          },
          callback: function (response: { reference: string }) {
            (async () => {
              setSubmittingDeal(true);
              try {
                const res = await activateDealOfDayAction({
                  vendorId: profile.id,
                  productId: selectedProduct.id,
                  durationDays: dealDurationDays,
                  paymentMethod: 'paystack',
                  paystackReference: response.reference,
                  vendorEmail: profile?.ownerEmail || vendorEmail,
                });

                if (res.success) {
                  showToast(`🔥 Deal verified! "${selectedProduct.name}" is now featured for ${dealDurationDays} days!`);
                  setShowDealModal(false);
                  setSelectedProduct(null);
                  await loadData();
                } else {
                  setDealError(res.error || 'Payment received but deal activation failed. Contact support.');
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
      setDealError(err.message || 'Error processing deal promotion.');
    } finally {
      if (dealPaymentMethod === 'wallet') {
        setSubmittingDeal(false);
      }
    }
  };

  const activeDeals = products.filter((p) => p.isDealOfDay);
  const eligibleProducts = products.filter(
    (p) =>
      !p.isDealOfDay &&
      p.approvalStatus === 'approved' &&
      (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const calculateDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold border transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 p-6 md:p-8 text-white border border-emerald-800/40 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>MARKETING & PROMOTIONS HUB</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Boost Your Sales with Deals of the Day
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pin your products to the top countdown carousel on the homepage, rank highest in search results, and attract shoppers across Omoku, Egi, and ONELGA.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenDealModal()}
              disabled={products.filter((p) => p.approvalStatus === 'approved').length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Launch New Promotion</span>
            </button>
            <Link
              href="/vendor/wallet"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet: ₦{(profile?.walletBalance || 0).toLocaleString()}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Active Deals</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeDeals.length}</div>
          <p className="text-[11px] text-slate-500">Currently pinned on homepage</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Promotion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₦{dealPricePerDay.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500">Fixed rate per product / day</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Store Products</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <p className="text-[11px] text-slate-500">{eligibleProducts.length} ready to promote</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Wallet Balance</span>
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₦{(profile?.walletBalance || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">Instant 1-click promotion deduction</p>
        </div>
      </div>

      {/* Active Campaigns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-black text-slate-900">Active Deals of the Day ({activeDeals.length})</h2>
          </div>
          <button
            onClick={loadData}
            className="text-xs text-slate-500 hover:text-slate-900 font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {activeDeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDeals.map((prod) => {
              const daysRemaining = calculateDaysRemaining(prod.dealExpiresAt);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Deal Active 🔥
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 relative">
                      {prod.imageUrl ? (
                        <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs">No Pic</div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {prod.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                      <div className="text-base font-black text-emerald-800">₦{prod.price.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Expiration and Timeline */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{daysRemaining} Days Remaining</span>
                      </span>
                      {prod.dealExpiresAt && (
                        <span className="text-[11px] font-medium text-amber-700">
                          Expires: {new Date(prod.dealExpiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-3/4 animate-pulse" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <Link
                      href={`/products/${prod.id}`}
                      target="_blank"
                      className="text-slate-600 hover:text-slate-900 font-bold inline-flex items-center gap-1"
                    >
                      <span>View Live Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => handleOpenDealModal(prod)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      Extend Deal Duration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Active Deal Promotions</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You currently do not have any products featured as Deals of the Day. Promote an approved product below to start getting prominent homepage exposure.
            </p>
            <button
              onClick={() => handleOpenDealModal()}
              disabled={eligibleProducts.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Select a Product to Promote</span>
            </button>
          </div>
        )}
      </div>

      {/* Eligible Products Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Promote Other Products</h2>
            <p className="text-xs text-slate-500">Choose from your approved inventory to feature on the homepage.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600"
            />
          </div>
        </div>

        {eligibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eligibleProducts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-[9px]">No Pic</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                    <p className="text-xs font-black text-emerald-800">₦{p.price.toLocaleString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDealModal(p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 transition-all shrink-0"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                  <span>Promote</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-4 text-center">
            {productSearch ? 'No matching products found.' : 'All your approved products are already active deals!'}
          </p>
        )}
      </div>

      {/* Promotion Benefits Info */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-sm font-black uppercase tracking-wider">How Deals of the Day Benefit You</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-bold text-white text-sm">1. Homepage Top Countdown</div>
            <p className="leading-relaxed text-slate-400">
              Your product gets pinned to the official countdown carousel viewed by every visitor arriving on the platform.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-bold text-white text-sm">2. Search & Category Priority</div>
            <p className="leading-relaxed text-slate-400">
              Active deals appear with an animated flame badge and rank ahead of standard listings in customer searches.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-bold text-white text-sm">3. Instant Automated Setup</div>
            <p className="leading-relaxed text-slate-400">
              Pay via your vendor wallet balance or direct Paystack card/transfer. Promotions activate in real time with receipt emails sent.
            </p>
          </div>
        </div>
      </div>

      {/* Deal Promotion Modal */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Promote Deal of the Day</h3>
                  <p className="text-xs text-slate-500">Feature product on the Homepage countdown</p>
                </div>
              </div>
              <button
                onClick={() => setShowDealModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {dealError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{dealError}</span>
              </div>
            )}

            {/* Product Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Product to Promote</label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  setSelectedProduct(p || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-medium"
              >
                {products
                  .filter((p) => p.approvalStatus === 'approved')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₦{p.price.toLocaleString()}) {p.isDealOfDay ? '🔥 [Active Deal]' : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Choose Promotion Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDealDurationDays(days)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      dealDurationDays === days
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDealPaymentMethod('wallet')}
                  className={`p-3 text-left rounded-xl border transition-all space-y-1 ${
                    dealPaymentMethod === 'wallet'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Vendor Wallet</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bal: ₦{(profile?.walletBalance || 0).toLocaleString()}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDealPaymentMethod('paystack')}
                  className={`p-3 text-left rounded-xl border transition-all space-y-1 ${
                    dealPaymentMethod === 'paystack'
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-blue-700" />
                      <span>Paystack Gateway</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">Card, Transfer & USSD</div>
                </button>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Daily Promotion Rate:</span>
                <span className="font-semibold text-slate-900">₦{dealPricePerDay.toLocaleString()} / day</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Selected Duration:</span>
                <span className="font-semibold text-slate-900">{dealDurationDays} Days</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Total Amount Due:</span>
                <span className="text-emerald-800 font-black text-base">
                  ₦{(dealDurationDays * dealPricePerDay).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDealModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromoteDeal}
                disabled={submittingDeal || !selectedProduct}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {submittingDeal ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Pay ₦{(dealDurationDays * dealPricePerDay).toLocaleString()} & Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
