'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Send,
  Mail,
  Flame,
  Users,
  Store,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  Clock,
  Eye,
  RefreshCw,
  ExternalLink,
  Search,
  Tag,
  ArrowRight,
  UserCheck,
  Megaphone,
  LayoutGrid,
  Star,
  Check,
  X,
  Plus,
  SlidersHorizontal,
  Building2,
  Phone,
  MapPin,
  CheckSquare,
  Square,
} from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import {
  getAudienceRecipientsAction,
  getMarketplaceProductsForPromotionAction,
  sendBroadcastCampaignAction,
  getCampaignHistoryAction,
  getAllCustomersForAudienceAction,
  getAllVendorsForAudienceAction,
  CampaignAudience,
  CampaignType,
  CampaignHistoryRecord,
  CampaignCustomerRecord,
  CampaignVendorRecord,
} from '@/actions/campaigns';
import {
  getAllMarketplaceDealsAction,
  toggleProductDealAction,
  MarketplaceDealRecord,
} from '@/actions/products';
import { getPlatformSettingsAction, savePlatformSettingsAction } from '@/actions/settings';
import { CampaignEmailTemplateId } from '@/lib/email/mailer';

interface EmailTemplateOption {
  id: CampaignEmailTemplateId;
  name: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  recommended: string;
  accentColor: string;
  borderColor: string;
  bgLight: string;
}

const EMAIL_TEMPLATES: EmailTemplateOption[] = [
  {
    id: 'multi_product_showcase',
    name: 'Multi-Product Showcase Grid',
    badge: '🛍️ Catalog Grid',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    tagline: 'Responsive 2-column catalog grid with photos, prices & Buy buttons',
    description: 'Feature multiple products side-by-side with photos, prices, compare-at discounts, and direct checkout links.',
    recommended: 'Best for 2 - 8 Products',
    accentColor: '#164E2E',
    borderColor: 'border-emerald-600',
    bgLight: 'bg-emerald-50/60',
  },
  {
    id: 'hero_deal_grid',
    name: 'Hero Deal + Supporting Grid',
    badge: '⭐ Spotlight Deal',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    tagline: '1 prominent spotlight hero deal + supporting deals grid below',
    description: 'Lead with a star discounted product in a large showcase card, followed by additional recommended deals.',
    recommended: 'Best for 1 Star Deal + Extras',
    accentColor: '#D97706',
    borderColor: 'border-amber-600',
    bgLight: 'bg-amber-50/60',
  },
  {
    id: 'flash_sale_flyer',
    name: 'Flash Sale Urgent Flyer',
    badge: '⚡ Limited Time',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    tagline: 'High-urgency fiery banner with countdown styling & flash discounts',
    description: 'Drive immediate impulse purchases with prominent red discount tags, urgency badges, and quick-claim CTAs.',
    recommended: 'Best for Weekend & Flash Sales',
    accentColor: '#DC2626',
    borderColor: 'border-rose-600',
    bgLight: 'bg-rose-50/60',
  },
  {
    id: 'community_newsletter',
    name: 'Community Newsletter Digest',
    badge: '📰 Editorial Digest',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    tagline: 'Editorial layout with announcements, stories & curated product shelf',
    description: 'Connect with community members through editorial updates, market gossip, farmers news, and trending picks.',
    recommended: 'Best for News & Stories',
    accentColor: '#2563EB',
    borderColor: 'border-blue-600',
    bgLight: 'bg-blue-50/60',
  },
  {
    id: 'official_letterhead',
    name: 'Official Administrative Letterhead',
    badge: '🏛️ Platform Memo',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    tagline: 'Formal administrative memorandum with official seal & signature block',
    description: 'Dispatch official communiqués, escrow policy updates, and merchant guidelines with prestigious styling.',
    recommended: 'Best for Policy & Notices',
    accentColor: '#1E293B',
    borderColor: 'border-slate-700',
    bgLight: 'bg-slate-50',
  },
];

