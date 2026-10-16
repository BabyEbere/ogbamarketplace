'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  Settings,
  Shield,
  Percent,
  Truck,
  Mail,
  Save,
  CheckCircle,
  BellRing,
  UserPlus,
  KeyRound,
  Trash2,
  Lock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Cloud,
  Database,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { 
  getAdminAccountsAction, 
  createAdminAccountAction, 
  changeAdminPasswordAction, 
  deleteAdminAccountAction,
  ControlAdmin 
} from '@/actions/admin-auth';
import { getAdminSession } from '@/components/control-omp/AdminAuthGuard';
import { 
  getAllCommunitiesAdminAction, 
  addCommunityAction, 
  toggleCommunityStatusAction, 
  deleteCommunityAction,
  CommunityRecord 
} from '@/actions/communities';
import { 
  getPlatformSettingsAction, 
  savePlatformSettingsAction, 
  PlatformConfig 
} from '@/actions/settings';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'admins' | 'communities' | 'brevo' | 'r2' | 'security' | 'platform' | 'badge'>('communities');
  const [adminList, setAdminList] = useState<ControlAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('pookietechdigitals@gmail.com');

  // Add Admin State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('operations_manager');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Platform Rates State
  const [commissionRate, setCommissionRate] = useState('7.5');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('1000');
  const [platformSaved, setPlatformSaved] = useState(false);

  // Monetary Verification Badge State (100% DB)
  const [badgePrice, setBadgePrice] = useState('15000');
  const [badgePeriod, setBadgePeriod] = useState('Annual (12 Months)');
  const [badgeRequirements, setBadgeRequirements] = useState(
    '1. Active approved vendor store in ONELGA\n2. Valid National ID (NIN) or CAC registration\n3. Minimum 5 successful deliveries with 4.5+ star rating'
  );
  const [badgeInstructions, setBadgeInstructions] = useState(
    'Pay badge verification fee into Ogba Marketplace designated settlement account or Paystack badge gateway.'
  );
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeSaved, setBadgeSaved] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  // Communities State (100% DB)
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityLga, setNewCommunityLga] = useState('Ogba/Egbema/Ndoni');
  const [communityActionLoading, setCommunityActionLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communitySuccess, setCommunitySuccess] = useState<string | null>(null);

  // Brevo Settings State (100% DB)
  const [brevoApiKey, setBrevoApiKey] = useState('');
  const [brevoSenderEmail, setBrevoSenderEmail] = useState('support@ogbamarketplace.com');
  const [brevoSenderName, setBrevoSenderName] = useState('OGBA MARKET PLACE');
  const [brevoLoading, setBrevoLoading] = useState(false);
  const [brevoSaved, setBrevoSaved] = useState(false);
  const [brevoError, setBrevoError] = useState<string | null>(null);

  // Cloudflare R2 Storage State (100% DB)
  const [r2AccountId, setR2AccountId] = useState('');
  const [r2AccessKeyId, setR2AccessKeyId] = useState('');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState('');
  const [r2BucketName, setR2BucketName] = useState('ogbamarketplace');
  const [r2PublicDomain, setR2PublicDomain] = useState('');
  const [r2Loading, setR2Loading] = useState(false);
  const [r2Saved, setR2Saved] = useState(false);
  const [r2Error, setR2Error] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (session && session.email) {
      setCurrentAdminEmail(session.email);
    }
    loadAdminList();
    loadCommunities();
    loadSettings();
  }, []);

  async function loadAdminList() {
    try {
      setLoadingAdmins(true);
      const list = await getAdminAccountsAction();
      setAdminList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function loadCommunities() {
    try {
      setLoadingCommunities(true);
      const data = await getAllCommunitiesAdminAction();
      setCommunities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCommunities(false);
    }
  }

  async function loadSettings() {
    try {
      const config = await getPlatformSettingsAction();
      setBrevoApiKey(config.brevoApiKey);
      setBrevoSenderEmail(config.brevoSenderEmail);
      setBrevoSenderName(config.brevoSenderName);
      setCommissionRate(config.commissionRate);
      setBaseDeliveryFee(config.baseDeliveryFee);
      setR2AccountId(config.r2AccountId);
      setR2AccessKeyId(config.r2AccessKeyId);
      setR2SecretAccessKey(config.r2SecretAccessKey);
      setR2BucketName(config.r2BucketName || 'ogbamarketplace');
      setR2PublicDomain(config.r2PublicDomain || '');
      setBadgePrice(config.verificationBadgePrice || '15000');
      setBadgePeriod(config.verificationBadgePeriod || 'Annual (12 Months)');
      setBadgeRequirements(
        config.verificationBadgeRequirements ||
          '1. Active approved vendor store in ONELGA\n2. Valid National ID (NIN) or CAC registration\n3. Minimum 5 successful deliveries with 4.5+ star rating'
      );
      setBadgeInstructions(
        config.verificationBadgeInstructions ||
          'Pay badge verification fee into Ogba Marketplace designated settlement account or Paystack badge gateway.'
      );
    } catch (e) {
      console.error(e);
    }
  }

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    setBadgeLoading(true);
    setBadgeSaved(false);
    setBadgeError(null);

    try {
      const res = await savePlatformSettingsAction({
        verificationBadgePrice: badgePrice,
        verificationBadgePeriod: badgePeriod,
        verificationBadgeRequirements: badgeRequirements,
        verificationBadgeInstructions: badgeInstructions,
      });

      if (res.success) {
        setBadgeSaved(true);
        setTimeout(() => setBadgeSaved(false), 3000);
      } else {
        setBadgeError(res.error || 'Failed to save badge settings.');
      }
    } catch (err) {
      setBadgeError('Server error while saving badge settings.');
    } finally {
      setBadgeLoading(false);
    }
  };

  const handleSaveR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setR2Loading(true);
    setR2Saved(false);
    setR2Error(null);

    try {
      const res = await savePlatformSettingsAction({
        r2AccountId,
        r2AccessKeyId,
        r2SecretAccessKey,
        r2BucketName,
        r2PublicDomain,
      });

      if (res.success) {
        setR2Saved(true);
        setTimeout(() => setR2Saved(false), 3000);
      } else {
        setR2Error(res.error || 'Failed to save Cloudflare R2 storage credentials.');
      }
    } catch (err: any) {
      setR2Error('Server error while saving Cloudflare R2 settings.');
    } finally {
      setR2Loading(false);
    }
  };

  const handleAddCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;

    setCommunityError(null);
    setCommunitySuccess(null);
    setCommunityActionLoading(true);

    try {
      const res = await addCommunityAction({
        name: newCommunityName,
        lga: newCommunityLga,
      });

      if (res.success) {
        setCommunitySuccess(`Community "${newCommunityName.trim()}" added to database successfully!`);
        setNewCommunityName('');
        await loadCommunities();
      } else {
        setCommunityError(res.error || 'Failed to add community.');
      }
    } catch (err: any) {
      setCommunityError('Server error while adding community.');
    } finally {
      setCommunityActionLoading(false);
    }
  };

  const handleToggleCommunity = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleCommunityStatusAction({ id, isActive: !currentStatus });
      if (res.success) {
        await loadCommunities();
      } else {
        alert(res.error || 'Failed to update community status.');
      }
    } catch (err) {
      alert('Error updating community status.');
    }
  };

  const handleDeleteCommunity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove community "${name}" from the database?`)) return;

    try {
      const res = await deleteCommunityAction(id);
      if (res.success) {
        await loadCommunities();
      } else {
        alert(res.error || 'Failed to delete community.');
      }
    } catch (err) {
      alert('Error deleting community.');
    }
  };

  const handleSaveBrevo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrevoLoading(true);
    setBrevoSaved(false);
    setBrevoError(null);

    try {
      const res = await savePlatformSettingsAction({
        brevoApiKey,
        brevoSenderEmail,
        brevoSenderName,
      });

      if (res.success) {
        setBrevoSaved(true);
        setTimeout(() => setBrevoSaved(false), 3000);
      } else {
        setBrevoError(res.error || 'Failed to save Brevo configuration.');
      }
    } catch (err) {
      setBrevoError('Server error while saving Brevo configuration.');
    } finally {
      setBrevoLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError(null);
    setAddAdminSuccess(null);
    setAddAdminLoading(true);

    try {
      const res = await createAdminAccountAction({
        full_name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        role: newAdminRole,
      });

      if (res.success && res.admin) {
        setAddAdminSuccess(`Admin account for "${res.admin.full_name}" created successfully!`);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        setShowAddModal(false);
        await loadAdminList();
      } else {
        setAddAdminError(res.error || 'Failed to create administrator account.');
      }
    } catch (err) {
      setAddAdminError('An unexpected server error occurred.');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await changeAdminPasswordAction({
        email: currentAdminEmail,
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccess('Your administrator password has been updated securely in the database!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordError('Server error while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove administrator "${name}" from control_admin?`)) return;

    const res = await deleteAdminAccountAction(id, currentAdminEmail);
    if (res.success) {
      await loadAdminList();
    } else {
      alert(res.error || 'Failed to remove administrator.');
    }
  };

  return (
    <div className="flex-1 pb-16 bg-slate-50">
      <DashboardHeader
        title="Control-OMP Administration & Settings"
        subtitle="Manage Communities, Brevo SMS gateway, Control Owners, security credentials, and platform rates."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'communities'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Communities ({communities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('brevo')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'brevo'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Brevo SMS & Email</span>
          </button>
          <button
            onClick={() => setActiveTab('r2')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'r2'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloudflare R2 Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Control Admins ({adminList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'platform'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Commission & Rates</span>
          </button>
          <button
            onClick={() => setActiveTab('badge')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badge'
                ? 'bg-forest-850 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Verification Badge (Monetary)</span>
          </button>
        </div>

        {/* TAB: Communities Management (100% DB) */}
        {activeTab === 'communities' && (
          <div className="space-y-6">
            {/* Add Community Form Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-forest-850" />
                    Manually Add Community to Database
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Communities entered here appear immediately on the mobile app and website registration forms.
                  </p>
                </div>
                <button
                  onClick={loadCommunities}
                  className="p-2 text-slate-500 hover:text-forest-850 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Refresh from DB"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {communitySuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{communitySuccess}</span>
                </div>
              )}

              {communityError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{communityError}</span>
                </div>
              )}

              <form onSubmit={handleAddCommunity} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Community / Town Name
                  </label>
                  <input
                    type="text"
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    placeholder="e.g. Omoku, Egi, Obrikom"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    LGA / Region
                  </label>
                  <input
                    type="text"
                    value={newCommunityLga}
                    onChange={(e) => setNewCommunityLga(e.target.value)}
                    placeholder="e.g. Ogba/Egbema/Ndoni"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={communityActionLoading}
                    className="w-full py-2.5 px-4 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {communityActionLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Save Community to DB</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Communities Database Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Database Communities (`communities` Table)
                </h4>
                <span className="text-xs font-bold text-forest-850 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-100">
                  {communities.filter(c => c.is_active).length} Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Community Name</th>
                      <th className="px-5 py-3.5">LGA</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingCommunities ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400">
                          Loading communities from Supabase database...
                        </td>
                      </tr>
                    ) : communities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400">
                          No communities stored in the database yet. Add one using the form above!
                        </td>
                      </tr>
                    ) : (
                      communities.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-forest-600 shrink-0" />
                            <span>{item.name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            {item.lga}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleCommunity(item.id, item.is_active)}
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                                item.is_active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{item.is_active ? 'Active' : 'Disabled'}</span>
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteCommunity(item.id, item.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete community from DB"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Brevo SMS & Email Gateway Settings */}
        {activeTab === 'brevo' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-forest-850">
              <Mail className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">Brevo SMS & Email Gateway</h3>
            </div>
            <p className="text-xs text-slate-500">
              Configure your Brevo API key for delivering OTP SMS codes and customer order emails across Nigeria.
            </p>

            {brevoSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Brevo API configuration saved to database successfully!</span>
              </div>
            )}

            {brevoError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{brevoError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBrevo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Brevo API Key (`xkeysib-...`)
                </label>
                <input
                  type="password"
                  value={brevoApiKey}
                  onChange={(e) => setBrevoApiKey(e.target.value)}
                  placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtain from your Brevo Dashboard &rarr; SMTP & API &rarr; API Keys.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Brevo Sender Email (Verified in Brevo)
                </label>
                <input
                  type="email"
                  value={brevoSenderEmail}
                  onChange={(e) => setBrevoSenderEmail(e.target.value)}
                  placeholder="support@ogbamarketplace.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Brevo Sender Display Name / SMS Sender ID
                </label>
                <input
                  type="text"
                  value={brevoSenderName}
                  onChange={(e) => setBrevoSenderName(e.target.value)}
                  placeholder="OGBA MARKET PLACE"
                  maxLength={11}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  SMS Sender ID max 11 alphanumeric characters (e.g. OgbaMarket).
                </p>
              </div>

              <button
                type="submit"
                disabled={brevoLoading}
                className="w-full py-2.5 px-4 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {brevoLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Brevo Settings to Database</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB: Cloudflare R2 Storage Credentials */}
        {activeTab === 'r2' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-forest-850">
                <Cloud className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">Cloudflare R2 Object Storage</h3>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                S3 Compatible
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Configure your Cloudflare R2 credentials to store optimized brand logos, vendor assets, and media files with zero egress fees.
            </p>

            {r2Saved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cloudflare R2 storage credentials saved to database successfully!</span>
              </div>
            )}

            {r2Error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{r2Error}</span>
              </div>
            )}

            <form onSubmit={handleSaveR2} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cloudflare Account ID
                </label>
                <input
                  type="text"
                  value={r2AccountId}
                  onChange={(e) => setR2AccountId(e.target.value)}
                  placeholder="e.g. 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Found on the right sidebar of your Cloudflare Dashboard overview.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  R2 Access Key ID
                </label>
                <input
                  type="text"
                  value={r2AccessKeyId}
                  onChange={(e) => setR2AccessKeyId(e.target.value)}
                  placeholder="e.g. 9b8c7d6e5f4a3b2c1d0e..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  R2 Secret Access Key
                </label>
                <input
                  type="password"
                  value={r2SecretAccessKey}
                  onChange={(e) => setR2SecretAccessKey(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Generated in Cloudflare Dashboard &rarr; R2 Object Storage &rarr; Manage R2 API Tokens.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    R2 Bucket Name
                  </label>
                  <input
                    type="text"
                    value={r2BucketName}
                    onChange={(e) => setR2BucketName(e.target.value)}
                    placeholder="ogbamarketplace"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Public Domain / R2.dev URL
                  </label>
                  <input
                    type="text"
                    value={r2PublicDomain}
                    onChange={(e) => setR2PublicDomain(e.target.value)}
                    placeholder="https://pub-xxxxxx.r2.dev"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">How to enable Public Access on your Bucket:</span>
                <p>1. Open your Bucket in Cloudflare R2 &rarr; Settings &rarr; Public access.</p>
                <p>2. Enable <strong>R2.dev subdomain</strong> or connect your custom domain (e.g. <code>cdn.ogbamarketplace.com</code>).</p>
                <p>3. Paste the public URL above so uploaded brand logos can be loaded anywhere.</p>
              </div>

              <button
                type="submit"
                disabled={r2Loading}
                className="w-full py-2.5 px-4 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {r2Loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Cloudflare R2 Configuration to Database</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB: Control Owners & Admins Table */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Control Administrators (`control_admin` Table)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separate from public users. These accounts have elevated privileges to manage the marketplace.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-850 text-white text-xs font-bold hover:bg-forest-900 transition-all shadow-sm shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Administrator</span>
              </button>
            </div>

            {addAdminSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addAdminSuccess}</span>
              </div>
            )}

            {/* Admins Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Administrator</th>
                      <th className="px-5 py-3.5">Email Address</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAdmins ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400">
                          Loading administrator accounts from control_admin...
                        </td>
                      </tr>
                    ) : (
                      adminList.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-850 font-black text-xs flex items-center justify-center border border-forest-200">
                              {admin.full_name.charAt(0)}
                            </div>
                            <span>{admin.full_name}</span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">
                            {admin.email}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              admin.role === 'super_admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {admin.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {admin.email !== currentAdminEmail ? (
                              <button
                                onClick={() => handleDeleteAdmin(admin.id, admin.full_name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 italic">You</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Change Password */}
        {activeTab === 'security' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-forest-850">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">Change Administrator Password</h3>
            </div>
            <p className="text-xs text-slate-500">
              Update the master access password for account: <strong className="text-slate-800">{currentAdminEmail}</strong>
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 px-4 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save & Encrypt New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB: Commission & Rates */}
        {activeTab === 'platform' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-w-2xl">
            <div className="flex items-center gap-2.5 text-forest-850">
              <Percent className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-slate-900">Commission & Platform Rates</h3>
            </div>

            {platformSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Platform rates saved!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vendor Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">Deducted from gross merchant product sales</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Base Delivery Fee (₦)
                </label>
                <input
                  type="number"
                  value={baseDeliveryFee}
                  onChange={(e) => setBaseDeliveryFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">Standard dispatch fee within Omoku town</p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await savePlatformSettingsAction({ commissionRate, baseDeliveryFee });
                setPlatformSaved(true);
                setTimeout(() => setPlatformSaved(false), 2500);
              }}
              className="py-2 px-4 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Save Platform Rates to Database
            </button>
          </div>
        )}

        {/* TAB: Monetary Verification Badge Settings (100% DB) */}
        {activeTab === 'badge' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-w-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-forest-850">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Monetary Verification Badge Configuration
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Trust Checkmark
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              In Ogba Marketplace, <strong>Store KYC</strong> is the administrative approval that allows vendors to sell. In contrast, the <strong>Verification Badge</strong> is a premium, paid credibility trust badge (Golden/Green Checkmark) that appears next to the vendor's name on product detail pages and catalog listings.
            </p>

            {badgeSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verification Badge settings saved to database successfully!</span>
              </div>
            )}

            {badgeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{badgeError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBadge} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Badge Price (₦)
                  </label>
                  <input
                    type="number"
                    value={badgePrice}
                    onChange={(e) => setBadgePrice(e.target.value)}
                    placeholder="15000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Subscription or activation fee vendors pay for the verified badge.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Validity Duration
                  </label>
                  <input
                    type="text"
                    value={badgePeriod}
                    onChange={(e) => setBadgePeriod(e.target.value)}
                    placeholder="e.g. Annual (12 Months) or One-time"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Displayed to vendors before they pay.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Required Criteria to Earn the Badge
                </label>
                <textarea
                  rows={3}
                  value={badgeRequirements}
                  onChange={(e) => setBadgeRequirements(e.target.value)}
                  placeholder="e.g. 1. Active approved store in ONELGA&#10;2. Valid National ID (NIN)&#10;3. Minimum 5 successful deliveries"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Vendors must fulfill these criteria to apply for the badge.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Instructions & Bank Account
                </label>
                <textarea
                  rows={3}
                  value={badgeInstructions}
                  onChange={(e) => setBadgeInstructions(e.target.value)}
                  placeholder="Specify corporate bank account or payment instructions for vendors..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={badgeLoading}
                  className="py-2.5 px-5 bg-forest-850 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {badgeLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Badge Settings to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal: Add Administrator */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-forest-850" />
                Add New Administrator
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {addAdminError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {addAdminError}
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Chukwuemeka Eze"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@ogbamarketplace.ng"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Temporary Access Password
                </label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Administrative Role
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:bg-white"
                >
                  <option value="operations_manager">Operations Manager</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="support_agent">Support Agent</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAdminLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-forest-850 text-white hover:bg-forest-900 transition-all disabled:opacity-50"
                >
                  {addAdminLoading ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
