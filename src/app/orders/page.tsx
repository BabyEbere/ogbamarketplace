'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, ArrowLeft, Truck, CheckCircle2, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useUser } from '@/context/UserContext';
import { getCustomerOrdersAction, lookupOrderByRefAction } from '@/actions/orders';

export default function OrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refQuery, setRefQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      let localOrders: any[] = [];
      try {
        const raw = localStorage.getItem('ogba_recent_orders');
        if (raw) localOrders = JSON.parse(raw);
      } catch {
        localOrders = [];
      }

      if (user) {
        const dbOrders = await getCustomerOrdersAction({
          customerId: user.id,
          phone: user.phone,
        });
        const merged = [...dbOrders];
        localOrders.forEach((loc) => {
          if (!merged.some((m) => m.order_reference === loc.order_reference)) {
            merged.push(loc);
          }
        });
        setOrders(merged);
      } else {
        setOrders(localOrders);
      }
      setLoading(false);
    }
    loadOrders();
  }, [user]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupMessage(null);
    setLookupResult(null);
    if (!refQuery.trim()) return;

    const clean = refQuery.trim().toUpperCase();
    const localMatch = orders.find((o) => o.order_reference?.toUpperCase() === clean);
    if (localMatch) {
      setLookupResult(localMatch);
      return;
    }

    const dbMatch = await lookupOrderByRefAction(clean);
    if (dbMatch) {
      setLookupResult(dbMatch);
    } else {
      setLookupMessage(`No order found with reference "${clean}".`);
    }
  };

  const renderStatusBadge = (status: string) => {
    const normalized = (status || 'pending').toLowerCase();
    if (normalized === 'delivered') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ECFDF5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
          <CheckCircle2 size={12} /> Delivered
        </span>
      );
    }
    if (normalized === 'in_transit') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#EFF6FF', color: '#2563EB', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
          <Truck size={12} /> In Transit
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#FEF3C7', color: '#B45309', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700 }}>
        <Clock size={12} /> {status?.replace(/_/g, ' ') || 'In Escrow'}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <Navbar />

      <main className="container" style={{ flex: 1, padding: '1.5rem 1rem 5rem', maxWidth: '860px' }}>
        <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
          <ArrowLeft size={14} />
          <span>Back to Marketplace</span>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>My Orders & Tracking</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Track your deliveries across Omoku, Egi, Obrikom & Erema.
            </p>
          </div>
          {!user && (
            <Link href="/login?redirect=/orders" style={{ background: 'var(--primary-light)', color: 'var(--primary-green)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
              Sign in to sync all orders
            </Link>
          )}
        </div>

        {/* Order Reference Lookup */}
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#FFFFFF', padding: '0.6rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
          <input
            type="text"
            placeholder="Track by Order Reference (e.g. OGB-2026-123456)"
            value={refQuery}
            onChange={(e) => setRefQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0.45rem 0.75rem', fontSize: '0.86rem' }}
          />
          <button
            type="submit"
            style={{ background: 'var(--primary-green)', color: '#FFFFFF', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Search size={14} />
            <span>Track</span>
          </button>
        </form>

        {lookupMessage && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {lookupMessage}
          </div>
        )}

        {lookupResult && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--primary-dark)' }}>{lookupResult.order_reference}</strong>
              {renderStatusBadge(lookupResult.status)}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#065F46' }}>
              Zone: <strong>{lookupResult.delivery_area}</strong> • Total: <strong>₦{Number(lookupResult.total_amount).toLocaleString()}</strong>
            </div>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: '9999px', background: 'var(--bg-muted)', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
              <Package size={26} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.35rem' }}>No orders yet</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              When you place an order, it will appear here for real-time tracking.
            </p>
            <Link
              href="/"
              style={{ display: 'inline-block', background: 'var(--primary-green)', color: '#FFFFFF', padding: '0.65rem 1.35rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.85rem' }}
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {orders.map((order) => (
              <div key={order.order_reference || order.id} style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {order.order_reference}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleString() : 'Recent Order'}
                    </div>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Delivery: <strong>{order.delivery_area}</strong> — {order.delivery_address}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Escrow Total</span>
                  <strong style={{ color: 'var(--primary-green)', fontSize: '0.95rem' }}>
                    ₦{Number(order.total_amount).toLocaleString()}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav activeTab="orders" />
    </div>
  );
}

