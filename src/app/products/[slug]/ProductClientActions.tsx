'use client';

import React, { useState } from 'react';
import { ShoppingCart, Zap, Plus, Minus, Check } from 'lucide-react';
import { Product } from '@/types/marketplace';
import { useCart } from '@/context/CartContext';

interface ProductClientActionsProps {
  product: Product;
}

export default function ProductClientActions({ product }: ProductClientActionsProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const { addToCart, openCart } = useCart();

  const handleIncrement = () => {
    if (quantity < (product.stock || 99)) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    openCart();
  };

  const totalPrice = product.price * quantity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Quantity Selector & Item Total */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Quantity:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              style={{
                background: 'none',
                border: 'none',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                color: quantity <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                padding: '4px',
              }}
              title="Decrease quantity"
            >
              <Minus size={15} />
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= (product.stock || 99)}
              style={{
                background: 'none',
                border: 'none',
                cursor: quantity >= (product.stock || 99) ? 'not-allowed' : 'pointer',
                display: 'flex',
                color: quantity >= (product.stock || 99) ? 'var(--text-muted)' : 'var(--text-main)',
                padding: '4px',
              }}
              title="Increase quantity"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Total Amount</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-green)' }}>
            ₦{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Buttons: Add to Cart + Buy Now */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
        <button
          onClick={handleAddToCart}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            padding: '0.9rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: isAdded ? '#059669' : 'var(--primary-green)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
          }}
        >
          {isAdded ? (
            <>
              <Check size={18} />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>Add to Cart</span>
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            padding: '0.9rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-orange)',
            color: 'white',
            fontWeight: 800,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
          }}
        >
          <Zap size={18} />
          <span>Buy Now</span>
        </button>
      </div>

      {/* Added Toast Alert */}
      {isAdded && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {quantity}x {product.title} added to your shopping cart.</span>
          <button
            onClick={openCart}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.82rem',
            }}
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  );
}
