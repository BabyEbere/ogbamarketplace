import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ForestGreen, DarkForest, LightGreen, AccentGold, AppFont } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function VendorDashboardScreen() {
  const { user, vendor, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'profile'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newComparePrice, setNewComparePrice] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newUnit, setNewUnit] = useState('Piece');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedCat, setSelectedCat] = useState<any>(null);

  // Brand Options
  const [hasBrand, setHasBrand] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [reqBrandName, setReqBrandName] = useState('');
  const [reqBrandWebsite, setReqBrandWebsite] = useState('');
  const [reqBrandDesc, setReqBrandDesc] = useState('');
  const [isRequestingBrand, setIsRequestingBrand] = useState(false);

  const [isSavingProduct, setIsSavingProduct] = useState(false);

  useEffect(() => {
    loadVendorProducts();
    loadCategoriesAndBrands();
  }, [vendor]);

  async function loadCategoriesAndBrands() {
    try {
      const [catRes, brandRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
      ]);

      if (catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
        if (!selectedCat) setSelectedCat(catRes.data[0]);
      }
      if (brandRes.data) {
        setBrands(brandRes.data);
      }
    } catch (err) {
      console.warn('Error loading categories/brands in mobile:', err);
    }
  }

  async function loadVendorProducts() {
    if (!vendor) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('Error loading vendor products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProduct = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a product title.');
      return;
    }

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price in Naira.');
      return;
    }

    if (!newImageUrl.trim()) {
      Alert.alert('Mandatory Image', 'A square product image is required. Please enter or select a photo URL.');
      return;
    }

    if (!vendor) {
      Alert.alert('Error', 'Vendor profile not found.');
      return;
    }

    setIsSavingProduct(true);
    try {
      const slug = `${newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

      const { data, error } = await supabase
        .from('products')
        .insert({
          vendor_id: vendor.id,
          category_id: selectedCat?.id || (categories[0]?.id || null),
          brand_id: hasBrand && selectedBrand ? selectedBrand.id : null,
          title: newTitle.trim(),
          slug,
          description: newDescription.trim() || `${newTitle} in stock in ${vendor.marketLocation}`,
          price: priceNum,
          compare_at_price: newComparePrice ? parseFloat(newComparePrice) : null,
          stock_quantity: parseInt(newStock) || 10,
          unit: newUnit.trim() || 'Piece',
          images: [newImageUrl.trim()],
          approval_status: 'pending', // Requires admin approval!
          is_active: false, // Inactive until approved!
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Notice', error.message || 'Product submission error.');
        return;
      }

      Alert.alert(
        'Submitted for Review',
        `"${newTitle}" was submitted to administrator for approval. It will become live on OGBA MARKET PLACE once verified!`
      );
      setIsAddModalOpen(false);
      // Reset fields
      setNewTitle('');
      setNewPrice('');
      setNewComparePrice('');
      setNewDescription('');
      setNewImageUrl('');
      setHasBrand(false);
      setSelectedBrand(null);
      loadVendorProducts();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to submit product for review.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleRequestBrand = async () => {
    if (!reqBrandName.trim()) {
      Alert.alert('Error', 'Please enter brand name.');
      return;
    }

    if (!vendor) return;

    setIsRequestingBrand(true);
    try {
      const { error } = await supabase.from('brand_requests').insert({
        vendor_id: vendor.id,
        brand_name: reqBrandName.trim(),
        category_id: selectedCat?.id || null,
        website_url: reqBrandWebsite.trim() || null,
        description: reqBrandDesc.trim() || null,
        status: 'pending',
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to submit brand request.');
      } else {
        Alert.alert('Success', 'Brand request submitted to administrator for catalog inclusion!');
        setReqBrandName('');
        setReqBrandWebsite('');
        setReqBrandDesc('');
        setIsBrandModalOpen(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request.');
    } finally {
      setIsRequestingBrand(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    Alert.alert('Delete Product', `Are you sure you want to permanently remove "${title}" from your store?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Attempt hard delete first
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) {
            // Soft delete so it never resurrects
            await supabase
              .from('products')
              .update({
                is_active: false,
                approval_status: 'declined',
                rejection_reason: 'Deleted by vendor',
              })
              .eq('id', id);
          }
          setProducts((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />

      {/* Header with Switch to Buyer Mode */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginLeft: 4, fontFamily: AppFont }}>
            Buyer Mode
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{vendor?.businessName || 'Vendor Portal'}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{vendor?.marketLocation || 'Omoku Main Market'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={styles.viewStoreBtn}
            onPress={() => {
              if (vendor) router.push(`/vendor/${vendor.slug || vendor.id}`);
            }}
          >
            <Ionicons name="eye-outline" size={13} color="#FFFFFF" />
            <Text style={styles.viewStoreText}>Preview</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Sales</Text>
          <Text style={styles.metricValue}>₦{(vendor?.totalSales || 0).toLocaleString()}</Text>
          <Text style={styles.metricSub}>Escrow Protected</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>In Stock Items</Text>
          <Text style={styles.metricValue}>{products.length}</Text>
          <Text style={styles.metricSub}>Live in Omoku</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Store Rating</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.metricValue}>{vendor?.rating || 5.0}</Text>
          </View>
          <Text style={styles.metricSub}>KYC Verified</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
          onPress={() => setActiveTab('products')}
        >
          <Ionicons name="cube-outline" size={16} color={activeTab === 'products' ? ForestGreen : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            My Products ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons name="receipt-outline" size={16} color={activeTab === 'orders' ? ForestGreen : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Escrow Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons name="storefront-outline" size={16} color={activeTab === 'profile' ? ForestGreen : '#64748B'} />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            Store Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'products' && (
          <View>
            {/* Add Product Trigger Button */}
            <TouchableOpacity
              style={styles.addProductBtn}
              onPress={() => setIsAddModalOpen(true)}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addProductBtnText}>+ Add New Product to Store</Text>
            </TouchableOpacity>

            {loading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator color={ForestGreen} />
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 8, fontFamily: AppFont }}>
                  Loading your product inventory...
                </Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bag-handle-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No products listed yet</Text>
                <Text style={styles.emptySub}>
                  Tap the button above to add farm produce, palm oil, electronics, or clothes to your store.
                </Text>
              </View>
            ) : (
              products.map((p) => (
                <View key={p.id} style={styles.productRowCard}>
                  <Image
                    source={{
                      uri: p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
                    }}
                    style={styles.productImg}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.productRowTitle} numberOfLines={2}>
                      {p.title}
                    </Text>
                    <Text style={styles.productRowPrice}>
                      ₦{Number(p.price).toLocaleString()} <Text style={{ fontSize: 10, color: '#64748B' }}>/ {p.unit || 'Unit'}</Text>
                    </Text>
                    <Text style={styles.productRowStock}>
                      Stock Quantity: <Text style={{ fontWeight: '800', color: ForestGreen }}>{p.stock_quantity ?? 10}</Text>
                    </Text>

                    {/* Moderation Status Badge */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      {p.approval_status === 'approved' ? (
                        <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="checkmark-circle" size={10} color="#059669" />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#059669', fontFamily: AppFont }}>Live in Store</Text>
                        </View>
                      ) : p.approval_status === 'declined' ? (
                        <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="alert-circle" size={10} color="#DC2626" />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626', fontFamily: AppFont }}>Declined</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="time" size={10} color="#D97706" />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#D97706', fontFamily: AppFont }}>Pending Approval</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteProduct(p.id, p.title)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            <View style={styles.ordersNoticeBox}>
              <Ionicons name="shield-checkmark" size={20} color={ForestGreen} />
              <Text style={styles.ordersNoticeText}>
                All customer orders are held in Paystack Escrow. You receive instant payouts into your settlement account once the rider confirms delivery.
              </Text>
            </View>

            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No pending escrow orders</Text>
              <Text style={styles.emptySub}>
                New orders placed by Omoku & Egi buyers will appear here in real time.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.profileCard}>
            <Text style={styles.profileSectionTitle}>Store & Settlement Info</Text>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Store Name:</Text>
              <Text style={styles.profileVal}>{vendor?.businessName}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Location:</Text>
              <Text style={styles.profileVal}>{vendor?.marketLocation}</Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>KYC Status:</Text>
              <View style={styles.kycBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                <Text style={styles.kycBadgeText}>Verified Merchant</Text>
              </View>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Merchant Phone:</Text>
              <Text style={styles.profileVal}>+234 {user?.phoneNumber}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                logout();
                router.replace('/(tabs)/account');
              }}
            >
              <Ionicons name="log-out-outline" size={16} color="#DC2626" />
              <Text style={styles.logoutBtnText}>Log Out of Vendor Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Product to Store</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Product Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Grade A Palm Oil (25L Jerrycan)"
                placeholderTextColor="#94A3B8"
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Department / Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, selectedCat?.id === cat.id && styles.chipActive]}
                      onPress={() => setSelectedCat(cat)}
                    >
                      <Text style={[styles.chipText, selectedCat?.id === cat.id && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Brand Question */}
            <View style={[styles.formGroup, { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 10 }]}>
              <Text style={[styles.inputLabel, { color: '#0F172A' }]}>Does this product have a brand?</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.chip, hasBrand && styles.chipActive]}
                  onPress={() => setHasBrand(true)}
                >
                  <Text style={[styles.chipText, hasBrand && styles.chipTextActive]}>Yes (Branded)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.chip, !hasBrand && styles.chipActive]}
                  onPress={() => {
                    setHasBrand(false);
                    setSelectedBrand(null);
                  }}
                >
                  <Text style={[styles.chipText, !hasBrand && styles.chipTextActive]}>No (Generic / Local Farm)</Text>
                </TouchableOpacity>
              </View>

              {hasBrand && (
                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.inputLabel, { fontSize: 10 }]}>Choose Brand:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                      {brands.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.chip, selectedBrand?.id === b.id && styles.chipActive]}
                          onPress={() => setSelectedBrand(b)}
                        >
                          <Text style={[styles.chipText, selectedBrand?.id === b.id && styles.chipTextActive]}>
                            {b.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={[styles.chip, { backgroundColor: LightGreen, borderColor: ForestGreen }]}
                        onPress={() => setIsBrandModalOpen(true)}
                      >
                        <Text style={[styles.chipText, { color: ForestGreen, fontWeight: '800' }]}>
                          + Request Brand
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Selling Price (₦) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="38000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newPrice}
                  onChangeText={setNewPrice}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Old Price (₦)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="42000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newComparePrice}
                  onChangeText={setNewComparePrice}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Stock Quantity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newStock}
                  onChangeText={setNewStock}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Unit (e.g. 25L, Bag, Piece)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="25 Litres"
                  placeholderTextColor="#94A3B8"
                  value={newUnit}
                  onChangeText={setNewUnit}
                />
              </View>
            </View>

            {/* Mandatory Square Image */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Product Photo URL (Mandatory Square 1:1) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                value={newImageUrl}
                onChangeText={setNewImageUrl}
              />

              {/* Square Preview */}
              {newImageUrl.trim().length > 0 && (
                <View style={{ marginTop: 8, alignItems: 'center' }}>
                  <Image
                    source={{ uri: newImageUrl.trim() }}
                    style={{ width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' }}
                  />
                  <Text style={{ fontSize: 9, color: '#64748B', marginTop: 3, fontFamily: AppFont }}>
                    Square Preview (1:1 Aspect Ratio)
                  </Text>
                </View>
              )}

              {/* Quick Preset Photos */}
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', marginBottom: 4, fontFamily: AppFont }}>
                  Or pick quick preset:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[
                      { label: 'Palm Oil', url: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=600&q=80' },
                      { label: 'Cooked Meal', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
                      { label: 'Electronics', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
                      { label: 'Farm Tubers', url: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=600&q=80' },
                    ].map((preset) => (
                      <TouchableOpacity
                        key={preset.label}
                        style={[styles.chip, newImageUrl === preset.url && styles.chipActive]}
                        onPress={() => setNewImageUrl(preset.url)}
                      >
                        <Text style={[styles.chipText, newImageUrl === preset.url && styles.chipTextActive]}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Product Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Describe freshness, origin, packaging, and delivery guidelines..."
                placeholderTextColor="#94A3B8"
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSavingProduct && { opacity: 0.7 }]}
              onPress={handleAddProduct}
              disabled={isSavingProduct}
            >
              {isSavingProduct ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Product for Admin Review</Text>
              )}
            </TouchableOpacity>
            <Text style={{ fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 6, fontFamily: AppFont }}>
              Admin will review and approve item before appearing in market.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Brand Request Modal */}
      <Modal visible={isBrandModalOpen} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsBrandModalOpen(false)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Request New Brand Addition</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#475569', marginBottom: 14, fontFamily: AppFont, lineHeight: 16 }}>
              Can't find your product's official brand in the directory? Submit a brand request. Administrators will review and add it.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Brand Official Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dangote, Nestlé, Sony, Samsung"
                placeholderTextColor="#94A3B8"
                value={reqBrandName}
                onChangeText={setReqBrandName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Brand Website (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://..."
                placeholderTextColor="#94A3B8"
                value={reqBrandWebsite}
                onChangeText={setReqBrandWebsite}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Description / Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="What kinds of products does this brand manufacture?"
                placeholderTextColor="#94A3B8"
                multiline
                value={reqBrandDesc}
                onChangeText={setReqBrandDesc}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isRequestingBrand && { opacity: 0.7 }]}
              onPress={handleRequestBrand}
              disabled={isRequestingBrand}
            >
              {isRequestingBrand ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Brand Request to Admin</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  headerSub: {
    color: '#D1FAE5',
    fontSize: 10,
    fontFamily: AppFont,
  },
  viewStoreBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewStoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: AppFont,
  },
  metricsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    fontFamily: AppFont,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: ForestGreen,
    marginVertical: 2,
    fontFamily: AppFont,
  },
  metricSub: {
    fontSize: 8,
    color: '#059669',
    fontWeight: '600',
    fontFamily: AppFont,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: ForestGreen,
  },
  tabText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: AppFont,
  },
  tabTextActive: {
    color: ForestGreen,
    fontWeight: '800',
  },
  content: {
    padding: 14,
    paddingBottom: 36,
  },
  addProductBtn: {
    backgroundColor: ForestGreen,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
    fontFamily: AppFont,
  },
  emptySub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
    fontFamily: AppFont,
  },
  productRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  productImg: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  productRowTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 15,
    fontFamily: AppFont,
  },
  productRowPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: ForestGreen,
    marginTop: 2,
    fontFamily: AppFont,
  },
  productRowStock: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontFamily: AppFont,
  },
  deleteBtn: {
    padding: 8,
  },
  ordersNoticeBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ordersNoticeText: {
    fontSize: 10,
    color: '#065F46',
    flex: 1,
    lineHeight: 14,
    fontFamily: AppFont,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    fontFamily: AppFont,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  profileLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: AppFont,
  },
  profileVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: AppFont,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  kycBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    fontFamily: AppFont,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: AppFont,
  },
  formGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    fontFamily: AppFont,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    fontFamily: AppFont,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: LightGreen,
    borderColor: ForestGreen,
  },
  chipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    fontFamily: AppFont,
  },
  chipTextActive: {
    color: ForestGreen,
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: ForestGreen,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: AppFont,
  },
});
