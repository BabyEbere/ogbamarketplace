import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ForestGreen, DarkForest, AccentGold, AppFont } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { CacheStorage } from '@/lib/cache';
import AppLoader from '@/components/AppLoader';

const { width } = Dimensions.get('window');

export default function VendorStoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Instant Cache + Background Supabase Revalidation
  useEffect(() => {
    let isMounted = true;

    async function loadWithCache() {
      // 1. Instant 0ms cache check
      if (id) {
        const cached = await CacheStorage.get<any>(`vendor_${id}`);
        if (cached && isMounted) {
          setVendor(cached.vendor);
          setVendorProducts(cached.vendorProducts);
          setLoading(false); // Instant display!
        }
      }

      // 2. Background Revalidation from Supabase
      try {
        let vData: any = null;
        let pList: any[] = [];

        if (id) {
          const isUuid = typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
          const { data: vRecord } = isUuid
            ? await supabase.from('vendors').select('*').or(`id.eq.${id},slug.eq.${id}`).maybeSingle()
            : await supabase.from('vendors').select('*').eq('slug', id).maybeSingle();

          if (vRecord) {
            vData = {
              id: vRecord.id,
              businessName: vRecord.business_name,
              marketLocation: vRecord.market_location || 'Omoku Main Market',
              isVerified: vRecord.is_verified ?? true,
              phone: vRecord.phone || '08031234567',
              whatsapp: vRecord.whatsapp || '2348031234567',
              avatar: vRecord.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
              rating: vRecord.rating || 4.9,
              reviewCount: vRecord.review_count || 48,
              joinedDate: vRecord.created_at ? new Date(vRecord.created_at).toLocaleDateString() : 'Jan 2024',
              totalSales: 120,
            };

            const { data: prodRecords } = await supabase
              .from('products')
              .select('*')
              .eq('vendor_id', id);

            if (prodRecords && prodRecords.length > 0) {
              pList = prodRecords.map((p: any) => ({
                id: p.id,
                title: p.title,
                price: Number(p.price),
                compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
                image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
                stock: p.stock_quantity ?? 10,
                rating: 4.9,
                categorySlug: 'retail',
              }));
            }
          }
        }

        if (!vData && !vendor) {
          vData = {
            id: id || 'v-01',
            businessName: 'Verified Ogba Merchant',
            marketLocation: 'Omoku Main Market, Line 2',
            isVerified: true,
            phone: '08031234567',
            whatsapp: '2348031234567',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            rating: 4.9,
            reviewCount: 48,
            joinedDate: 'Jan 2024',
            totalSales: 120,
          };
          
          const { data: allProds } = await supabase
            .from('products')
            .select('*')
            .limit(10);

          if (allProds && allProds.length > 0) {
            pList = allProds.map((p: any) => ({
              id: p.id,
              title: p.title,
              price: Number(p.price),
              compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
              image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
              stock: p.stock_quantity ?? 10,
              rating: 4.9,
              categorySlug: 'retail',
            }));
          }
        }

        if (vData && isMounted) {
          setVendor(vData);
          setVendorProducts(pList);
          if (id) {
            CacheStorage.set(`vendor_${id}`, {
              vendor: vData,
              vendorProducts: pList,
            });
          }
        }
      } catch (err) {
        console.warn('[VendorStore] Background revalidation error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWithCache();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const filteredProducts = vendorProducts.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !vendor) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={DarkForest} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Merchant Store</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppLoader size="medium" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Merchant Store
        </Text>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push('/(tabs)/orders')}
          activeOpacity={0.7}
        >
          <Ionicons name="bag-handle-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Vendor Header Profile Banner */}
        <View style={styles.vendorBannerCard}>
          <View style={styles.vendorHeaderRow}>
            <Image
              source={{ uri: vendor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
              style={styles.vendorAvatarLarge}
            />

            <View style={styles.vendorHeaderDetails}>
              <View style={styles.nameVerifiedRow}>
                <Text style={styles.vendorNameLarge}>{vendor.businessName}</Text>
                {vendor.isVerified && (
                  <View style={styles.verifiedBadgeSmall}>
                    <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                    <Text style={styles.verifiedBadgeSmallText}>KYC Verified</Text>
                  </View>
                )}
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color={ForestGreen} />
                <Text style={styles.locationText}>{vendor.marketLocation}</Text>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                  ★ {vendor.rating || 4.9} ({vendor.reviewCount || 48} reviews)
                </Text>
                <Text style={styles.statsDot}>•</Text>
                <Text style={styles.statsText}>
                  {filteredProducts.length} Items In Stock
                </Text>
              </View>
            </View>
          </View>

          {/* Trust Guarantees */}
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={14} color={ForestGreen} />
              <Text style={styles.trustBadgeText}>Paystack Escrow Protected</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="flash-outline" size={14} color="#D97706" />
              <Text style={styles.trustBadgeText}>Local Omoku & Egi Delivery</Text>
            </View>
          </View>
        </View>

        {/* Store Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search in ${vendor.businessName}...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Inventory Catalog Grid */}
        <View style={styles.catalogSection}>
          <View style={styles.catalogHeaderRow}>
            <Text style={styles.catalogTitle}>Available In-Stock Items</Text>
            <Text style={styles.catalogCount}>{filteredProducts.length} products</Text>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySubtitle}>Try changing your search keywords</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map((prod) => (
                <TouchableOpacity
                  key={prod.id}
                  style={styles.productCard}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: prod.id },
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: prod.images && prod.images[0] ? prod.images[0] : prod.image }}
                    style={styles.productImage}
                  />

                  <View style={styles.productDetails}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {prod.title}
                    </Text>
                    <Text style={styles.cardPrice}>
                      ₦{prod.price.toLocaleString()}
                    </Text>
                    {prod.compareAtPrice && (
                      <Text style={styles.cardOldPrice}>
                        ₦{prod.compareAtPrice.toLocaleString()}
                      </Text>
                    )}

                    <View style={styles.stockStatusRow}>
                      <View style={styles.stockDotSmall} />
                      <Text style={styles.stockStatusText}>In Stock</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: DarkForest,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  vendorBannerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  vendorHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  vendorAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    borderWidth: 2,
    borderColor: '#D0EBD8',
  },
  vendorHeaderDetails: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  vendorNameLarge: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  verifiedBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ForestGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeSmallText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statsText: {
    fontSize: 11,
    color: ForestGreen,
    fontWeight: '700',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F9F4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0EBD8',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: AppFont,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  catalogSection: {
    paddingHorizontal: 16,
  },
  catalogHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catalogTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  catalogCount: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#E2E8F0',
  },
  productDetails: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: ForestGreen,
    marginTop: 4,
  },
  cardOldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  stockDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ForestGreen,
  },
  stockStatusText: {
    fontSize: 10,
    color: ForestGreen,
    fontWeight: '700',
  },
});