export default function AdminMarketingPage() {
  const [activeMainTab, setActiveMainTab] = useState<'broadcast' | 'history' | 'deals'>('broadcast');

  // Broadcast Form State
  const [campaignType, setCampaignType] = useState<CampaignType>('product_promotion');
  const [templateId, setTemplateId] = useState<CampaignEmailTemplateId>('multi_product_showcase');
  const [audience, setAudience] = useState<CampaignAudience>('all');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [subject, setSubject] = useState('🔥 Top Marketplace Deals This Week in Omoku & Egi!');
  const [headline, setHeadline] = useState('Exclusive Handpicked Offers for Our Community');
  const [preheader, setPreheader] = useState('Shop verified merchant products with fast local delivery across ONELGA.');
  const [bodyHtml, setBodyHtml] = useState(
    '<p>Hello,</p><p>We are delighted to feature this week’s customer favorites from verified merchants across Omoku Central Market, Egi, and Obrikom. Every purchase is 100% protected by Paystack Escrow—funds are released only after you safely receive your goods!</p>'
  );
  const [ctaText, setCtaText] = useState('Explore Deals on Storefront');
  const [ctaUrl, setCtaUrl] = useState('https://ogbamarketplace.com.ng');

  // Customer & Vendor Directories State for Granular Targeting
  const [allCustomers, setAllCustomers] = useState<CampaignCustomerRecord[]>([]);
  const [allVendors, setAllVendors] = useState<CampaignVendorRecord[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [loadingDirectories, setLoadingDirectories] = useState(false);

  // Multi-Product Selection
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [heroProductId, setHeroProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Audience Count
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [audienceSample, setAudienceSample] = useState<any[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(false);

  // Sending & Modals
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // History Tab State
  const [campaignHistory, setCampaignHistory] = useState<CampaignHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Deals Tab State (Deals of the Day management)
  const [activeDeals, setActiveDeals] = useState<MarketplaceDealRecord[]>([]);
  const [pastDeals, setPastDeals] = useState<MarketplaceDealRecord[]>([]);
  const [totalDealsRevenue, setTotalDealsRevenue] = useState(0);
  const [dailyRate, setDailyRate] = useState('500');
  const [savingRate, setSavingRate] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Initial Load of Products, Directories and Platform Settings
  useEffect(() => {
    const initData = async () => {
      try {
        setLoadingDirectories(true);
        const [prods, hist, dealsData, settings, custs, vends] = await Promise.all([
          getMarketplaceProductsForPromotionAction(),
          getCampaignHistoryAction(),
          getAllMarketplaceDealsAction(),
          getPlatformSettingsAction(),
          getAllCustomersForAudienceAction(),
          getAllVendorsForAudienceAction(),
        ]);

        setMarketplaceProducts(prods);
        setCampaignHistory(hist);
        setActiveDeals(dealsData.activeDeals);
        setPastDeals(dealsData.pastDeals);
        setTotalDealsRevenue(dealsData.totalRevenue);
        setDailyRate(settings.dealOfDayPricePerDay || '500');
        setAllCustomers(custs);
        setAllVendors(vends);
        setLoadingDirectories(false);

        // Select top 3 products by default for rich multi-product preview
        if (prods.length > 0) {
          const initialSelection = prods.slice(0, 3).map((p) => p.id);
          setSelectedProductIds(initialSelection);
          setHeroProductId(initialSelection[0]);
        }
      } catch (e) {
        console.error('Error initializing marketing dashboard:', e);
        setLoadingDirectories(false);
      }
    };
    initData();
  }, []);

  // 2. Fetch Audience Recipients on Audience Switch or Selection Changes
  useEffect(() => {
    const fetchAudience = async () => {
      setLoadingAudience(true);
      try {
        const res = await getAudienceRecipientsAction({
          audience,
          customEmail,
          customName,
          selectedCustomerIds,
          selectedVendorIds,
        });
        setAudienceCount(res.count);
        setAudienceSample(res.sample);
      } catch (e) {
        console.error('Error querying audience:', e);
      } finally {
        setLoadingAudience(false);
      }
    };
    fetchAudience();
  }, [audience, customEmail, customName, selectedCustomerIds, selectedVendorIds]);

  // Customer Selection Handlers
  const filteredCustomers = allCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phoneNumber && c.phoneNumber.includes(q)) ||
      (c.area && c.area.toLowerCase().includes(q))
    );
  });

  const toggleCustomer = (customerId: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  const selectAllFilteredCustomers = () => {
    const ids = filteredCustomers.map((c) => c.id);
    setSelectedCustomerIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearCustomerSelection = () => {
    setSelectedCustomerIds([]);
  };

  // Vendor Selection Handlers
  const filteredVendors = allVendors.filter((v) => {
    if (!vendorSearch.trim()) return true;
    const q = vendorSearch.toLowerCase();
    return (
      v.businessName.toLowerCase().includes(q) ||
      v.marketLocation.toLowerCase().includes(q) ||
      v.ownerName.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q)
    );
  });

  const toggleVendor = (vendorId: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const selectAllFilteredVendors = () => {
    const ids = filteredVendors.map((v) => v.id);
    setSelectedVendorIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearVendorSelection = () => {
    setSelectedVendorIds([]);
  };

  const getAudienceLabel = (aud: CampaignAudience) => {
    switch (aud) {
      case 'all':
        return 'All Registered Members';
      case 'customers':
        return `All Registered Customers (${allCustomers.length})`;
      case 'vendors':
        return `All Registered Vendors (${allVendors.length})`;
      case 'select_customers':
        return `${selectedCustomerIds.length} Selected Customer(s)`;
      case 'select_vendors':
        return `${selectedVendorIds.length} Selected Vendor(s)`;
      case 'custom':
        return customName ? `Professional Mailing (${customName})` : 'Direct / Professional Mailing';
      default:
        return aud;
    }
  };

  // Product Selection Handlers
  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        const updated = prev.filter((id) => id !== productId);
        if (heroProductId === productId) {
          setHeroProductId(updated[0] || '');
        }
        return updated;
      } else {
        const updated = [...prev, productId];
        if (!heroProductId) {
          setHeroProductId(productId);
        }
        return updated;
      }
    });
  };

  const selectTopN = (count: number) => {
    const top = filteredProducts.slice(0, count).map((p) => p.id);
    setSelectedProductIds(top);
    if (top.length > 0) setHeroProductId(top[0]);
  };

  const selectAllFiltered = () => {
    const allIds = filteredProducts.map((p) => p.id);
    setSelectedProductIds(allIds);
    if (allIds.length > 0) setHeroProductId(allIds[0]);
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
    setHeroProductId('');
  };

  // Change Template Handler
  const handleTemplateSelect = (tplId: CampaignEmailTemplateId) => {
    setTemplateId(tplId);
    if (tplId === 'multi_product_showcase') {
      setSubject('🛍️ Discover This Week’s Featured Products on Ogba Marketplace!');
      setHeadline('Handpicked Deals From Verified ONELGA Merchants');
      setPreheader('Browse quality groceries, electronics, and daily essentials with fast local doorstep delivery.');
      setCtaText('Shop All Marketplace Items');
      setCtaUrl('https://ogbamarketplace.com.ng');
    } else if (tplId === 'hero_deal_grid') {
      const heroProd = marketplaceProducts.find((p) => p.id === heroProductId) || marketplaceProducts[0];
      setSubject(heroProd ? `⭐ Spotlight Deal: ${heroProd.title} on Ogba Marketplace!` : '⭐ Spotlight Deal of the Week!');
      setHeadline(heroProd ? `Featured Spotlight: ${heroProd.title}` : 'Exclusive Headline Marketplace Deal');
      setPreheader('Save big on verified local merchant stock backed by Paystack escrow protection.');
      setCtaText('Order Spotlight Deal Now');
      setCtaUrl(heroProd ? `https://ogbamarketplace.com.ng/products/${heroProd.slug || heroProd.id}` : 'https://ogbamarketplace.com.ng');
    } else if (tplId === 'flash_sale_flyer') {
      setSubject('⚡ 24-HOUR FLASH SALE: Big Discounts Across Omoku & Egi!');
      setHeadline('Weekend Flash Deals • Limited Stock Available');
      setPreheader('Verified local sellers have slashed prices for the next 24 to 48 hours. Grab yours before it sells out!');
      setCtaText('Shop Flash Deals Before Stock Depletes');
      setCtaUrl('https://ogbamarketplace.com.ng/deals');
    } else if (tplId === 'community_newsletter') {
      setSubject('📰 Ogba Community Dispatch: Market Updates, Fresh Produce & Rider Service');
      setHeadline('Community News, Local Harvests & Merchant Highlights');
      setPreheader('Read what is happening across Omoku Central Market and Egi delivery corridors this week.');
      setCtaText('Read More on Ogba Marketplace');
      setCtaUrl('https://ogbamarketplace.com.ng');
    } else if (tplId === 'official_letterhead') {
      setSubject('🏛️ Official Platform Notice: Community Guidelines & Escrow Settlement');
      setHeadline('Official Communiqué & Policy Notice');
      setPreheader('Formal communication regarding seller verification, buyer protection, and local dispatch standards.');
      setCtaText('Review Community Guidelines');
      setCtaUrl('https://ogbamarketplace.com.ng/about');
    }
  };

  // Filter products by search & category
  const categoriesList = ['all', ...Array.from(new Set(marketplaceProducts.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = marketplaceProducts.filter((p) => {
    const matchSearch =
      !productSearch ||
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Selected Products objects in order
  const selectedProducts = marketplaceProducts.filter((p) => selectedProductIds.includes(p.id));

  // Order with hero item first
  const orderedSelectedProducts = [...selectedProducts].sort((a, b) => {
    if (a.id === heroProductId) return -1;
    if (b.id === heroProductId) return 1;
    return 0;
  });

  // Dispatch Broadcast
  const handleSendCampaign = async () => {
    if (!subject.trim() || !headline.trim() || !bodyHtml.trim()) {
      showToast('Please fill in Subject, Headline, and Message Body.', 'error');
      return;
    }

    if (audienceCount === 0) {
      showToast('No valid recipients found for this audience segment.', 'error');
      return;
    }

    setIsSending(true);
    setShowConfirmModal(false);

    try {
      const productPayloads = orderedSelectedProducts.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        imageUrl: p.imageUrl,
        url: `https://ogbamarketplace.com.ng/products/${p.slug || p.id}`,
        vendorName: p.vendorName,
        vendorLocation: p.vendorLocation,
        category: p.category,
        descriptionSnippet: p.descriptionSnippet,
      }));

      const res = await sendBroadcastCampaignAction({
        campaignType,
        templateId,
        audience,
        customEmail,
        customName,
        selectedCustomerIds,
        selectedVendorIds,
        subject,
        headline,
        preheader,
        bodyHtml,
        products: productPayloads,
        ctaText,
        ctaUrl: ctaUrl || 'https://ogbamarketplace.com.ng',
      });

      if (res.success) {
        showToast(
          res.simulated
            ? `✅ Campaign simulated for ${res.count} recipient(s) (Brevo API key in dev mode). Check console log!`
            : `🚀 Campaign successfully dispatched to ${res.count} recipient(s)!`
        );
        const newHistory = await getCampaignHistoryAction();
        setCampaignHistory(newHistory);
      } else {
        showToast(res.error || 'Failed to send broadcast campaign.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing email broadcast.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Save Deals Rate
  const handleSaveRate = async () => {
    const rateNum = Number(dailyRate);
    if (isNaN(rateNum) || rateNum < 100) {
      showToast('Daily rate must be at least ₦100.', 'error');
      return;
    }
    setSavingRate(true);
    try {
      const res = await savePlatformSettingsAction({
        dealOfDayPricePerDay: String(rateNum),
      });
      if (res.success) {
        showToast(`✅ Deals of the Day daily rate updated to ₦${rateNum.toLocaleString()} / day!`);
      } else {
        showToast(res.error || 'Failed to save rate', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error saving settings', 'error');
    } finally {
      setSavingRate(false);
    }
  };

  const handleToggleDeal = async (productId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await toggleProductDealAction({ id: productId, isDealOfDay: nextStatus });
      if (res.success) {
        showToast(nextStatus ? 'Deal activated on product!' : 'Deal removed from product.');
        const updated = await getAllMarketplaceDealsAction();
        setActiveDeals(updated.activeDeals);
        setPastDeals(updated.pastDeals);
      } else {
        showToast(res.error || 'Failed to toggle deal status', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating deal', 'error');
    }
  };

  const currentTemplate = EMAIL_TEMPLATES.find((t) => t.id === templateId) || EMAIL_TEMPLATES[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-bold border transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-700'
              : 'bg-rose-950 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white border border-emerald-800/40 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Megaphone className="w-3.5 h-3.5 fill-emerald-400" />
              <span>MARKETING & PROMOTIONAL EMAIL BROADCASTER</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Campaigns & Email Marketing
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Broadcast high-converting promotional emails with multiple products, choose from visual responsive templates, highlight marketplace deals, or dispatch official administrative notices to customers and merchants.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Visual Template Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSending || audienceCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Broadcast...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>Broadcast to {audienceCount} Users</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveMainTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'broadcast'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose & Send Broadcast</span>
          </button>

          <button
            onClick={() => setActiveMainTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sent Campaign Logs ({campaignHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab('deals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'deals'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Deals of the Day Settings</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: COMPOSE & SEND BROADCAST
         ========================================================================= */}
      {activeMainTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Campaign Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Step 1: VISUAL EMAIL TEMPLATE SELECTION GALLERY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-emerald-600" />
                    <span>1. Choose Email Template</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a layout to visually structure your email with products, banners, and copy
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentTemplate.badgeColor}`}>
                  {currentTemplate.name}
                </span>
              </div>

              {/* Visual Template Cards Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {EMAIL_TEMPLATES.map((tpl) => {
                  const isSelected = templateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleTemplateSelect(tpl.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left ${
                        isSelected
                          ? `${tpl.borderColor} ${tpl.bgLight} shadow-md ring-2 ring-emerald-500/20`
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${tpl.badgeColor}`}>
                            {tpl.badge}
                          </span>
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Click to use</span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{tpl.name}</h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                          {tpl.recommended}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateSelect(tpl.id);
                            setShowPreviewModal(true);
                          }}
                          className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: TARGET AUDIENCE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>2. Target Audience & Recipient Selection</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose broad segments, pick 1 or specific customers/vendors, or send professional external emails
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {loadingAudience ? 'Counting...' : `${audienceCount} Recipients Ready`}
                  </span>
                </div>
              </div>

              {/* Audience Mode Grid (6 Options) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    key: 'all',
                    label: 'All Members',
                    sub: 'Buyers & Vendors',
                    icon: Users,
                    countBadge: `${allCustomers.length + allVendors.length} total`,
                  },
                  {
                    key: 'customers',
                    label: 'All Customers',
                    sub: 'Every registered buyer',
                    icon: ShoppingBag,
                    countBadge: `${allCustomers.length} buyers`,
                  },
                  {
                    key: 'vendors',
                    label: 'All Vendors',
                    sub: 'Every merchant stall',
                    icon: Store,
                    countBadge: `${allVendors.length} stores`,
                  },
                  {
                    key: 'select_customers',
                    label: 'Pick Customer(s)',
                    sub: 'Select 1 or specific buyers',
                    icon: UserCheck,
                    countBadge: selectedCustomerIds.length > 0 ? `${selectedCustomerIds.length} selected` : 'Pick',
                  },
                  {
                    key: 'select_vendors',
                    label: 'Pick Vendor(s)',
                    sub: 'Select 1 or specific vendors',
                    icon: Building2,
                    countBadge: selectedVendorIds.length > 0 ? `${selectedVendorIds.length} selected` : 'Pick',
                  },
                  {
                    key: 'custom',
                    label: 'Direct / Professional',
                    sub: 'External or official contact',
                    icon: Mail,
                    countBadge: 'Direct',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = audience === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAudience(item.key as CampaignAudience)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSel
                          ? 'border-emerald-600 bg-emerald-50/70 font-bold text-slate-950 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSel ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          isSel ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.countBadge}
                        </span>
                      </div>
                      <div className="text-xs font-bold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.sub}</div>
                    </button>
                  );
                })}
              </div>

              {/* SPECIFIC CUSTOMERS PICKER */}
              {audience === 'select_customers' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Registered Customer Directory</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Check exactly 1 customer to email them privately, or check multiple customers for a targeted set.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFilteredCustomers}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer"
                      >
                        Select All ({filteredCustomers.length})
                      </button>
                      {selectedCustomerIds.length > 0 && (
                        <button
                          type="button"
                          onClick={clearCustomerSelection}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
                        >
                          Clear ({selectedCustomerIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customer by name, email, phone number, or area (e.g. Omoku, Egi)..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-emerald-600 font-medium"
                    />
                  </div>

                  {/* Scrollable Customer List */}
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {loadingDirectories ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading customer directory...</span>
                      </div>
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((c) => {
                        const isChecked = selectedCustomerIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleCustomer(c.id)}
                            className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                                : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                                {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{c.fullName || 'Valued Customer'}</span>
                                  {isChecked && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-emerald-200 text-emerald-800">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 truncate">
                                  {c.email}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                              {c.phoneNumber && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{c.phoneNumber}</span>
                                </span>
                              )}
                              {c.area && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{c.area}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No customers matched your search query.
                      </div>
                    )}
                  </div>

                  {selectedCustomerIds.length === 0 && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      ⚠️ Please click on at least 1 customer above to include them in this broadcast.
                    </p>
                  )}
                </div>
              )}

              {/* SPECIFIC VENDORS PICKER */}
              {audience === 'select_vendors' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <span>Registered Vendor Directory</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Check 1 specific vendor store or select a group of vendors across Omoku, Egi, or Obrikom.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllFilteredVendors}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer"
                      >
                        Select All ({filteredVendors.length})
                      </button>
                      {selectedVendorIds.length > 0 && (
                        <button
                          type="button"
                          onClick={clearVendorSelection}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
                        >
                          Clear ({selectedVendorIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vendor Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search vendor by store name, market location, owner name, or email..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-emerald-600 font-medium"
                    />
                  </div>

                  {/* Scrollable Vendor List */}
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                    {loadingDirectories ? (
                      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading vendor directory...</span>
                      </div>
                    ) : filteredVendors.length > 0 ? (
                      filteredVendors.map((v) => {
                        const isChecked = selectedVendorIds.includes(v.id);
                        return (
                          <div
                            key={v.id}
                            onClick={() => toggleVendor(v.id)}
                            className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                                : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-xs shrink-0">
                                <Store className="w-4 h-4 text-emerald-700" />
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  <span>{v.businessName}</span>
                                  {v.isVerified && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800">
                                      Verified
                                    </span>
                                  )}
                                  {isChecked && (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm bg-emerald-200 text-emerald-800">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <span>Owner: <strong>{v.ownerName}</strong></span>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-mono">{v.email}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                              <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{v.marketLocation || 'Omoku, Rivers State'}</span>
                              </span>
                              {v.phoneNumber && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{v.phoneNumber}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No vendors matched your search query.
                      </div>
                    )}
                  </div>

                  {selectedVendorIds.length === 0 && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      ⚠️ Please click on at least 1 vendor above to include them in this broadcast.
                    </p>
                  )}
                </div>
              )}

              {/* DIRECT / PROFESSIONAL EXTERNAL DISPATCH */}
              {audience === 'custom' && (
                <div className="p-4 bg-gradient-to-br from-amber-50/70 to-slate-50 border border-amber-200 rounded-xl space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-amber-700" />
                        <span>Direct & Professional External Dispatch</span>
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Dispatch emails to individual contacts, business partners, or official government stakeholders using the platform mailer.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                      Private & Isolated
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Recipient Name / Designation (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Ngozi Nwosu or Ministry of Commerce"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-hidden focus:border-amber-600 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Recipient Email Address(es) *</label>
                      <input
                        type="text"
                        placeholder="e.g. partner@example.com (or comma-separated list)"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-hidden focus:border-amber-600 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div className="text-[11px] text-slate-700 leading-snug">
                      🏛️ Sending a formal administrative memo or official stakeholder letter? Switch to our <strong>Official Administrative Letterhead</strong> template.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect('official_letterhead')}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap shrink-0 transition-all cursor-pointer"
                    >
                      Use Official Letterhead
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: MULTI-PRODUCT SELECTOR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>3. Select Products to Feature (Choose Multiple)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select 1 to 8+ products to automatically embed in the responsive email catalog grid
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {selectedProductIds.length} Selected
                  </span>
                  {selectedProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Products Chips Bar */}
              {selectedProducts.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>Products in this broadcast:</span>
                    {templateId === 'hero_deal_grid' && (
                      <span className="text-amber-700 text-[10px]">★ Click a star to set as Primary Hero</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {orderedSelectedProducts.map((p) => {
                      const isHero = p.id === heroProductId;
                      return (
                        <div
                          key={p.id}
                          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            isHero && templateId === 'hero_deal_grid'
                              ? 'bg-amber-100 border-amber-300 text-amber-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="w-5 h-5 rounded bg-slate-100 overflow-hidden relative shrink-0">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                            ) : (
                              <span className="text-[8px] text-slate-400">Pic</span>
                            )}
                          </div>
                          <span className="max-w-[130px] truncate font-bold">{p.title}</span>
                          <span className="text-emerald-700 font-black">₦{p.price.toLocaleString()}</span>

                          {templateId === 'hero_deal_grid' && (
                            <button
                              type="button"
                              onClick={() => setHeroProductId(p.id)}
                              title={isHero ? 'Current Hero Product' : 'Set as Hero Product'}
                              className={`p-0.5 rounded cursor-pointer ${
                                isHero ? 'text-amber-600' : 'text-slate-300 hover:text-amber-500'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isHero ? 'fill-amber-500' : ''}`} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleProduct(p.id)}
                            className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by product name, vendor, or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden font-semibold text-slate-700 capitalize"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => selectTopN(4)}
                    className="px-2.5 py-2 text-[11px] font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Select Top 4
                  </button>
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="px-2.5 py-2 text-[11px] font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Select All ({filteredProducts.length})
                  </button>
                </div>
              </div>

              {/* Scrollable Products List with Checkboxes */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    const isHero = p.id === heroProductId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          isChecked ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 shrink-0 cursor-pointer"
                          />

                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-300 font-bold">
                                No Pic
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600">
                                {p.category}
                              </span>
                              {isHero && templateId === 'hero_deal_grid' && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 border border-amber-200">
                                  ★ Primary Hero
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{p.title}</h4>
                            <div className="text-[11px] text-slate-500 truncate">
                              Vendor: <strong>{p.vendorName}</strong> ({p.vendorLocation})
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-800">
                            ₦{p.price.toLocaleString()}
                          </div>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <div className="text-[10px] text-slate-400 line-through">
                              ₦{p.compareAtPrice.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No products matched your search keyword or category filter.
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: EMAIL COPY & RICH CONTENT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>4. Compose Email Copy</span>
                </h3>
                <p className="text-xs text-slate-500">Subject line, headlines, rich text body, and CTA button</p>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Subject Line *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 🔥 Weekend Special: Save 20% on Fresh Produce in Omoku"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 font-bold text-slate-900 bg-white"
                />
              </div>

              {/* Headline & Preheader */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Headline / Email Title *</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Big Savings This Weekend"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 font-semibold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Preheader (Inbox Snippet)</label>
                  <input
                    type="text"
                    value={preheader}
                    onChange={(e) => setPreheader(e.target.value)}
                    placeholder="Short summary preview visible in Gmail"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white"
                  />
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700">Email Body Message (Rich Text Editor) *</label>
                <RichTextEditor
                  value={bodyHtml}
                  onChange={(c) => setBodyHtml(c)}
                  placeholder="Type your promotional message, details, and bullet points here..."
                  height={280}
                />
              </div>

              {/* Call To Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Call to Action Button Label</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Shop Now"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 font-semibold bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Button Link URL</label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://ogbamarketplace.com.ng/..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-600 bg-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Delivery Overview & Quick Controls */}
          <div className="space-y-6">
            {/* Delivery Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Broadcast Summary</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Chosen Template:</span>
                  <span className="font-bold text-slate-900 text-right">{currentTemplate.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Target Segment:</span>
                  <span className="font-bold text-slate-900 text-right">{getAudienceLabel(audience)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Recipients:</span>
                  <span className="font-black text-emerald-800 text-sm">{audienceCount} Verified Emails</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Featured Products:</span>
                  <span className="font-bold text-slate-900">{selectedProductIds.length} Item(s)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Platform Domain:</span>
                  <span className="font-mono text-emerald-700 font-bold">ogbamarketplace.com.ng</span>
                </div>
              </div>

              {/* Sample Recipients list */}
              {audienceSample.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                  <span className="text-slate-500 font-bold block">Sample Recipients:</span>
                  <ul className="space-y-1 text-slate-700">
                    {audienceSample.map((s, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <span className="truncate max-w-[140px] font-medium">{s.email}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{s.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>Open Live Email Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSending || audienceCount === 0}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast to {audienceCount} Users</span>
                </button>
              </div>
            </div>

            {/* Quick Template Switcher Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 text-white border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Email Template Quick Switch
              </span>
              <p className="text-xs text-slate-300">
                You can switch between any of our 5 official templates anytime before dispatching.
              </p>
              <div className="space-y-1.5">
                {EMAIL_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTemplateSelect(t.id)}
                    className={`w-full p-2 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      templateId === t.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{t.name}</span>
                    {templateId === t.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CAMPAIGN HISTORY & AUDIT LOGS
         ========================================================================= */}
      {activeMainTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Campaign Dispatch Logs</h3>
              <p className="text-xs text-slate-500">History of all promotional and informational emails broadcasted</p>
            </div>
            <button
              onClick={async () => {
                setLoadingHistory(true);
                const h = await getCampaignHistoryAction();
                setCampaignHistory(h);
                setLoadingHistory(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-900 font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-3">Sent At</th>
                  <th className="px-4 py-3">Subject & Headline</th>
                  <th className="px-4 py-3">Template / Format</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaignHistory.length > 0 ? (
                  campaignHistory.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(camp.sentAt).toLocaleString('en-NG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3.5 max-w-[260px]">
                        <div className="font-bold text-slate-900 truncate" title={camp.subject}>
                          {camp.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{camp.headline}</div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                          {camp.templateId ? camp.templateId.replace(/_/g, ' ') : camp.campaignType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 capitalize font-medium text-slate-700">
                        {camp.audience}
                      </td>

                      <td className="px-4 py-3.5 font-black text-slate-900">
                        {camp.recipientCount} sent
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 truncate max-w-[160px]">
                        {camp.productTitle ? (
                          <span title={camp.productTitle}>{camp.productTitle}</span>
                        ) : (
                          <span className="text-slate-300 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {camp.isSimulated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Simulated (Dev)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Delivered ✅
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                      No email campaigns sent yet. Use the "Compose & Send Broadcast" tab to dispatch your first email.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: DEALS OF THE DAY SETTINGS & TRACKER
         ========================================================================= */}
      {activeMainTab === 'deals' && (
        <div className="space-y-6">
          {/* Rate Setting Card & Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Deals Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">₦{totalDealsRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500">Collected from vendor promotions</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Active Deals</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">{activeDeals.length}</div>
              <p className="text-[11px] text-slate-500">Currently pinned on the homepage</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-50/70 to-amber-100/50 rounded-2xl border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-amber-900 text-xs font-black uppercase">
                <span>Set Price / Day (₦)</span>
                <Settings className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₦</span>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm font-black text-slate-900 bg-white rounded-xl border border-amber-300 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
                <button
                  onClick={handleSaveRate}
                  disabled={savingRate}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {savingRate ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="text-[10px] text-amber-800">Vendors pay this daily rate for homepage promotion.</p>
            </div>
          </div>

          {/* Active Deals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Current Deals of the Day ({activeDeals.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Amount Paid</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDeals.length > 0 ? (
                    activeDeals.map((d) => (
                      <tr key={d.productId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{d.productTitle}</td>
                        <td className="px-4 py-3.5 text-slate-700">{d.vendorStoreName}</td>
                        <td className="px-4 py-3.5 font-black text-emerald-800">₦{d.dealAmountPaid.toLocaleString()}</td>
                        <td className="px-4 py-3.5 capitalize">{d.dealPaymentMethod}</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-amber-900">
                          {new Date(d.dealExpiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleDeal(d.productId, true)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                          >
                            End Deal
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                        No active deal promotions at this moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LIVE EMAIL PREVIEW
         ========================================================================= */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Visual Live Email Preview</h3>
                  <p className="text-xs text-slate-500">
                    Template: <strong className="text-emerald-700">{currentTemplate.name}</strong> • Domain: <code className="text-slate-800">ogbamarketplace.com.ng</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Template Selector Inside Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {EMAIL_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-bold transition-all cursor-pointer ${
                    templateId === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.badge}
                </button>
              ))}
            </div>

            {/* Email Canvas Preview */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 p-4">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden max-w-lg mx-auto">
                {/* Header */}
                <div className="bg-[#164E2E] p-5 text-center text-white border-b-4 border-[#10B981]">
                  <h2 className="text-lg font-black tracking-widest uppercase m-0">OGBA MARKET PLACE</h2>
                  <p className="text-[11px] text-emerald-200 mt-1 m-0">Connecting Omoku, Egi & ONELGA Regional Commerce</p>
                </div>

                {/* Body Canvas */}
                <div className="p-6 space-y-4">
                  {/* Template Badge */}
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentTemplate.badgeColor}`}>
                    {currentTemplate.badge}
                  </span>

                  {/* FLASH SALE HERO BANNER (if flash sale template) */}
                  {templateId === 'flash_sale_flyer' && (
                    <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl p-4 text-center shadow-md space-y-1">
                      <span className="inline-block bg-yellow-200 text-yellow-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ⚡ 24-48 HOUR FLASH SALE
                      </span>
                      <h3 className="text-base font-black text-white">{headline}</h3>
                      <p className="text-xs text-red-100">{preheader || 'Unbeatable prices on verified Omoku goods!'}</p>
                    </div>
                  )}

                  {/* Standard Headline & Preheader (for non-flash templates) */}
                  {templateId !== 'flash_sale_flyer' && (
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">{headline}</h3>
                      {preheader && <p className="text-xs text-slate-500">{preheader}</p>}
                    </div>
                  )}

                  {/* Body Content from Rich Editor */}
                  <div
                    className="text-xs text-slate-700 leading-relaxed space-y-2 border-t border-slate-100 pt-3"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />

                  {/* HERO PRODUCT SPOTLIGHT (if hero_deal_grid template and products exist) */}
                  {templateId === 'hero_deal_grid' && orderedSelectedProducts.length > 0 && (
                    <div className="border-2 border-emerald-500 rounded-xl overflow-hidden bg-slate-50 shadow-sm mt-4">
                      <div className="bg-emerald-900 text-emerald-100 text-[10px] font-extrabold px-3 py-1 uppercase tracking-wider">
                        🔥 Featured Spotlight Deal of the Week
                      </div>
                      <div className="p-3.5 flex gap-3.5 items-start">
                        <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden relative shrink-0">
                          {orderedSelectedProducts[0].imageUrl ? (
                            <Image src={orderedSelectedProducts[0].imageUrl} alt={orderedSelectedProducts[0].title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">No Pic</div>
                          )}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                            {orderedSelectedProducts[0].category}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{orderedSelectedProducts[0].title}</h4>
                          <div className="text-sm font-black text-emerald-800">
                            ₦{orderedSelectedProducts[0].price.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Merchant: <strong>{orderedSelectedProducts[0].vendorName}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-100/70 border-t border-slate-200 text-center">
                        <span className="inline-block px-4 py-1.5 bg-[#164E2E] text-white text-xs font-bold rounded-lg shadow-xs">
                          {ctaText || 'Buy Spotlight Deal'} &rarr;
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MULTI-PRODUCT GRID (Catalog, Flash, or Supporting Grid) */}
                  {orderedSelectedProducts.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                        <span>
                          {templateId === 'hero_deal_grid'
                            ? `More Recommended Deals (${orderedSelectedProducts.slice(1).length})`
                            : templateId === 'flash_sale_flyer'
                            ? `🔥 Flash Deals (${orderedSelectedProducts.length})`
                            : `🛍️ Featured Selection (${orderedSelectedProducts.length} Items)`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Backed by Paystack Escrow</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {(templateId === 'hero_deal_grid' ? orderedSelectedProducts.slice(1) : orderedSelectedProducts).map((p) => (
                          <div
                            key={p.id}
                            className="bg-white rounded-xl border border-slate-200 p-2.5 space-y-1.5 text-left shadow-2xs"
                          >
                            <div className="w-full h-24 rounded-lg bg-slate-100 border border-slate-100 overflow-hidden relative">
                              {p.imageUrl ? (
                                <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">No Pic</div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase block w-fit">
                              {p.category}
                            </span>
                            <h5 className="text-[11px] font-bold text-slate-900 line-clamp-1">{p.title}</h5>
                            <div className="text-xs font-black text-emerald-800">
                              ₦{p.price.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              By {p.vendorName}
                            </div>
                            <div className="pt-1">
                              <span className={`block w-full py-1 text-[10px] font-bold text-white text-center rounded ${
                                templateId === 'flash_sale_flyer' ? 'bg-red-600' : 'bg-[#164E2E]'
                              }`}>
                                {templateId === 'flash_sale_flyer' ? 'Claim Deal' : 'Buy Now'} &rarr;
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OFFICIAL MEMORANDUM SIGN-OFF (if official_letterhead template) */}
                  {templateId === 'official_letterhead' && (
                    <div className="pt-4 border-t-2 border-slate-300 text-[11px] text-slate-600 space-y-1">
                      <strong className="text-slate-900 block uppercase font-black">
                        Office of Administration & Escrow Verification
                      </strong>
                      <div>OGBA MARKET PLACE • Omoku, Rivers State, Nigeria</div>
                      <div className="text-[10px] text-slate-400">
                        Official Digital Communication • All Platform Escrow Terms Apply
                      </div>
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  {ctaText && templateId !== 'hero_deal_grid' && (
                    <div className="text-center pt-3">
                      <span className="inline-block px-5 py-2.5 bg-[#164E2E] text-white text-xs font-black rounded-xl shadow-xs">
                        {ctaText} &rarr;
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center text-[10px] text-slate-400 border-t border-slate-200 leading-relaxed">
                  OGBA MARKET PLACE • Official Hyperlocal E-commerce Hub<br />
                  Omoku Central Market & Egi Logistics Hub • Rivers State, Nigeria<br />
                  Inquiries & Escrow: <span className="text-emerald-700 font-bold">support@ogbamarketplace.com.ng</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">
                Looks good? Click Close to broadcast or send a test email.
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM BROADCAST DISPATCH
         ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Confirm Email Broadcast</h3>
                <p className="text-xs text-slate-500">Dispatch message to selected audience</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Template:</span>
                <span className="font-bold text-slate-900">{currentTemplate.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Audience:</span>
                <span className="font-bold text-slate-900 text-right">{getAudienceLabel(audience)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipients Count:</span>
                <span className="font-black text-emerald-700 text-sm">{audienceCount} Verified Addresses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Embedded Products:</span>
                <span className="font-bold text-slate-900">{selectedProductIds.length} Products</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender Domain:</span>
                <span className="font-mono text-emerald-700 font-bold">ogbamarketplace.com.ng</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500 block">Subject:</span>
                <span className="font-bold text-slate-900">{subject}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Emails will be sent through the centralized Brevo platform mailer. If Brevo API key is in development mode, delivery will be simulated and logged safely.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={isSending}
                className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Broadcast</span>
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
