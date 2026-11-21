'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Package,
  Heart,
  Store,
  LogOut,
  LogIn,
  MapPin,
  Save,
  Check,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import CustomSelect from '@/components/CustomSelect';
import { useUser } from '@/context/UserContext';
import { useFavorites } from '@/context/FavoritesContext';
import { updateUserProfileAction } from '@/actions/auth';
import { getActiveCommunitiesAction } from '@/actions/communities';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, setUser, logout } = useUser();
  const { favoritesCount } = useFavorites();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [communities, setCommunities] = useState<string[]>(['Omoku']);
  const [community, setCommunity] = useState('Omoku');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    getActiveCommunitiesAction()
      .then((list) => {
        if (list && list.length > 0) {
          setCommunities(list.map((c) => c.name));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCommunity(user.community || 'Omoku');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    const res = await updateUserProfileAction({
      fullName,
      community,
      phone,
    });
    if (res.success && res.user) {
      setUser(res.user);
      setSavedMsg('Profile updated!');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '1.5rem 1rem 5rem', maxWidth: '780px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your account...
          </div>
        ) : !user ? (
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '2.5rem 1.5rem', textAlign: 'center', maxWidth: '480px', margin: '2rem auto' }}>
            <div style={{ width: 60, height: 60, borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <User size={28} />
            </div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.4rem' }}>Sign in to Your Account</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Access your profile, track orders, and check out faster across Omoku & Egi.
            </p>
            <Link
              href="/login?redirect=/account"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.88rem' }}
            >
              <LogIn size={16} />
              <span>Sign In / Register</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Card */}
            <div style={{ background: 'linear-gradient(135deg, #123E25, #1E5E3A)', color: '#FFFFFF', borderRadius: 'var(--radius-xl)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 54, height: 54, borderRadius: '9999px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 800 }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{user.fullName}</h1>
                  <div style={{ fontSize: '0.8rem', color: '#A7F3D0', marginTop: '0.15rem' }}>
                    {user.phone || user.email} • {user.community}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <Link href="/orders" style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.6rem', borderRadius: '12px' }}>
                  <Package size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>My Orders</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Track deliveries</div>
                </div>
              </Link>

              <Link href="/favorites" style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '0.6rem', borderRadius: '12px' }}>
                  <Heart size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Saved ({favoritesCount})</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Wishlist items</div>
                </div>
              </Link>

              <Link href="/vendor" style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#FEF3C7', color: '#B45309', padding: '0.6rem', borderRadius: '12px' }}>
                  <Store size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Vendor Portal</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sell your products</div>
                </div>
              </Link>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Profile & Delivery Preferences</h2>

              {savedMsg && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={15} />
                  <span>{savedMsg}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label htmlFor="account-community" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>Default Community Zone</label>
                <CustomSelect
                  id="account-community"
                  name="community"
                  value={community}
                  onChange={setCommunity}
                  placeholder="Select community"
                  icon={<MapPin size={15} />}
                  options={communities.map((c) => ({ value: c, label: c }))}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{ alignSelf: 'flex-start', background: 'var(--primary-green)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-full)', padding: '0.65rem 1.35rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      <MobileBottomNav activeTab="account" />
    </div>
  );
}

