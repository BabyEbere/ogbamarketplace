import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// High-speed In-Memory Cache (Instant 0ms access)
const memoryCache: Map<string, { data: any; timestamp: number }> = new Map();

let isNativeStorageAvailable = true;

const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Web localStorage
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    // 2. Native AsyncStorage (with silent fallback if native module is null in Expo Go)
    if (!isNativeStorageAvailable) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      isNativeStorageAvailable = false;
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        return;
      }
    }

    if (!isNativeStorageAvailable) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      isNativeStorageAvailable = false;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        return;
      }
    }

    if (!isNativeStorageAvailable) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      isNativeStorageAvailable = false;
    }
  },
};

export const CacheStorage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      // 1. Check memory cache first (instant 0ms)
      if (memoryCache.has(key)) {
        return memoryCache.get(key)!.data as T;
      }

      // 2. Check persistent storage safely
      const raw = await SafeStorage.getItem(`omp_cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp });
        return parsed.data as T;
      }
      return null;
    } catch {
      return null;
    }
  },

  set: async <T>(key: string, data: T): Promise<void> => {
    try {
      const payload = {
        data,
        timestamp: Date.now(),
      };
      // Always store in memory cache immediately
      memoryCache.set(key, payload);

      // Persist safely in background
      await SafeStorage.setItem(`omp_cache_${key}`, JSON.stringify(payload));
    } catch {
      // Silent catch
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      memoryCache.delete(key);
      await SafeStorage.removeItem(`omp_cache_${key}`);
    } catch {
      // Silent catch
    }
  },
};
