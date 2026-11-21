'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/marketplace';

interface FavoritesContextType {
  favorites: Product[];
  toggleFavorite: (product: Product) => boolean;
  isFavorite: (productId: string) => boolean;
  removeFavorite: (productId: string) => void;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'ogba_marketplace_favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
  }, [favorites, isMounted]);

  const isFavorite = (productId: string) => {
    return favorites.some((p) => p.id === productId);
  };

  const toggleFavorite = (product: Product): boolean => {
    const exists = favorites.some((p) => p.id === product.id);
    if (exists) {
      setFavorites((prev) => prev.filter((p) => p.id !== product.id));
      return false;
    } else {
      setFavorites((prev) => [product, ...prev]);
      return true;
    }
  };

  const removeFavorite = (productId: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        removeFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

