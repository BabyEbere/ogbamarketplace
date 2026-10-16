'use client';

import React from 'react';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, Lock, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/types/marketplace';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal > 50000 ? 0 : items.length > 0 ? 1500 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={20} color="var(--primary-green)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Shopping Cart ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free delivery tier */}
        <div style={{ background: '#ECFDF5', padding: '0.65rem 1.25rem', borderBottom: '1px solid #A7F3D0', fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>
          {subtotal >= 50000 ? (
            <span>🎉 You qualify for <strong>FREE Delivery</strong> in Omoku & Egi!</span>
          ) : (
            <span>Add <strong>₦{(50000 - subtotal).toLocaleString()}</strong> more for FREE local delivery</span>
          )}
        </div>

        {/* Body Items */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '2rem 1rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-subtle)' }}>
                <ShoppingBag size={32} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Explore fresh produce and electronics from local vendors</p>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.product.id} 
                style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-light)' }}
              >
                <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <Image
                    src={item.product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={item.product.title}
                    fill
                    sizes="60px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.2rem' }}>
                    {item.product.title}
                  </h4>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Sold by: {item.product.vendorName}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary-green)', fontSize: '0.9rem' }}>
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-muted)', borderRadius: 'var(--radius-full)', padding: '2px 6px' }}>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-main)' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-main)' }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--accent-red)', marginLeft: '4px' }}
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>₦{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              <span>Local Delivery</span>
              <span style={{ fontWeight: 600, color: deliveryFee === 0 ? 'var(--primary-green)' : 'var(--text-main)' }}>
                {deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-green)' }}>₦{total.toLocaleString()}</span>
            </div>

            <button className="checkout-btn" onClick={onCheckout}>
              <Lock size={16} />
              <span>Proceed to Paystack Checkout</span>
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.5rem' }}>
              Secured Escrow • Payout released upon verified delivery
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
