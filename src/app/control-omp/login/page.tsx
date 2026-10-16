'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Building2
} from 'lucide-react';
import Image from 'next/image';
import { ADMIN_AUTH_KEY, getAdminSession } from '@/components/control-omp/AdminAuthGuard';
import { loginAdminAction } from '@/actions/admin-auth';

export default function ControlOmpLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (session && session.email) {
      router.replace('/control-omp');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await loginAdminAction({ email: cleanEmail, password: cleanPassword });
      if (result.success && result.user) {
        localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(result.user));
        setSuccessMsg('Access Granted! Redirecting to Control Center...');
        setTimeout(() => {
          router.replace('/control-omp');
        }, 500);
      } else {
        setLoading(false);
        setErrorMsg(result.error || 'Invalid administrator credentials. Access restricted.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('An unexpected authentication error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col justify-center items-center p-4 font-body text-slate-800">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link href="/" className="inline-block mb-2">
            <Image
              src="/logo.png"
              alt="OGBA MARKET PLACE"
              width={200}
              height={55}
              priority
              style={{ objectFit: 'contain', height: 50, width: 'auto' }}
            />
          </Link>
          <p className="text-xs font-semibold text-[#1E5E3A] uppercase tracking-wider mt-1">
            Control Center Administration
          </p>
        </div>

        {/* Clean White Card */}
        <div className="bg-white border border-[#D0EBD8] rounded-2xl p-7 shadow-lg shadow-emerald-950/5">
          <div className="pb-4 mb-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Control Owner Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized supervisor portal for Omoku, Egi & regional commerce
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#EBF7EE] border border-[#D0EBD8] flex items-center gap-2.5 text-[#123E25] text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#1E5E3A] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ogbamarketplace.ng"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E5E3A] focus:ring-2 focus:ring-[#1E5E3A]/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E5E3A] focus:ring-2 focus:ring-[#1E5E3A]/20 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#123E25] hover:bg-[#164E2E] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Omoku Node: Secured</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Lock className="w-3 h-3 text-[#1E5E3A]" />
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-[#123E25] transition-colors inline-flex items-center gap-1 font-semibold"
          >
            ← Return to Marketplace Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
