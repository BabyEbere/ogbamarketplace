import React from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ForestGreen, DarkForest, LightGreen, AccentGold, AppFont } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function AccountScreen() {
  const { user, vendor, isLoggedIn, logout } = useAuth();

  const handleVendorAction = () => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    if (user?.role === 'vendor' || vendor) {
      router.push('/vendor/dashboard');
    } else {
      router.push('/vendor/apply');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of OGBA MARKET PLACE?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleOpenHelpdesk = () => {
    const msg = encodeURIComponent('Hello Ogba Market Place Helpdesk, I need assistance with my account/order.');
    Linking.openURL(`https://wa.me/2348123456789?text=${msg}`).catch(() => {
      Alert.alert('Helpdesk', 'Call / SMS Community Helpdesk at: +234 812 345 6789 (Omoku Main Desk).');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkForest} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account & Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        {isLoggedIn && user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={26} color={ForestGreen} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{user.fullName}</Text>
                {user.role === 'vendor' && (
                  <View style={styles.vendorRoleTag}>
                    <Ionicons name="shield-checkmark" size={10} color="#059669" />
                    <Text style={styles.vendorRoleText}>Vendor</Text>
                  </View>
                )}
              </View>
              <Text style={styles.userPhone}>+234 {user.phoneNumber}</Text>
              <Text style={styles.userLocation}>
                <Ionicons name="location" size={10} color={ForestGreen} /> {user.area}, Rivers State
              </Text>
            </View>
          </View>
        ) : (
          /* Guest Banner */
          <TouchableOpacity style={styles.guestCard} onPress={() => router.push('/auth/login')}>
            <View style={styles.guestIconBox}>
              <Ionicons name="log-in-outline" size={26} color={ForestGreen} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.guestTitle}>Sign In / Create Account</Text>
              <Text style={styles.guestSub}>
                Sign in with SMS verification to manage escrow orders and sell as a vendor.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={ForestGreen} />
          </TouchableOpacity>
        )}

        {/* Vendor Banner CTA */}
        {user?.role === 'vendor' || vendor ? (
          <TouchableOpacity style={styles.vendorBannerActive} onPress={() => router.push('/vendor/dashboard')}>
            <View style={styles.vendorBannerIconBox}>
              <Ionicons name="storefront" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.vendorBannerTitle}>{vendor?.businessName || 'My Vendor Store'}</Text>
                <Ionicons name="checkmark-circle" size={14} color="#34D399" />
              </View>
              <Text style={styles.vendorBannerSub}>
                Manage products, inventory & incoming Paystack escrow orders.
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.vendorBannerCta} onPress={handleVendorAction}>
            <View style={styles.vendorCtaIconBox}>
              <Ionicons name="briefcase-outline" size={22} color={ForestGreen} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vendorCtaTitle}>Become a Verified Vendor (KYC)</Text>
              <Text style={styles.vendorCtaSub}>
                Sell farm produce, palm oil, electronics or clothes across Omoku & Egi.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              if (!isLoggedIn) router.push('/auth/login');
              else Alert.alert('Saved Address', `Default: ${user?.area || 'Omoku Central'}, Rivers State.`);
            }}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="location-outline" size={18} color="#475569" />
            </View>
            <Text style={styles.menuText}>Delivery Addresses (Omoku / Egi)</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="receipt-outline" size={18} color="#475569" />
            </View>
            <Text style={styles.menuText}>My Escrow Orders & Tracking</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="wallet-outline" size={18} color="#475569" />
            </View>
            <Text style={styles.menuText}>Wallet & Paystack Payment Methods</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleOpenHelpdesk}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </View>
            <Text style={styles.menuText}>Customer Support & WhatsApp Helpdesk</Text>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          {isLoggedIn && (
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.menuText, { color: '#DC2626' }]}>Log Out</Text>
              <Ionicons name="chevron-forward" size={16} color="#FCA5A5" />
            </TouchableOpacity>
          )}
        </View>

        {/* Community Info Footer */}
        <View style={styles.infoFooter}>
          <Text style={styles.infoFooterText}>
            OGBA MARKET PLACE Mobile • Version 2.4.0
          </Text>
          <Text style={styles.infoFooterSub}>
            Built for Omoku, Egi, Obrikom & Erema Communities • Rivers State
          </Text>
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: AppFont,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    fontFamily: AppFont,
  },
  vendorRoleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  vendorRoleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    fontFamily: AppFont,
  },
  userPhone: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: AppFont,
  },
  userLocation: {
    fontSize: 10,
    color: ForestGreen,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: AppFont,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ForestGreen,
    marginBottom: 12,
  },
  guestIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: ForestGreen,
    fontFamily: AppFont,
  },
  guestSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
    fontFamily: AppFont,
  },
  vendorBannerActive: {
    backgroundColor: ForestGreen,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: ForestGreen,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  vendorBannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: AppFont,
  },
  vendorBannerSub: {
    fontSize: 10,
    color: '#D1FAE5',
    marginTop: 2,
    lineHeight: 13,
    fontFamily: AppFont,
  },
  vendorBannerCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  vendorCtaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: LightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorCtaTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: ForestGreen,
    fontFamily: AppFont,
  },
  vendorCtaSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 13,
    fontFamily: AppFont,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    fontFamily: AppFont,
  },
  infoFooter: {
    alignItems: 'center',
    marginTop: 24,
  },
  infoFooterText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    fontFamily: AppFont,
  },
  infoFooterSub: {
    fontSize: 9,
    color: '#CBD5E1',
    marginTop: 2,
    fontFamily: AppFont,
  },
});
