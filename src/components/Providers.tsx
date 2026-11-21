'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CartProvider, useCart } from '@/context/CartContext';
import { UserProvider } from '@/context/UserContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import CartDrawer from '@/components/CartDrawer';

function GlobalCartDrawer() {
  const router = useRouter();
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart } = useCart();

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
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
    <UserProvider>
      <FavoritesProvider>
        <CartProvider>
          {children}
          <GlobalCartDrawer />
        </CartProvider>
      </FavoritesProvider>
    </UserProvider>
  );
}
