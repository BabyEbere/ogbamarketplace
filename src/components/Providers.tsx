'use client';

import React from 'react';
import { CartProvider, useCart } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';

function GlobalCartDrawer() {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart } = useCart();

  const handleCheckout = () => {
    window.location.href = '/checkout';
  };

  return (
    <CartDrawer
      isOpen={isCartOpen}
      onClose={closeCart}
      items={cartItems}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeFromCart}
      onCheckout={handleCheckout}
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <GlobalCartDrawer />
    </CartProvider>
  );
}
