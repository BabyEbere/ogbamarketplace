import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ForestGreen, DarkForest, AppFont } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { CacheStorage } from '@/lib/cache';
import AppLoader from '@/components/AppLoader';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon: string;
  iconType?: 'ionic' | 'material';
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWithCache() {
      // 1. Instant 0ms cache check
      const cached = await CacheStorage.get<CategoryItem[]>('all_categories');
      if (cached && cached.length > 0 && isMounted) {
        setCategories(cached);
        setLoading(false); // Instant display!
      }

      // 2. Background Revalidation from Supabase
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
          const mapped: CategoryItem[] = data.map((cat: any) => {
            let iconName = 'grid-outline';
            if (cat.slug.includes('power')) iconName = 'battery-charging-outline';
            else if (cat.slug.includes('phone')) iconName = 'phone-portrait-outline';
            else if (cat.slug.includes('cloth') || cat.slug.includes('fashion')) iconName = 'shirt-outline';
            else if (cat.slug.includes('cosmetic')) iconName = 'sparkles-outline';
            else if (cat.slug.includes('elec') || cat.slug.includes('tv')) iconName = 'tv-outline';
            else if (cat.slug.includes('home')) iconName = 'home-outline';
            else if (cat.slug.includes('health')) iconName = 'heart-outline';
            else if (cat.slug.includes('comput') || cat.slug.includes('laptop')) iconName = 'laptop-outline';
            else if (cat.slug.includes('groc')) iconName = 'cart-outline';
            else if (cat.slug.includes('garden')) iconName = 'leaf-outline';
            else if (cat.slug.includes('auto')) iconName = 'car-outline';
            else if (cat.slug.includes('sport')) iconName = 'barbell-outline';
            else if (cat.slug.includes('gam')) iconName = 'game-controller-outline';
            else if (cat.slug.includes('baby')) iconName = 'happy-outline';

            return {
              id: cat.id,
              name: cat.name,
              slug: cat.slug,
              count: 45,
              icon: iconName,
            };
          });

          setCategories(mapped);
          CacheStorage.set('all_categories', mapped);
        }
      } catch (err) {
        console.warn('[Categories] Background revalidation error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWithCache();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Commercial Departments</Text>
        <Text style={styles.headerSubtitle}>Verified retailers & merchants across Ogba / Egi</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AppLoader message="Loading Ogba & Egi commercial departments..." />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)')}
            >
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon as any} size={22} color={ForestGreen} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.categoryTitle}>{item.name}</Text>
                <Text style={styles.categoryCount}>{item.count} items available for fast delivery</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: DarkForest,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  headerSubtitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontFamily: AppFont,
    marginTop: 3,
  },
  list: {
    padding: 16,
    paddingBottom: 90,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EBF7EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: AppFont,
  },
  categoryCount: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: AppFont,
    marginTop: 2,
  },
});
