import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ForestGreen, DarkForest, AccentGold, AccentRed, AppFont } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { CacheStorage } from '@/lib/cache';
import AppLoader from '@/components/AppLoader';

interface ProductItem {
  id: string;
  title: string;
  price: string;
  oldPrice?: string;
  discount?: string;
  image: string;
  vendor: string;
  location: string;
  description?: string;
  category?: string;
  stock?: number;
  rating?: number;
}

export default function MobileHomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [brandsList, setBrandsList] = useState<{ id: string; name: string; slug: string; logoUrl?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [dealsList, setDealsList] = useState<ProductItem[]>([]);

  const retailCategories = [
    { id: 'cat-powerbanks', name: 'Power Banks', slug: 'power-banks', icon: 'battery-charging-outline' },
    { id: 'cat-phones', name: 'Phones & Gadgets', slug: 'phones-tablets', icon: 'phone-portrait-outline' },
    { id: 'cat-fashion', name: 'Clothes & Wear', slug: 'clothes-fashion', icon: 'shirt-outline' },
    { id: 'cat-cosmetics', name: 'Cosmetics & Skin', slug: 'cosmetics-skincare', icon: 'sparkles-outline' },
    { id: 'cat-electronics', name: 'Electronics & Solar', slug: 'electronics-solar', icon: 'tv-outline' },
    { id: 'cat-home', name: 'Home & Office', slug: 'home-office', icon: 'home-outline' },
    { id: 'cat-health', name: 'Health & Beauty', slug: 'health-beauty', icon: 'heart-outline' },
    { id: 'cat-computing', name: 'Laptops & PC', slug: 'computing-laptops', icon: 'laptop-outline' },
    { id: 'cat-grocery', name: 'Supermarket', slug: 'grocery-supermarket', icon: 'cart-outline' },
    { id: 'cat-garden', name: 'Garden & Outdoor', slug: 'garden-outdoors', icon: 'leaf-outline' },
    { id: 'cat-auto', name: 'Automobile Parts', slug: 'automobile-parts', icon: 'car-outline' },
    { id: 'cat-sports', name: 'Sporting Goods', slug: 'sporting-goods', icon: 'barbell-outline' },
    { id: 'cat-gaming', name: 'Gaming & PS5', slug: 'gaming-consoles', icon: 'game-controller-outline' },
    { id: 'cat-baby', name: 'Baby Products', slug: 'baby-products', icon: 'happy-outline' },
  ];

  // Instant Cache + Background Supabase Revalidation
  useEffect(() => {
    let isMounted = true;

    async function loadWithCache() {
      // 1. Instant 0ms cache check
      const cachedProducts = await CacheStorage.get<ProductItem[]>('explore_products');
      const cachedDeals = await CacheStorage.get<ProductItem[]>('explore_deals');

      if (cachedProducts && cachedProducts.length > 0 && isMounted) {
        setProductsList(cachedProducts);
        if (cachedDeals) setDealsList(cachedDeals);
        setLoading(false); // Instant display!
      }

      // 2. Background Revalidation (check for price updates, new stock, etc.)
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            title,
            price,
            compare_at_price,
            images,
            description,
            stock_quantity,
            is_deal_of_day,
            vendor:vendors(business_name, market_location)
          `)
          .limit(40);

        if (!error && data && data.length > 0 && isMounted) {
          const formatted: ProductItem[] = data.map((p: any) => ({
            id: p.id,
            title: p.title,
            price: `₦${Number(p.price).toLocaleString()}`,
            oldPrice: p.compare_at_price ? `₦${Number(p.compare_at_price).toLocaleString()}` : undefined,
            discount: p.compare_at_price ? `-${Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100)}% off` : undefined,
            image: p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
            vendor: p.vendor?.business_name || 'Verified Tech Merchant',
            location: p.vendor?.market_location || 'Omoku Main Market',
            description: p.description || 'Original sealed product backed by full warranty and same-day delivery in Omoku & Egi.',
            stock: p.stock_quantity ?? 20,
            rating: 4.9,
          }));

          const deals = formatted.filter((p) => p.oldPrice).slice(0, 4);

          setProductsList(formatted);
          setDealsList(deals);

          // Save to local cache
          CacheStorage.set('explore_products', formatted);
          CacheStorage.set('explore_deals', deals);
        }

        // 3. Load active commercial brands for filtering
        const { data: bData } = await supabase
          .from('brands')
          .select('id, name, slug, logo_url')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (bData && isMounted) {
          setBrandsList(
            bData.map((b: any) => ({
              id: b.id,
              name: b.name,
              slug: b.slug,
              logoUrl: b.logo_url,
            }))
          );
        }
      } catch (err) {
        console.warn('[Explore] Background revalidation error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWithCache();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrand === 'all' ||
      p.title.toLowerCase().includes(selectedBrand.toLowerCase());
    return matchesSearch && matchesBrand;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />

      {/* Top Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 140, height: 36, resizeMode: 'contain' }}
            />
          </View>

          <View style={styles.headerIconsRow}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="cart-outline" size={21} color="#FFFFFF" />
              {cartCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phones, laptops, solar, clothes..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories Horizontal Grid */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Shop by Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {retailCategories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                  onPress={() => setSelectedCategory(isSelected ? 'all' : cat.slug)}
                >
                  <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleActive]}>
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={isSelected ? '#FFFFFF' : ForestGreen}
                    />
                  </View>
                  <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Brands Horizontal Filter Bar */}
        {brandsList.length > 0 && (
          <View style={styles.brandFilterSection}>
            <View style={styles.brandFilterHeader}>
              <Text style={styles.brandFilterTitle}>Shop by Brand</Text>
              {selectedBrand !== 'all' && (
                <TouchableOpacity onPress={() => setSelectedBrand('all')} activeOpacity={0.7}>
                  <Text style={styles.brandFilterReset}>Clear Filter</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandFilterScroll}
            >
              <TouchableOpacity
                style={[styles.brandChip, selectedBrand === 'all' && styles.brandChipActive]}
                onPress={() => setSelectedBrand('all')}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.brandChipText,
                    selectedBrand === 'all' && styles.brandChipTextActive,
                  ]}
                >
                  All Brands
                </Text>
              </TouchableOpacity>
              {brandsList.map((brand) => {
                const isSelected = selectedBrand === brand.slug;
                return (
                  <TouchableOpacity
                    key={brand.id}
                    style={[styles.brandChip, isSelected && styles.brandChipActive]}
                    onPress={() => setSelectedBrand(isSelected ? 'all' : brand.slug)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.brandChipText,
                        isSelected && styles.brandChipTextActive,
                      ]}
                    >
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Flash Deals Carousel */}
        {dealsList.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Flash Deals & Discounts</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
              {dealsList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dealCard}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: item.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  {item.discount && (
                    <View style={styles.dealBadge}>
                      <Text style={styles.dealBadgeText}>{item.discount}</Text>
                    </View>
                  )}
                  <Image source={{ uri: item.image }} style={styles.dealImage} />
                  <Text style={styles.dealTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.dealPrice}>{item.price}</Text>
                  {item.oldPrice && <Text style={styles.dealOldPrice}>{item.oldPrice}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Marketplace Items</Text>
          </View>

          {loading ? (
            <AppLoader message="Connecting to Omoku & Egi merchants..." />
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productCard}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: item.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.image }} style={styles.productImage} />
                  <View style={styles.productDetails}>
                    <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.productPrice}>{item.price}</Text>
                    <Text style={styles.productVendor} numberOfLines={1}>{item.vendor}</Text>
                    
                    <TouchableOpacity
                      style={styles.addCartBtn}
                      onPress={() => setCartCount((prev) => prev + 1)}
                    >
                      <Ionicons name="cart-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.addCartBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: DarkForest,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    backgroundColor: ForestGreen,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandSub: {
    color: '#A7F3D0',
    fontSize: 8,
    fontWeight: '700',
  },
  headerIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: AccentGold,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    padding: 0,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  categoriesSection: {
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 80,
  },
  categoryCardActive: {
    borderColor: ForestGreen,
    backgroundColor: '#EBF7EE',
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: ForestGreen,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  categoryNameActive: {
    color: ForestGreen,
    fontWeight: '800',
  },
  sectionContainer: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  dealsScroll: {
    gap: 10,
  },
  dealCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  dealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: AccentRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  dealBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dealImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 6,
  },
  dealTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  dealPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: ForestGreen,
    marginTop: 2,
  },
  dealOldPrice: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productImage: {
    width: '100%',
    height: 110,
  },
  productDetails: {
    padding: 10,
  },
  productTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 15,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: ForestGreen,
    marginTop: 4,
  },
  productVendor: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ForestGreen,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  addCartBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 18,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: '#F1F5F9',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 14,
  },
  modalContent: {
    paddingBottom: 20,
  },
  modalVendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBF7EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  modalVendorText: {
    fontSize: 11,
    fontWeight: '700',
    color: ForestGreen,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 22,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 8,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: ForestGreen,
  },
  modalOldPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalStockText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modalDescHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalAddCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ForestGreen,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  modalAddCartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  brandFilterSection: {
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  brandFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandFilterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandFilterReset: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  brandFilterScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  brandChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandChipActive: {
    backgroundColor: ForestGreen,
    borderColor: DarkForest,
  },
  brandChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  brandChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
