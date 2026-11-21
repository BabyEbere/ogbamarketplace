'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  User,
  MapPin,
  Store,
  KeyRound,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import CustomSelect from '@/components/CustomSelect';
import { completeUserLoginAction } from '@/actions/auth';
import { getActiveCommunitiesAction } from '@/actions/communities';
import { useUser } from '@/context/UserContext';

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';
  const { setUser } = useUser();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [communities, setCommunities] = useState<string[]>(['Omoku']);
  const [community, setCommunity] = useState('Omoku');

  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [otpCode, setOtpCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  React.useEffect(() => {
    getActiveCommunitiesAction()
      .then((list) => {
        if (list && list.length > 0) {
          const names = list.map((c) => c.name);
          setCommunities(names);
          setCommunity(names[0]);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const requestOtp = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: authMethod === 'phone' ? phoneNumber.trim() : undefined,
          email: authMethod === 'email' ? email.trim() : undefined,
          name: fullName.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Could not send verification code.');
        return;
      }

      if (data.devCode) {
        setDevCodeHint(data.devCode);
      } else {
        setDevCodeHint(null);
      }

      setInfoMsg(data.message || 'Verification code sent.');
      setResendCooldown(30);
      setStep('otp');
    } catch {
      setErrorMsg('Network error sending verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'phone' && phoneNumber.trim().length < 10) {
      setErrorMsg('Please enter a valid Nigerian phone number (e.g. 08031234567).');
      return;
    }
    if (authMethod === 'email' && !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    await requestOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: authMethod === 'phone' ? phoneNumber.trim() : undefined,
          email: authMethod === 'email' ? email.trim() : undefined,
          code: otpCode.trim(),
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setErrorMsg(verifyData.message || 'Invalid or expired verification code.');
        return;
      }

      const loginRes = await completeUserLoginAction({
        phoneNumber: authMethod === 'phone' ? phoneNumber.trim() : undefined,
        email: authMethod === 'email' ? email.trim() : undefined,
        fullName: fullName.trim() || undefined,
        community,
      });

      if (!loginRes.success || !loginRes.user) {
        setErrorMsg(loginRes.message || 'Could not complete sign in.');
        return;
      }

      setUser(loginRes.user);
      router.push(redirectTo);
    } catch {
      setErrorMsg('An error occurred while verifying your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem 5rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', padding: '1.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary-green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <ShieldCheck size={26} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {step === 'identifier' ? 'Sign In or Create Account' : 'Enter Verification Code'}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {step === 'identifier'
                ? 'Shop faster, save favorites, and track your deliveries across Omoku & Egi.'
                : `Enter the 6-digit code sent to ${authMethod === 'phone' ? phoneNumber : email}`}
            </p>
          </div>

          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.8rem', fontWeight: 600, padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: '0.8rem', fontWeight: 600, padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              {infoMsg}
              {devCodeHint && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.76rem' }}>
                  Test OTP Code: <strong>{devCodeHint}</strong>
                </div>
              )}
            </div>
          )}

          {step === 'identifier' ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-muted)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: authMethod === 'phone' ? '#FFFFFF' : 'transparent',
                    color: authMethod === 'phone' ? 'var(--primary-green)' : 'var(--text-muted)',
                    boxShadow: authMethod === 'phone' ? 'var(--shadow-sm)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Phone size={14} />
                  <span>Phone OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: authMethod === 'email' ? '#FFFFFF' : 'transparent',
                    color: authMethod === 'email' ? 'var(--primary-green)' : 'var(--text-muted)',
                    boxShadow: authMethod === 'email' ? 'var(--shadow-sm)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Mail size={14} />
                  <span>Email OTP</span>
                </button>
              </div>

              {authMethod === 'phone' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-phone"
                      name="phoneNumber"
                      type="tel"
                      required
                      placeholder="e.g. 0803 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="login-fullname" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Full Name (for new accounts)
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-fullname"
                    name="fullName"
                    type="text"
                    placeholder="e.g. Chinedu Okafor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-community" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Community Delivery Zone
                </label>
                <CustomSelect
                  id="login-community"
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
                disabled={loading}
                style={{
                  marginTop: '0.25rem',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--primary-green)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  6-Digit Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="login-otp"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '1.1rem', letterSpacing: '0.25em', fontWeight: 800 }}
                  />
                </div>
                {authMethod === 'email' && (
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Didn&apos;t see the email? Please check your Spam or Promotions folder.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--primary-green)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={requestOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--text-subtle)' : 'var(--primary-green)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('identifier');
                    setOtpCode('');
                    setErrorMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change phone or email
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Are you a merchant?{' '}
            <Link href="/vendor/login" style={{ color: 'var(--primary-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Store size={13} />
              <span>Vendor Portal Login</span>
            </Link>
          </div>
        </div>
      </main>

      <MobileBottomNav activeTab="account" />
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <CustomerLoginContent />
    </Suspense>
  );
}

