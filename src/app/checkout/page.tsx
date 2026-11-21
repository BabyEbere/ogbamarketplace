'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Lock,
  ShoppingBag,
  RefreshCw,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import CustomSelect from '@/components/CustomSelect';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { createOrderAction } from '@/actions/orders';
import { getActiveCommunitiesAction } from '@/actions/communities';
import { calculateDeliveryFee, DELIVERY_FEES_BY_AREA, DeliveryArea } from '@/constants/delivery';

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user } = useUser();

  const [communities, setCommunities] = useState<string[]>(['Omoku']);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>('Omoku');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderReference: string;
    totalAmount: number;
    deliveryFee: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    getActiveCommunitiesAction()
      .then((list) => {
        if (list && list.length > 0) {
          const names = list.map((c) => c.name);
          setCommunities(names);
          if (!user?.community) setDeliveryArea(names[0]);
        }
      })
      .catch(() => {});
  }, [user?.community]);

  useEffect(() => {
    if (user) {
      if (!fullName && user.fullName) setFullName(user.fullName);
      if (!phone && user.phone) setPhone(user.phone);
      if (user.community) setDeliveryArea(user.community);
    }
  }, [user, fullName, phone]);

  const deliveryFee = calculateDeliveryFee(subtotal, deliveryArea);
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cartItems.length === 0) {
      setErrorMsg('Your cart is empty.');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please fill in your name, phone number, and delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const orderRef = `OGB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      if (paymentMethod === 'paystack') {
        try {
          const payRes = await fetch('/api/paystack/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user?.email || 'customer@ogbamarketplace.com.ng',
              amountNaira: total,
              reference: orderRef,
              callbackUrl: `${window.location.origin}/orders?ref=${orderRef}`,
              metadata: { fullName, phone, deliveryArea, deliveryAddress },
            }),
          });
          const payData = await payRes.json();
          if (payData.success && payData.authorizationUrl) {
            await createOrderAction({
              customerId: user?.id || `guest-${phone.replace(/[^0-9]/g, '')}`,
              items: cartItems,
              deliveryAddress: `${fullName.trim()} — ${deliveryAddress.trim()}`,
              deliveryArea,
              phone: phone.trim(),
              paymentMethod,
              paymentReference: orderRef,
            });
            window.location.href = payData.authorizationUrl;
            return;
          }
        } catch {
          // Fall through to standard escrow order creation if Paystack is not configured
        }
      }

      const res = await createOrderAction({
        customerId: user?.id || `guest-${phone.replace(/[^0-9]/g, '')}`,
        items: cartItems,
        deliveryAddress: `${fullName.trim()} — ${deliveryAddress.trim()}`,
        deliveryArea,
        phone: phone.trim(),
        paymentMethod,
        paymentReference: orderRef,
      });

      if (res.success) {
        // Save to local recent orders for instant tracking on /orders
        try {
          const existingRaw = localStorage.getItem('ogba_recent_orders');
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const newOrder = {
            order_reference: res.orderReference,
            total_amount: res.totalAmount,
            delivery_fee: res.deliveryFee,
            status: 'paid_in_escrow',
            payment_status: 'successful',
            delivery_area: deliveryArea,
            delivery_address: `${fullName.trim()} — ${deliveryAddress.trim()}`,
            delivery_phone: phone.trim(),
            created_at: new Date().toISOString(),
            items_count: cartItems.reduce((acc, i) => acc + i.quantity, 0),
          };
          localStorage.setItem('ogba_recent_orders', JSON.stringify([newOrder, ...existing].slice(0, 20)));
        } catch {
          // ignore storage failure
        }

        clearCart();
        setConfirmedOrder({
          orderReference: res.orderReference,
          totalAmount: res.totalAmount,
          deliveryFee: res.deliveryFee,
          message: res.message,
        });
      } else {
        setErrorMsg('Could not place your order. Please try again.');
      }
    } catch {
      setErrorMsg('An error occurred while creating your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '1.5rem 1rem 5rem' }}>
        {confirmedOrder ? (
          <div style={{ maxWidth: '540px', margin: '1.5rem auto', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '9999px', background: '#ECFDF5', color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={34} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Order Confirmed!
            </h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {confirmedOrder.message}
            </p>
            <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order Reference</span>
                <strong style={{ color: 'var(--primary-green)' }}>{confirmedOrder.orderReference}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Area</span>
                <strong>{deliveryArea}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Paid (Escrow)</span>
                <strong>₦{confirmedOrder.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/orders"
                style={{ background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.86rem' }}
              >
                Track My Order
              </Link>
              <Link
                href="/"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-main)', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.86rem' }}
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div style={{ maxWidth: '500px', margin: '2rem auto', background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '9999px', background: 'var(--bg-muted)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShoppingBag size={30} />
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Your cart is empty</h1>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Add fresh produce, electronics, or daily essentials before checking out.
            </p>
            <Link
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.86rem' }}
            >
              <ArrowLeft size={15} />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <ArrowLeft size={14} />
                  <span>Back to Marketplace</span>
                </Link>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Secure Checkout</h1>
              </div>
              {!user && (
                <Link href="/login?redirect=/checkout" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-green)', background: 'var(--primary-light)', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-full)' }}>
                  Sign in for faster checkout
                </Link>
              )}
            </div>

            {errorMsg && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '0.82rem', fontWeight: 600, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              {/* Delivery & Payment Form */}
              <form onSubmit={handlePlaceOrder} style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Truck size={18} color="var(--primary-green)" />
                  <span>Delivery Details</span>
                </h2>

                <div>
                  <label htmlFor="checkout-fullname" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Recipient Full Name *
                  </label>
                  <input
                    id="checkout-fullname"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Chinedu Okafor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-phone" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Phone Number (for rider dispatch) *
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem' }}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-area" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Community Zone *
                  </label>
                  <CustomSelect
                    id="checkout-area"
                    name="deliveryArea"
                    value={deliveryArea}
                    onChange={(val) => setDeliveryArea(val as DeliveryArea)}
                    placeholder="Select community"
                    options={communities.map((area) => ({
                      value: area,
                      label: area,
                      sublabel: `₦${(DELIVERY_FEES_BY_AREA[area] ?? 1500).toLocaleString()}`,
                    }))}
                  />
                </div>

                <div>
                  <label htmlFor="checkout-address" style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Street Address / Closest Landmark *
                  </label>
                  <textarea
                    id="checkout-address"
                    name="deliveryAddress"
                    rows={3}
                    required
                    placeholder="e.g. No. 14 Ahoada Road, opposite Omoku Central Junction"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.88rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <CreditCard size={17} color="var(--primary-green)" />
                    <span>Payment Method</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paystack')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentMethod === 'paystack' ? '2px solid var(--primary-green)' : '1px solid var(--border-light)',
                        background: paymentMethod === 'paystack' ? 'var(--primary-light)' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>Paystack Escrow</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Card, Transfer, USSD</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentMethod === 'wallet' ? '2px solid var(--primary-green)' : '1px solid var(--border-light)',
                        background: paymentMethod === 'wallet' ? 'var(--primary-light)' : '#FFFFFF',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-main)' }}>Pay on Delivery</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cash or Transfer</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="checkout-btn"
                  style={{ marginTop: '0.5rem' }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Complete Order • ₦{total.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Order Summary */}
              <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem' }}>
                  Order Summary ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {cartItems.map((item) => (
                    <div key={item.product.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ position: 'relative', width: 52, height: 52, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        <Image
                          src={item.product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                          alt={item.product.title}
                          fill
                          sizes="52px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Qty: {item.quantity} × ₦{item.product.price.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary-green)' }}>
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Subtotal</span>
                  <strong style={{ color: 'var(--text-main)' }}>₦{subtotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  <span>Local Delivery ({deliveryArea})</span>
                  <strong style={{ color: deliveryFee === 0 ? 'var(--primary-green)' : 'var(--text-main)' }}>
                    {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-green)' }}>₦{total.toLocaleString()}</span>
                </div>

                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: '#ECFDF5', color: '#065F46', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  <span>Buyer Protection: Payment is held in escrow until your order arrives safely.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}

